from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_vendor
from app.core.response import APIResponse, success
from app.schemas.user import UserOut, UserPasswordUpdate, UserUpdate, VendorProfileFlatOut
from app.schemas.vendor import OnboardingChecklist, VendorProfileOut, VendorProfileUpdate
from app.services import profile_service
from app.services.file_service import delete_file, save_vendor_profile_photo

router = APIRouter()


# ── Public (vendor-accessible) document types ─────────────────

@router.get("/document-types", response_model=APIResponse)
async def get_document_types_for_vendor(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Return all document types — used by vendor document upload UI."""
    from app.services import document_type_service
    from app.schemas.document_type import DocumentTypeOut
    items = await document_type_service.list_all(db)
    return success(
        "Document types retrieved",
        data=[DocumentTypeOut.model_validate(d).model_dump() for d in items],
    )


# ── Vendor-accessible category endpoints ──────────────────────

@router.get("/categories/tree", response_model=APIResponse)
async def get_categories_tree_for_vendor(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Return full hierarchical category tree — used by vendor dashboard."""
    from app.services import category_service
    tree = await category_service.get_tree(db, vendor.organization_id)
    from app.schemas.category import CategoryTreeNode
    return success("Category tree retrieved", data=[n.model_dump() for n in tree])


@router.get("/categories", response_model=APIResponse)
async def get_categories_for_vendor(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Return flat category list — used by vendor product forms."""
    from app.services import category_service
    from app.schemas.category import CategoryOut
    cats = await category_service.list_flat(db, vendor.organization_id, label=None)
    return success(
        "Categories retrieved",
        data=[CategoryOut.model_validate(c).model_dump() for c in cats],
    )


@router.get("", response_model=APIResponse)
async def get_profile(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    user = await profile_service.get_full_profile(db, vendor.id)
    return success("Profile retrieved", data=VendorProfileFlatOut.from_user(user).model_dump())


@router.put("", response_model=APIResponse)
async def update_profile(
    payload: UserUpdate,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    user = await profile_service.update_profile(db, vendor.id, payload)
    # Reload with relations for flattened response
    user = await profile_service.get_full_profile(db, vendor.id)
    return success("Profile updated", data=VendorProfileFlatOut.from_user(user).model_dump())


@router.post("/photo", response_model=APIResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    allowed_images = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    from app.services.file_service import read_document_as_base64
    file_data = await read_document_as_base64(file, allowed_types=allowed_images)
    data_uri = file_data["data"]
    await profile_service.update_profile(
        db, vendor.id, UserUpdate(profile_photo=data_uri)
    )
    # Return only a flag — frontend fetches the image via /photo/view
    return success("Profile photo updated", data={"updated": True})


@router.get("/photo/view")
async def view_profile_photo(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Serve the profile photo as an actual image response."""
    import base64
    from fastapi.responses import Response
    user = await profile_service.get_full_profile(db, vendor.id)
    photo = user.profile_photo
    if not photo or not photo.startswith("data:"):
        return Response(status_code=204)
    try:
        header, b64data = photo.split(",", 1)
        mime = header.split(":")[1].split(";")[0]
        img_bytes = base64.b64decode(b64data)
        return Response(content=img_bytes, media_type=mime,
                       headers={"Cache-Control": "max-age=3600"})
    except Exception:
        return Response(status_code=204)


@router.put("/password", response_model=APIResponse)
async def change_password(
    payload: UserPasswordUpdate,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    await profile_service.change_password(db, vendor.id, payload)
    return success("Password changed successfully")


@router.get("/onboarding/checklist", response_model=APIResponse)
async def get_checklist(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    checklist = await profile_service.get_checklist(db, vendor.id)
    return success("Checklist", data=checklist.model_dump())


@router.get("/onboarding/core", response_model=APIResponse)
async def get_core_details(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    profile = await profile_service.get_core_details(db, vendor.id)
    data = VendorProfileOut.model_validate(profile).model_dump() if profile else None
    return success("Core details", data=data)


@router.post("/onboarding/core", response_model=APIResponse, status_code=201)
async def submit_core_details(
    payload: VendorProfileUpdate,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    profile = await profile_service.upsert_core_details(db, vendor.id, payload)
    return success(
        "Core details saved",
        data=VendorProfileOut.model_validate(profile).model_dump(),
    )


@router.put("/onboarding/core", response_model=APIResponse)
async def update_core_details(
    payload: VendorProfileUpdate,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    profile = await profile_service.upsert_core_details(db, vendor.id, payload)
    return success(
        "Core details updated",
        data=VendorProfileOut.model_validate(profile).model_dump(),
    )


@router.put("/onboarding", response_model=APIResponse)
async def update_onboarding_details(
    payload: VendorProfileUpdate,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Alias for /onboarding/core — accepts the same payload."""
    profile = await profile_service.upsert_core_details(db, vendor.id, payload)
    return success(
        "Onboarding details saved",
        data=VendorProfileOut.model_validate(profile).model_dump(),
    )
