from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.response import APIResponse, success
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserOut
from app.services import auth_service, email_service

router = APIRouter()
bearer_scheme = HTTPBearer()


@router.post("/login", response_model=APIResponse)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate a user (admin or vendor).
    Vendor accounts must have both verification_status and
    document_verify_status set to 'verified' to proceed.
    Returns access + refresh tokens and the user's role.
    """
    tokens = await auth_service.login(db, payload)
    return success("Login successful", data=tokens.model_dump())


@router.post("/register", response_model=APIResponse, status_code=201)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Self-registration for vendors.
    Account starts as unverified — admin must approve before login is allowed.
    """
    user = await auth_service.register_vendor(db, payload)
    return success(
        "Registration successful. Your account is pending admin verification.",
        data=UserOut.model_validate(user).model_dump(),
    )


@router.post("/refresh", response_model=APIResponse)
async def refresh(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Rotate tokens using a valid refresh token.
    The old refresh token is revoked and a new pair is issued.
    """
    tokens = await auth_service.refresh_access_token(db, payload.refresh_token)
    return success("Token refreshed", data=tokens.model_dump())


@router.post("/logout", response_model=APIResponse)
async def logout(
    payload: RefreshRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Blacklist the current access token and revoke the refresh token.
    Client must discard both tokens after calling this.
    """
    await auth_service.logout(
        db,
        access_token=credentials.credentials,
        refresh_token=payload.refresh_token,
    )
    return success("Logged out successfully")


@router.post("/forgot-password", response_model=APIResponse)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Sends a password reset email if the address is registered.
    Always returns 200 to prevent email enumeration.
    """
    result = await auth_service.initiate_password_reset(db, payload.email)
    if result:
        token, user = result
        # Fire-and-forget — don't let email failure break the response
        try:
            await email_service.send_password_reset(user.email, user.name, token)
        except Exception:
            pass
    return success("If that email is registered, a reset link has been sent.")


@router.post("/reset-password", response_model=APIResponse)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Validate the reset token and update the user's password."""
    await auth_service.complete_password_reset(db, payload.token, payload.new_password)
    return success("Password reset successfully. You can now log in.")
