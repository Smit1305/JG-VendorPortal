from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.core.deps import get_db, require_vendor
from app.core.exceptions import NotFound
from app.core.response import APIResponse, success
from app.schemas.service_provider import ServiceProviderCreate, ServiceProviderOut, ServiceProviderUpdate
from app.services import service_provider_service
from app.services.file_service import read_document_as_base64

router = APIRouter()


@router.get("", response_model=APIResponse)
async def get_service_provider(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    sp = await service_provider_service.get(db, vendor.id)
    data = ServiceProviderOut.model_validate(sp).model_dump() if sp else None
    return success("Service provider profile", data=data)


@router.post("", response_model=APIResponse, status_code=201)
async def create_service_provider(
    payload: ServiceProviderCreate,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    sp = await service_provider_service.create(db, vendor.id, payload)
    return success(
        "Service provider profile created",
        data=ServiceProviderOut.model_validate(sp).model_dump(),
    )


@router.post("/documents", response_model=APIResponse)
async def upload_sp_document(
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Upload a single document for the service provider profile.
    Stored as base64 in service_providers.documents JSONB.
    Multiple files with the same doc_type are appended as a list.
    """
    sp = await service_provider_service.get(db, vendor.id)
    if not sp:
        # Auto-create a minimal profile so documents can be saved before full submit
        from app.schemas.service_provider import ServiceProviderCreate
        sp = await service_provider_service.create(db, vendor.id, ServiceProviderCreate())

    file_data = await read_document_as_base64(file)
    entry = {"filename": file_data["filename"], "mime": file_data["mime"], "data": file_data["data"]}

    docs = dict(sp.documents or {})
    existing = docs.get(doc_type)
    if isinstance(existing, list):
        existing.append(entry)
        docs[doc_type] = existing
    elif existing is not None:
        # Convert single → list so multiple uploads of same type are preserved
        docs[doc_type] = [existing, entry]
    else:
        docs[doc_type] = entry

    sp.documents = docs
    flag_modified(sp, "documents")
    await db.commit()

    return success(
        f"Document '{doc_type}' saved",
        data={"doc_type": doc_type, "filename": file_data["filename"], "uploaded": True},
    )


@router.get("/documents", response_model=APIResponse)
async def get_sp_documents(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Return saved document metadata (filenames only, no base64 data)."""
    sp = await service_provider_service.get(db, vendor.id)
    if not sp or not sp.documents:
        return success("No documents", data={})

    # Strip base64 data — return only filenames + mime
    meta = {}
    for key, val in sp.documents.items():
        if isinstance(val, list):
            meta[key] = [{"filename": e.get("filename", ""), "mime": e.get("mime", "")} for e in val]
        elif isinstance(val, dict):
            meta[key] = {"filename": val.get("filename", ""), "mime": val.get("mime", "")}
    return success("Documents retrieved", data=meta)


@router.delete("/documents/{doc_type}", response_model=APIResponse)
async def delete_sp_document(
    doc_type: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    sp = await service_provider_service.get(db, vendor.id)
    if not sp or not sp.documents or doc_type not in (sp.documents or {}):
        raise NotFound("Document not found")
    docs = dict(sp.documents)
    docs.pop(doc_type, None)
    sp.documents = docs
    flag_modified(sp, "documents")
    await db.commit()
    return success(f"Document '{doc_type}' deleted", data={"doc_type": doc_type})


@router.put("", response_model=APIResponse)
async def update_service_provider(
    payload: ServiceProviderUpdate,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    sp = await service_provider_service.update(db, vendor.id, payload)
    return success(
        "Service provider profile updated",
        data=ServiceProviderOut.model_validate(sp).model_dump(),
    )
