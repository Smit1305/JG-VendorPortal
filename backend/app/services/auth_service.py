import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequest, Conflict, Forbidden, NotFound, Unauthorized
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.organization import Organization
from app.models.token_blacklist import RefreshToken, TokenBlacklist
from app.models.user import User
from app.models.vendor_profile import VendorProfile
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.core.config import settings


# ── Helpers ───────────────────────────────────────────────────

async def _get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def _get_or_create_default_org(db: AsyncSession) -> Organization:
    """
    In a pure SaaS flow each vendor would supply an org slug.
    For now, auto-create a default org so vendor self-registration
    works without a separate org-creation step.
    """
    result = await db.execute(
        select(Organization).where(Organization.slug == "default")
    )
    org = result.scalar_one_or_none()
    if not org:
        org = Organization(name="Default Organization", slug="default")
        db.add(org)
        await db.flush()
    return org


# ── Public auth operations ────────────────────────────────────

async def login(db: AsyncSession, payload: LoginRequest) -> TokenResponse:
    user = await _get_user_by_email(db, payload.email)

    if not user or not verify_password(payload.password, user.password_hash):
        raise Unauthorized("Invalid email or password")

    if not user.is_active:
        raise Forbidden("Account is deactivated")

    # Only block admin accounts that are deactivated — vendors can log in
    # regardless of verification status so they can see their pending dashboard

    access_token = create_access_token(user.id, user.role, user.organization_id)
    refresh_token_str = create_refresh_token(user.id)

    # Rotate: revoke all previous refresh tokens for this user
    prev = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user.id,
            RefreshToken.is_revoked == False,  # noqa: E712
        )
    )
    for rt in prev.scalars().all():
        rt.is_revoked = True

    # Store new refresh token
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    db.add(RefreshToken(user_id=user.id, token=refresh_token_str, expires_at=expires_at))
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        role=user.role,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "mobile": user.mobile,
            "profile_photo": user.profile_photo,
            "verification_status": user.verification_status,
            "document_verify_status": user.document_verify_status,
            "role": user.role,
        },
    )


async def register_vendor(db: AsyncSession, payload: RegisterRequest) -> User:
    existing = await _get_user_by_email(db, payload.email)
    if existing:
        raise Conflict("Email is already registered")

    org = await _get_or_create_default_org(db)

    user = User(
        organization_id=org.id,
        name=payload.name,
        email=payload.email,
        mobile=payload.mobile,
        landlineno=payload.phone or None,
        whatsappno=payload.alt_contact or None,
        password_hash=hash_password(payload.password),
        role="vendor",
        verification_status="unverified",
        document_verify_status="pending",
    )
    db.add(user)
    await db.flush()

    # Create a partial vendor profile from registration fields
    profile = VendorProfile(
        user_id=user.id,
        company_name=payload.company_name,
        firm_type=payload.firm_type,
        company_status=payload.company_status,
        city=payload.city,
        state=payload.state,
        country=payload.country,
        district=payload.district,
        apartment=payload.apartment,
        zip_code=payload.pin_code,
        street_address=payload.address,
        country_code=payload.country_code,
        phone_landline=payload.phone_landline,
        fax=payload.fax,
        website=payload.website,
        gst_number=payload.gst_number,
        tan_number=payload.tan_number,
        pan_number=payload.pan_number,
        vat_number=payload.vat_number,
        msme_number=payload.msme_number,
        services=payload.services,
        contact_person_name=payload.contact_person_name,
        designation=payload.designation,
        business_description=payload.business_description,
        annual_turnover=payload.annual_turnover,
        email_address=payload.email,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(user)
    return user


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> TokenResponse:
    # Validate JWT structure first
    from jose import JWTError
    try:
        payload = decode_token(refresh_token)
    except JWTError:
        raise Unauthorized("Invalid refresh token")

    if payload.get("type") != "refresh":
        raise Unauthorized("Invalid token type")

    # Verify it exists in DB and is not revoked
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token == refresh_token,
            RefreshToken.is_revoked == False,  # noqa: E712
        )
    )
    stored = result.scalar_one_or_none()
    if not stored:
        raise Unauthorized("Refresh token is invalid or revoked")

    if stored.expires_at < datetime.now(timezone.utc):
        raise Unauthorized("Refresh token expired")

    # Load the user
    result = await db.execute(select(User).where(User.id == stored.user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise Unauthorized("User not found or inactive")

    # Rotate tokens
    stored.is_revoked = True
    new_access = create_access_token(user.id, user.role, user.organization_id)
    new_refresh_str = create_refresh_token(user.id)

    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    db.add(RefreshToken(user_id=user.id, token=new_refresh_str, expires_at=expires_at))
    await db.commit()

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh_str,
        role=user.role,
    )


async def logout(db: AsyncSession, access_token: str, refresh_token: str | None) -> None:
    from jose import JWTError
    try:
        payload = decode_token(access_token)
        expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    except JWTError:
        raise Unauthorized("Invalid token")

    # Blacklist the access token
    db.add(TokenBlacklist(token=access_token, expires_at=expires_at))

    # Revoke refresh token if provided
    if refresh_token:
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token == refresh_token)
        )
        stored = result.scalar_one_or_none()
        if stored:
            stored.is_revoked = True

    await db.commit()


# ── Password reset ────────────────────────────────────────────

async def initiate_password_reset(db: AsyncSession, email: str) -> str | None:
    """
    Generate a reset token and return it (caller sends the email).
    Returns None if email is not found — caller always returns 200
    to prevent email enumeration.
    """
    from app.models.password_reset import PasswordResetToken

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return None

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    db.add(PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at))
    await db.commit()
    return token, user


async def complete_password_reset(
    db: AsyncSession, token: str, new_password: str
) -> None:
    from app.models.password_reset import PasswordResetToken

    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token == token,
            PasswordResetToken.used == False,  # noqa: E712
        )
    )
    prt = result.scalar_one_or_none()
    if not prt:
        raise BadRequest("Invalid or expired reset token")
    if prt.expires_at < datetime.now(timezone.utc):
        raise BadRequest("Reset token has expired")

    result = await db.execute(select(User).where(User.id == prt.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFound("User not found")

    user.password_hash = hash_password(new_password)
    prt.used = True
    await db.commit()
