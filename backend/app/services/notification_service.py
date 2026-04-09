from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.db.base import new_uuid


async def get_notifications(db: AsyncSession, user_id: str, limit: int = 20) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def get_unread_count(db: AsyncSession, user_id: str) -> int:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa
    )
    return len(result.scalars().all())


async def mark_as_read(db: AsyncSession, user_id: str, notification_id: str) -> None:
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(is_read=True)
    )
    await db.commit()


async def mark_all_read(db: AsyncSession, user_id: str) -> None:
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa
        .values(is_read=True)
    )
    await db.commit()


async def create_notification(
    db: AsyncSession,
    user_id: str,
    title: str,
    message: str,
    type: str = "info",
    link: str | None = None,
) -> Notification:
    notif = Notification(
        id=new_uuid(),
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        link=link,
        is_read=False,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


async def delete_notification(db: AsyncSession, user_id: str, notification_id: str) -> None:
    result = await db.execute(
        select(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
    )
    notif = result.scalar_one_or_none()
    if notif:
        await db.delete(notif)
        await db.commit()
