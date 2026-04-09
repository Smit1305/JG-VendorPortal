from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin
from app.core.response import APIResponse, success
from app.schemas.company import CompanyProfileOut, CompanyProfileUpdate
from app.services import company_service, file_service

router = APIRouter()


@router.get("", response_model=APIResponse)
async def get_company_profile(
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    profile = await company_service.get(db)
    data = CompanyProfileOut.model_validate(profile).model_dump() if profile else None
    return success("Company profile retrieved", data=data)


@router.put("", response_model=APIResponse)
async def upsert_company_profile(
    payload: CompanyProfileUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create or update the singleton company profile."""
    profile = await company_service.upsert(db, payload)
    return success(
        "Company profile updated",
        data=CompanyProfileOut.model_validate(profile).model_dump(),
    )


@router.post("/logo", response_model=APIResponse)
async def upload_company_logo(
    file: UploadFile = File(...),
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    path = await file_service.save_company_file(file, sub="logo")
    profile = await company_service.get(db)
    if profile:
        profile.company_logo = path
        await db.commit()
        await db.refresh(profile)
    return success("Logo uploaded", data={"path": path})


@router.post("/registration-image", response_model=APIResponse)
async def upload_registration_image(
    file: UploadFile = File(...),
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    path = await file_service.save_company_file(file, sub="registration")
    profile = await company_service.get(db)
    if profile:
        profile.registration_image = path
        await db.commit()
        await db.refresh(profile)
    return success("Registration image uploaded", data={"path": path})


@router.post("/pan-image", response_model=APIResponse)
async def upload_pan_image(
    file: UploadFile = File(...),
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    path = await file_service.save_company_file(file, sub="pan")
    profile = await company_service.get(db)
    if profile:
        profile.pan_card_image = path
        await db.commit()
        await db.refresh(profile)
    return success("PAN image uploaded", data={"path": path})
