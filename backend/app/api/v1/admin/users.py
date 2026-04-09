import math
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin
from app.core.response import APIResponse, success
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import UserOut, UserStatusUpdate, UserUpdate
from app.services import admin_service

router = APIRouter()


@router.get("", response_model=APIResponse)
async def list_users(
    role: str | None = Query(None, description="Filter by role: admin | vendor"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    users, total = await admin_service.list_users(
        db, admin.organization_id, role, page, per_page
    )
    return success(
        "Users retrieved",
        data=PaginatedResponse(
            items=[UserOut.model_validate(u) for u in users],
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page),
        ).model_dump(),
    )


@router.get("/{user_id}", response_model=APIResponse)
async def get_user(
    user_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await admin_service.get_user(db, user_id)
    return success("User retrieved", data=UserOut.model_validate(user).model_dump())


@router.put("/{user_id}", response_model=APIResponse)
async def update_user(
    user_id: str,
    payload: UserUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await admin_service.update_user(db, user_id, payload)
    return success("User updated", data=UserOut.model_validate(user).model_dump())


@router.patch("/{user_id}/status", response_model=APIResponse)
async def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user = await admin_service.update_user_status(db, user_id, payload)
    return success("User status updated", data=UserOut.model_validate(user).model_dump())
