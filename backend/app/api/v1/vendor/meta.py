"""
Vendor-accessible read-only endpoints for document types and categories.
These are mounted at the root vendor prefix so they don't require admin auth.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_vendor
from app.core.response import APIResponse, success

router = APIRouter()


@router.get("/document-types", response_model=APIResponse)
async def get_document_types(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Return all document types — used by vendor upload forms."""
    from app.services import document_type_service
    from app.schemas.document_type import DocumentTypeOut
    items = await document_type_service.list_all(db)
    return success(
        "Document types retrieved",
        data=[DocumentTypeOut.model_validate(d).model_dump() for d in items],
    )


@router.get("/categories/tree", response_model=APIResponse)
async def get_category_tree(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Return hierarchical category tree — used by vendor product/business forms."""
    from app.services import category_service
    from app.schemas.category import CategoryTreeNode
    tree = await category_service.get_tree(db, vendor.organization_id)
    return success("Category tree retrieved", data=[n.model_dump() for n in tree])


@router.get("/categories", response_model=APIResponse)
async def get_categories_flat(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Return flat category list filtered by label if provided."""
    from app.services import category_service
    from app.schemas.category import CategoryOut
    cats = await category_service.list_flat(db, vendor.organization_id, label=None)
    return success(
        "Categories retrieved",
        data=[CategoryOut.model_validate(c).model_dump() for c in cats],
    )
