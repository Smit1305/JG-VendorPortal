from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequest, NotFound
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryTreeNode, CategoryUpdate


# ── Helpers ───────────────────────────────────────────────────

async def _get(db: AsyncSession, cat_id: str) -> Category:
    result = await db.execute(select(Category).where(Category.id == cat_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise NotFound("Category not found")
    return cat


async def _load_all(db: AsyncSession, org_id: str) -> list[Category]:
    result = await db.execute(
        select(Category)
        .where(Category.organization_id == org_id)
        .order_by(Category.label, Category.name)
    )
    return result.scalars().all()


# ── Build tree in-memory (avoids N+1 queries) ─────────────────

def _node_from_orm(n: Category) -> CategoryTreeNode:
    """Build a CategoryTreeNode WITHOUT touching lazy-loaded ORM relationships."""
    return CategoryTreeNode(
        id=n.id,
        organization_id=n.organization_id,
        parent_id=n.parent_id,
        label=n.label,
        name=n.name,
        is_active=n.is_active,
        children=[],
    )


def _build_tree(nodes: list[Category]) -> list[CategoryTreeNode]:
    by_id = {n.id: _node_from_orm(n) for n in nodes}
    roots: list[CategoryTreeNode] = []
    for n in nodes:
        node = by_id[n.id]
        if n.parent_id and n.parent_id in by_id:
            by_id[n.parent_id].children.append(node)
        else:
            roots.append(node)
    return roots


# ── Public API ────────────────────────────────────────────────

async def get_tree(db: AsyncSession, org_id: str) -> list[CategoryTreeNode]:
    nodes = await _load_all(db, org_id)
    return _build_tree(nodes)


async def list_flat(
    db: AsyncSession, org_id: str, label: int | None = None
) -> list[Category]:
    filters = [Category.organization_id == org_id]
    if label is not None:
        filters.append(Category.label == label)
    result = await db.execute(
        select(Category).where(*filters).order_by(Category.label, Category.name)
    )
    return result.scalars().all()


async def get_children(db: AsyncSession, parent_id: str) -> list[Category]:
    result = await db.execute(
        select(Category)
        .where(Category.parent_id == parent_id, Category.is_active == True)  # noqa: E712
        .order_by(Category.name)
    )
    return result.scalars().all()


async def create(db: AsyncSession, payload: CategoryCreate) -> Category:
    if payload.parent_id:
        await _get(db, payload.parent_id)   # ensure parent exists

    cat = Category(**payload.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


async def update(db: AsyncSession, cat_id: str, payload: CategoryUpdate) -> Category:
    cat = await _get(db, cat_id)

    if payload.parent_id and payload.parent_id == cat_id:
        raise BadRequest("A category cannot be its own parent")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(cat, field, value)

    await db.commit()
    await db.refresh(cat)
    return cat


async def delete(db: AsyncSession, cat_id: str) -> None:
    cat = await _get(db, cat_id)
    await db.delete(cat)   # cascade deletes children via DB FK
    await db.commit()
