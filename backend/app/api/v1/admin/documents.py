from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin
from app.core.response import APIResponse, success
from app.schemas.document_type import DocumentTypeCreate, DocumentTypeOut, DocumentTypeUpdate
from app.services import document_type_service

router = APIRouter()


@router.get("", response_model=APIResponse)
async def list_document_types(
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    items = await document_type_service.list_all(db)
    return success(
        "Document types retrieved",
        data=[DocumentTypeOut.model_validate(d).model_dump() for d in items],
    )


@router.post("", response_model=APIResponse, status_code=201)
async def create_document_type(
    payload: DocumentTypeCreate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    dt = await document_type_service.create(db, payload)
    return success("Document type created", data=DocumentTypeOut.model_validate(dt).model_dump())


@router.put("/{doc_type_id}", response_model=APIResponse)
async def update_document_type(
    doc_type_id: str,
    payload: DocumentTypeUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    dt = await document_type_service.update(db, doc_type_id, payload)
    return success("Document type updated", data=DocumentTypeOut.model_validate(dt).model_dump())


@router.delete("/{doc_type_id}", response_model=APIResponse)
async def delete_document_type(
    doc_type_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    await document_type_service.delete(db, doc_type_id)
    return success("Document type deleted")
