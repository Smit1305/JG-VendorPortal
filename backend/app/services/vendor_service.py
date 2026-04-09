from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequest, NotFound
from app.models.user import User
from app.models.vendor_profile import VendorProfile
from app.models.vendor_document import VendorDocument
from app.schemas.vendor import (
    VendorDocumentUpdate,
    VendorProfileUpdate,
    VendorStatusUpdate,
)


# ── Helpers ───────────────────────────────────────────────────

async def _get_vendor(db: AsyncSession, user_id: str) -> User:
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.vendor_profile),
            selectinload(User.vendor_document),
            selectinload(User.service_provider),
            selectinload(User.products),
        )
        .where(User.id == user_id, User.role == "vendor")
    )
    user = result.scalar_one_or_none()
    if not user:
        raise NotFound("Vendor not found")
    return user


# ── List vendors ──────────────────────────────────────────────

async def list_vendors(
    db: AsyncSession,
    org_id: str,
    doc_status: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[User], int]:
    filters = [User.organization_id == org_id, User.role == "vendor"]
    if doc_status:
        filters.append(User.document_verify_status == doc_status)

    total = (
        await db.execute(select(func.count()).select_from(User).where(*filters))
    ).scalar_one()

    result = await db.execute(
        select(User)
        .options(selectinload(User.vendor_profile))
        .where(*filters)
        .order_by(User.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    return result.scalars().all(), total


async def get_vendor_detail(db: AsyncSession, user_id: str) -> User:
    return await _get_vendor(db, user_id)


# ── Status update (approve / reject / resubmit) ───────────────

async def update_vendor_status(
    db: AsyncSession,
    user_id: str,
    payload: VendorStatusUpdate,
    current_admin,
) -> User:
    allowed = ("verified", "rejected", "resubmit")
    if payload.document_verify_status not in allowed:
        raise BadRequest(f"Status must be one of: {allowed}")

    user = await _get_vendor(db, user_id)
    user.document_verify_status = payload.document_verify_status

    # Save rejection/resubmit reason on the user record
    if payload.document_verify_status == "rejected":
        user.reject_reason = payload.rejection_reason
        user.resubmit_reason = None
    elif payload.document_verify_status == "resubmit":
        user.resubmit_reason = payload.rejection_reason
        user.reject_reason = None
    else:
        user.reject_reason = None
        user.resubmit_reason = None

    # When docs verified, also mark account as verified
    if payload.document_verify_status == "verified":
        user.verification_status = "verified"

    await db.commit()
    await db.refresh(user)
    return user


# ── Core details (admin edit) ─────────────────────────────────

async def update_vendor_core_by_admin(
    db: AsyncSession, user_id: str, payload: VendorProfileUpdate
) -> VendorProfile:
    user = await _get_vendor(db, user_id)

    if not user.vendor_profile:
        profile = VendorProfile(user_id=user_id)
        db.add(profile)
        await db.flush()
        user = await _get_vendor(db, user_id)

    profile = user.vendor_profile
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


# ── Documents (admin upload/manage) ──────────────────────────

async def get_vendor_documents(db: AsyncSession, user_id: str) -> VendorDocument | None:
    result = await db.execute(
        select(VendorDocument).where(VendorDocument.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def upsert_vendor_documents(
    db: AsyncSession, user_id: str, payload: VendorDocumentUpdate
) -> VendorDocument:
    result = await db.execute(
        select(VendorDocument).where(VendorDocument.user_id == user_id)
    )
    doc = result.scalar_one_or_none()

    if not doc:
        doc = VendorDocument(user_id=user_id)
        db.add(doc)

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(doc, field, value)

    await db.commit()
    await db.refresh(doc)
    return doc


async def delete_document_key(
    db: AsyncSession, user_id: str, doc_type: str
) -> VendorDocument:
    result = await db.execute(
        select(VendorDocument).where(VendorDocument.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc or not doc.documents or doc_type not in doc.documents:
        raise NotFound(f"Document type '{doc_type}' not found")

    updated = dict(doc.documents)
    del updated[doc_type]
    doc.documents = updated

    await db.commit()
    await db.refresh(doc)
    return doc
