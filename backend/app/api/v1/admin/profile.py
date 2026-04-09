from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin
from app.core.response import APIResponse, success
from app.core.security import hash_password, verify_password
from app.core.exceptions import BadRequest
from app.models.user import User
from app.schemas.user import UserOut
from app.services import file_service

router = APIRouter()


@router.get("", response_model=APIResponse)
async def get_admin_profile(
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Return current admin's profile."""
    result = await db.execute(select(User).where(User.id == admin.id))
    user = result.scalar_one_or_none()
    return success("Profile retrieved", data=UserOut.model_validate(user).model_dump())


@router.put("", response_model=APIResponse)
async def update_admin_profile(
    payload: dict,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update admin profile: name, website_link, full_address."""
    result = await db.execute(select(User).where(User.id == admin.id))
    user = result.scalar_one_or_none()

    allowed = {"name", "website_link", "full_address"}
    for field in allowed:
        if field in payload and payload[field] is not None:
            setattr(user, field, payload[field])

    await db.commit()
    await db.refresh(user)
    return success("Profile updated", data=UserOut.model_validate(user).model_dump())


@router.put("/password", response_model=APIResponse)
async def change_admin_password(
    payload: dict,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Change admin password."""
    current_password = payload.get("current_password")
    new_password = payload.get("new_password")

    if not current_password or not new_password:
        raise BadRequest("current_password and new_password are required")
    if len(new_password) < 6:
        raise BadRequest("New password must be at least 6 characters")

    result = await db.execute(select(User).where(User.id == admin.id))
    user = result.scalar_one_or_none()

    if not verify_password(current_password, user.password_hash):
        raise BadRequest("Current password is incorrect")

    user.password_hash = hash_password(new_password)
    await db.commit()
    return success("Password changed successfully")


@router.post("/photo", response_model=APIResponse)
async def upload_admin_photo(
    file: UploadFile = File(...),
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Upload admin profile photo — stored as base64 in DB."""
    from app.services.file_service import read_document_as_base64
    allowed_images = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    file_data = await read_document_as_base64(file, allowed_types=allowed_images)
    data_uri = file_data["data"]
    result = await db.execute(select(User).where(User.id == admin.id))
    user = result.scalar_one_or_none()
    user.profile_photo = data_uri
    await db.commit()
    return success("Photo uploaded", data={"updated": True})
