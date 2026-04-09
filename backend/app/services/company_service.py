from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company_profile import CompanyProfile
from app.schemas.company import CompanyProfileUpdate


async def get(db: AsyncSession) -> CompanyProfile | None:
    result = await db.execute(select(CompanyProfile).limit(1))
    return result.scalar_one_or_none()


async def upsert(db: AsyncSession, payload: CompanyProfileUpdate) -> CompanyProfile:
    profile = await get(db)
    if not profile:
        profile = CompanyProfile()
        db.add(profile)

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile
