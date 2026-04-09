from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin
from app.core.response import APIResponse, success
from app.services import admin_service

router = APIRouter()


@router.get("", response_model=APIResponse)
async def get_dashboard(
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard stats scoped to the admin's organization."""
    stats = await admin_service.get_dashboard_stats(db, admin.organization_id)
    return success("Dashboard stats", data=stats)
