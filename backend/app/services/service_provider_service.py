from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import Conflict, NotFound
from app.models.service_provider import ServiceProvider
from app.schemas.service_provider import ServiceProviderCreate, ServiceProviderUpdate


async def get(db: AsyncSession, user_id: str) -> ServiceProvider | None:
    result = await db.execute(
        select(ServiceProvider).where(ServiceProvider.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession, user_id: str, payload: ServiceProviderCreate
) -> ServiceProvider:
    existing = await get(db, user_id)
    if existing:
        raise Conflict("Service provider profile already exists. Use PUT to update.")

    sp = ServiceProvider(user_id=user_id, **payload.model_dump())
    db.add(sp)
    await db.commit()
    await db.refresh(sp)
    return sp


async def update(
    db: AsyncSession, user_id: str, payload: ServiceProviderUpdate
) -> ServiceProvider:
    sp = await get(db, user_id)
    if not sp:
        raise NotFound("Service provider profile not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(sp, field, value)

    await db.commit()
    await db.refresh(sp)
    return sp
