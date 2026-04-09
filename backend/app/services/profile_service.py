from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFound
from app.core.security import hash_password, verify_password
from app.core.exceptions import BadRequest
from app.models.user import User
from app.models.vendor_profile import VendorProfile
from app.schemas.user import UserPasswordUpdate, UserUpdate
from app.schemas.vendor import OnboardingChecklist, VendorProfileCreate, VendorProfileUpdate


async def get_full_profile(db: AsyncSession, user_id: str) -> User:
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.vendor_profile),
            selectinload(User.vendor_document),
            selectinload(User.service_provider),
        )
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise NotFound("User not found")
    return user


async def update_profile(db: AsyncSession, user_id: str, payload: UserUpdate) -> User:
    result = await db.execute(
        select(User).options(selectinload(User.vendor_profile)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise NotFound("User not found")

    # Fields that live on the users table
    USER_FIELDS = {"name", "mobile", "profile_photo", "landlineno", "whatsappno"}
    # Fields that map to vendor_profiles table (frontend name → DB column)
    VENDOR_PROFILE_MAP = {
        "company_name": "company_name",
        "country": "country",
        "city": "city",
        "state": "state",
        "district": "district",
        "zip_code": "zip_code",
        "street_address": "street_address",
        "apartment": "apartment",
        "country_code": "country_code",
        "phone_landline": "phone_landline",
        "website": "website",
        "fax": "fax",
        "contact_person_name": "contact_person_name",
        "designation": "designation",
        "annual_turnover": "annual_turnover",
        "gst_number": "gst_number",
        "tan_number": "tan_number",
        "pan_number": "pan_number",
        "vat_number": "vat_number",
        "msme_number": "msme_number",
        "business_description": "business_description",
        "services": "services",
    }

    data = payload.model_dump(exclude_none=True)

    # Update user fields
    for field in USER_FIELDS:
        if field in data:
            setattr(user, field, data[field])

    # Update vendor_profile fields
    vendor_fields = {db_col: data[src] for src, db_col in VENDOR_PROFILE_MAP.items() if src in data}
    if vendor_fields:
        if not user.vendor_profile:
            vp = VendorProfile(user_id=user_id)
            db.add(vp)
            await db.flush()
            user.vendor_profile = vp
        for col, val in vendor_fields.items():
            setattr(user.vendor_profile, col, val)

    await db.commit()
    await db.refresh(user)
    return user


async def change_password(
    db: AsyncSession, user_id: str, payload: UserPasswordUpdate
) -> None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFound("User not found")
    if not verify_password(payload.current_password, user.password_hash):
        raise BadRequest("Current password is incorrect")
    user.password_hash = hash_password(payload.new_password)
    await db.commit()


# ── Core details (vendor self-edit) ──────────────────────────

async def get_core_details(db: AsyncSession, user_id: str) -> VendorProfile | None:
    result = await db.execute(
        select(VendorProfile).where(VendorProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def upsert_core_details(
    db: AsyncSession, user_id: str, payload: VendorProfileUpdate
) -> VendorProfile:
    result = await db.execute(
        select(VendorProfile).where(VendorProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = VendorProfile(user_id=user_id)
        db.add(profile)

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


# ── Onboarding checklist ──────────────────────────────────────

async def get_checklist(db: AsyncSession, user_id: str) -> OnboardingChecklist:
    user = await get_full_profile(db, user_id)
    profile = user.vendor_profile
    docs = user.vendor_document

    # Check all required document types are uploaded
    # Single-type: must have the key present
    # Multiple-type: must have at least one entry (non-empty array)
    all_docs_uploaded = False
    if docs and docs.documents:
        from sqlalchemy import select as sa_select
        from app.models.document_type import DocumentType
        result = await db.execute(
            sa_select(DocumentType).where(DocumentType.is_required == True)  # noqa
        )
        required_types = result.scalars().all()
        if required_types:
            uploaded = docs.documents
            all_docs_uploaded = all(
                dt.doc_type in uploaded and (
                    # Multiple: at least one entry in the array
                    (isinstance(uploaded[dt.doc_type], list) and len(uploaded[dt.doc_type]) > 0)
                    or
                    # Single: dict with a file key
                    (isinstance(uploaded[dt.doc_type], dict))
                )
                for dt in required_types
            )
        else:
            all_docs_uploaded = bool(docs.documents)

    # business_details: require employees + at least one address + at least one contact person
    business_complete = bool(
        docs
        and docs.number_of_employees is not None
        and (docs.registered_address or docs.head_office_address)
        and docs.contact_persons
        and len(docs.contact_persons) > 0
    )

    return OnboardingChecklist(
        core_details=bool(profile and profile.company_name),
        documents_uploaded=all_docs_uploaded,
        business_details=business_complete,
        product_details=bool(docs and docs.product_categories),
        account_verified=user.verification_status == "verified",
        documents_verified=user.document_verify_status == "verified",
    )
