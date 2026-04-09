from typing import AsyncGenerator

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import Forbidden, Unauthorized
from app.core.security import decode_token
from app.db.session import AsyncSessionLocal

bearer_scheme = HTTPBearer()


# ── Database session ──────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ── Token extraction ──────────────────────────────────────────

async def _get_token_payload(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from app.models.token_blacklist import TokenBlacklist

    token = credentials.credentials
    try:
        payload = decode_token(token)
    except JWTError:
        raise Unauthorized("Invalid or expired token")

    if payload.get("type") != "access":
        raise Unauthorized("Invalid token type")

    # Check blacklist
    result = await db.execute(
        select(TokenBlacklist).where(TokenBlacklist.token == token)
    )
    if result.scalar_one_or_none():
        raise Unauthorized("Token has been revoked")

    return payload


# ── Current user ──────────────────────────────────────────────

async def get_current_user(
    payload: dict = Depends(_get_token_payload),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import User

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise Unauthorized("User not found or inactive")

    return user


# ── Role guards ───────────────────────────────────────────────

async def require_admin(user=Depends(get_current_user)):
    if user.role != "admin":
        raise Forbidden("Admin access required")
    return user


async def require_vendor(user=Depends(get_current_user)):
    if user.role != "vendor":
        raise Forbidden("Vendor access required")
    return user


async def require_verified_vendor(user=Depends(require_vendor)):
    """
    Use this only for routes that need a fully approved vendor
    (e.g. product management, catalogue). Basic routes like
    dashboard, profile, documents use require_vendor instead.
    """
    if user.verification_status != "verified":
        raise Forbidden("Account not yet verified by admin")
    if user.document_verify_status != "verified":
        raise Forbidden("Documents not yet verified")
    return user
