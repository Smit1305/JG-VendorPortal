import math
from io import BytesIO

import openpyxl
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import Forbidden, NotFound
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductImportRow, ProductUpdate


async def list_products(
    db: AsyncSession,
    vendor_id: str,
    org_id: str,
    status: str | None = None,
    page: int = 1,
    per_page: int = 20,
    search: str | None = None,
) -> tuple[list[Product], int]:
    filters = [Product.vendor_id == vendor_id, Product.organization_id == org_id]
    if status:
        filters.append(Product.status == status)
    if search:
        filters.append(Product.name.ilike(f"%{search}%"))

    total = (
        await db.execute(select(func.count()).select_from(Product).where(*filters))
    ).scalar_one()
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category))
        .where(*filters)
        .order_by(Product.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    return result.scalars().all(), total


async def get_product(db: AsyncSession, product_id: str, vendor_id: str) -> Product:
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFound("Product not found")
    if product.vendor_id != vendor_id:
        raise Forbidden("Access denied")
    return product


async def create_product(
    db: AsyncSession,
    vendor_id: str,
    org_id: str,
    payload: ProductCreate,
) -> Product:
    product = Product(
        vendor_id=vendor_id,
        organization_id=org_id,
        **payload.model_dump(),
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    # Re-fetch with category loaded so ProductOut serialization works
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product.id)
    )
    return result.scalar_one()


async def update_product(
    db: AsyncSession,
    product_id: str,
    vendor_id: str,
    payload: ProductUpdate,
) -> Product:
    product = await get_product(db, product_id, vendor_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(product, field, value)
    await db.commit()
    # Re-fetch with category loaded so ProductOut serialization works
    return await get_product(db, product_id, vendor_id)


async def delete_product(db: AsyncSession, product_id: str, vendor_id: str) -> None:
    product = await get_product(db, product_id, vendor_id)
    await db.delete(product)
    await db.commit()


# ── Excel import ──────────────────────────────────────────────

async def import_from_excel(
    db: AsyncSession,
    vendor_id: str,
    org_id: str,
    file_bytes: bytes,
) -> dict:
    wb = openpyxl.load_workbook(BytesIO(file_bytes), read_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(min_row=2, values_only=True))  # skip header
    created, skipped = 0, 0

    for row in rows:
        try:
            # Expected columns: name, category, regular_price, sale_price, description, sku_type
            name = str(row[0]).strip() if row[0] else None
            if not name:
                skipped += 1
                continue

            row_data = ProductImportRow(
                name=name,
                category=str(row[1]) if row[1] else None,
                regular_price=float(row[2]) if row[2] else None,
                sale_price=float(row[3]) if row[3] else None,
                description=str(row[4]) if row[4] else None,
                sku_type=str(row[5]).lower() if row[5] else "single",
            )

            product = Product(
                vendor_id=vendor_id,
                organization_id=org_id,
                name=row_data.name,
                regular_price=row_data.regular_price,
                sale_price=row_data.sale_price,
                description=row_data.description,
                sku_type=row_data.sku_type,
                status="draft",
            )
            db.add(product)
            created += 1
        except Exception:
            skipped += 1

    await db.commit()
    return {"created": created, "skipped": skipped, "total_rows": len(rows)}


async def attach_images(
    db: AsyncSession,
    product_id: str,
    vendor_id: str,
    thumbnail: str | None = None,
    gallery: list[str] | None = None,
) -> Product:
    product = await get_product(db, product_id, vendor_id)
    if thumbnail:
        product.thumbnail_image = thumbnail
    if gallery:
        existing = list(product.gallery_images or [])
        existing.extend(gallery)
        product.gallery_images = existing
    await db.commit()
    # Re-fetch with category loaded so ProductOut serialization works
    return await get_product(db, product_id, vendor_id)
