from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin
from app.core.response import APIResponse, success
from app.schemas.category import CategoryCreate, CategoryOut, CategoryTreeNode, CategoryUpdate
from app.services import category_service

router = APIRouter()


@router.get("/tree", response_model=APIResponse)
async def get_tree(
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Full hierarchical category tree for the organization."""
    tree = await category_service.get_tree(db, admin.organization_id)
    return success("Category tree retrieved", data=[n.model_dump() for n in tree])


@router.get("", response_model=APIResponse)
async def list_categories(
    label: int | None = Query(None, description="0=master 1=category 2=subcategory 3=product"),
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    cats = await category_service.list_flat(db, admin.organization_id, label)
    return success(
        "Categories retrieved",
        data=[CategoryOut.model_validate(c).model_dump() for c in cats],
    )


@router.get("/{category_id}/children", response_model=APIResponse)
async def get_children(
    category_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """AJAX cascade: fetch direct children of a given category node."""
    children = await category_service.get_children(db, category_id)
    return success(
        "Children retrieved",
        data=[CategoryOut.model_validate(c).model_dump() for c in children],
    )


@router.post("", response_model=APIResponse, status_code=201)
async def create_category(
    payload: CategoryCreate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    payload.organization_id = admin.organization_id
    cat = await category_service.create(db, payload)
    return success("Category created", data=CategoryOut.model_validate(cat).model_dump())


@router.put("/{category_id}", response_model=APIResponse)
async def update_category(
    category_id: str,
    payload: CategoryUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    cat = await category_service.update(db, category_id, payload)
    return success("Category updated", data=CategoryOut.model_validate(cat).model_dump())


@router.delete("/{category_id}", response_model=APIResponse)
async def delete_category(
    category_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    await category_service.delete(db, category_id)
    return success("Category deleted")
