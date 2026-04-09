from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import Conflict, NotFound
from app.models.document_type import DocumentType
from app.schemas.document_type import DocumentTypeCreate, DocumentTypeUpdate


async def list_all(db: AsyncSession) -> list[DocumentType]:
    result = await db.execute(select(DocumentType).order_by(DocumentType.name))
    return result.scalars().all()


async def get(db: AsyncSession, doc_type_id: str) -> DocumentType:
    result = await db.execute(
        select(DocumentType).where(DocumentType.id == doc_type_id)
    )
    dt = result.scalar_one_or_none()
    if not dt:
        raise NotFound("Document type not found")
    return dt


async def create(db: AsyncSession, payload: DocumentTypeCreate) -> DocumentType:
    existing = await db.execute(
        select(DocumentType).where(DocumentType.doc_type == payload.doc_type)
    )
    if existing.scalar_one_or_none():
        raise Conflict(f"Document type '{payload.doc_type}' already exists")

    dt = DocumentType(**payload.model_dump())
    db.add(dt)
    await db.commit()
    await db.refresh(dt)
    return dt


async def update(
    db: AsyncSession, doc_type_id: str, payload: DocumentTypeUpdate
) -> DocumentType:
    dt = await get(db, doc_type_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(dt, field, value)
    await db.commit()
    await db.refresh(dt)
    return dt


async def delete(db: AsyncSession, doc_type_id: str) -> None:
    dt = await get(db, doc_type_id)
    await db.delete(dt)
    await db.commit()
