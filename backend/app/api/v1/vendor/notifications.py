from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_vendor
from app.core.response import APIResponse, success
from app.services import notification_service

router = APIRouter()


@router.get("", response_model=APIResponse)
async def get_notifications(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    notifications = await notification_service.get_notifications(db, vendor.id)
    unread = await notification_service.get_unread_count(db, vendor.id)
    return success("Notifications retrieved", data={
        "items": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.type,
                "is_read": n.is_read,
                "link": n.link,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ],
        "unread_count": unread,
    })


@router.patch("/{notification_id}/read", response_model=APIResponse)
async def mark_read(
    notification_id: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    await notification_service.mark_as_read(db, vendor.id, notification_id)
    return success("Marked as read")


@router.patch("/read-all", response_model=APIResponse)
async def mark_all_read(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    await notification_service.mark_all_read(db, vendor.id)
    return success("All notifications marked as read")


@router.delete("/{notification_id}", response_model=APIResponse)
async def delete_notification(
    notification_id: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    await notification_service.delete_notification(db, vendor.id, notification_id)
    return success("Notification deleted")
