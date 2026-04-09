import math
from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_vendor
from app.core.response import APIResponse, success
from app.schemas.pagination import PaginatedResponse
from app.schemas.product import ProductCreate, ProductListOut, ProductOut, ProductUpdate
from app.services import product_service
from app.services.file_service import save_vendor_product_image

router = APIRouter()


@router.get("", response_model=APIResponse)
async def list_products(
    status: str | None = Query(None, description="active | inactive | draft"),
    search: str | None = Query(None, description="Search by product name"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=500),
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    products, total = await product_service.list_products(
        db, vendor.id, vendor.organization_id, status, page, per_page, search=search
    )
    return success(
        "Products retrieved",
        data=PaginatedResponse(
            items=[ProductListOut.model_validate(p) for p in products],
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page),
        ).model_dump(),
    )


@router.post("", response_model=APIResponse, status_code=201)
async def create_product(
    payload: ProductCreate,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    product = await product_service.create_product(
        db, vendor.id, vendor.organization_id, payload
    )
    return success("Product created", data=ProductOut.model_validate(product).model_dump())


@router.get("/{product_id}", response_model=APIResponse)
async def get_product(
    product_id: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    product = await product_service.get_product(db, product_id, vendor.id)
    return success("Product retrieved", data=ProductOut.model_validate(product).model_dump())


@router.put("/{product_id}", response_model=APIResponse)
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    product = await product_service.update_product(db, product_id, vendor.id, payload)
    return success("Product updated", data=ProductOut.model_validate(product).model_dump())


@router.delete("/{product_id}", response_model=APIResponse)
async def delete_product(
    product_id: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    await product_service.delete_product(db, product_id, vendor.id)
    return success("Product deleted")


@router.post("/{product_id}/images", response_model=APIResponse)
async def upload_product_images(
    product_id: str,
    thumbnail: UploadFile | None = File(None),
    gallery: list[UploadFile] = File(default=[]),
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    thumb_path = None
    gallery_paths = []

    if thumbnail:
        thumb_path = await save_vendor_product_image(
            thumbnail, vendor.organization_id, vendor.id
        )
    for img in gallery:
        path = await save_vendor_product_image(img, vendor.organization_id, vendor.id)
        gallery_paths.append(path)

    product = await product_service.attach_images(
        db, product_id, vendor.id,
        thumbnail=thumb_path,
        gallery=gallery_paths or None,
    )
    return success("Images uploaded", data=ProductOut.model_validate(product).model_dump())


@router.post("/import", response_model=APIResponse)
async def import_products(
    file: UploadFile = File(...),
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Bulk import products from an Excel file (.xlsx)."""
    contents = await file.read()
    result = await product_service.import_from_excel(
        db, vendor.id, vendor.organization_id, contents
    )
    return success(
        f"Import complete: {result['created']} created, {result['skipped']} skipped",
        data=result,
    )
