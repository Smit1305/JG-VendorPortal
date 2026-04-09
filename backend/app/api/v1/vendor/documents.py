import copy
import logging

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.core.deps import get_db, require_vendor
from app.core.response import APIResponse, success
from app.schemas.vendor import VendorDocumentOut, VendorDocumentUpdate
from app.services import document_service
from app.services.file_service import read_document_as_base64

router = APIRouter()
logger = logging.getLogger("documents_api")


def _docs_metadata_only(documents: dict | None) -> dict:
    """
    Strip base64 file data from documents dict for list responses.
    Returns only filename, mime, number — keeps file for single-doc view.
    """
    if not documents:
        return {}
    result = {}
    for doc_type, val in documents.items():
        if isinstance(val, list):
            result[doc_type] = [
                {
                    "filename": e.get("filename", ""),
                    "mime": e.get("mime", ""),
                    "number": e.get("number", ""),
                    "has_file": bool(e.get("file")),
                }
                for e in val
            ]
        elif isinstance(val, dict):
            result[doc_type] = {
                "filename": val.get("filename", ""),
                "mime": val.get("mime", ""),
                "number": val.get("number", ""),
                "has_file": bool(val.get("file")),
            }
    return result


@router.get("", response_model=APIResponse)
async def get_documents(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Get document metadata (no base64 data — use /view/{doc_type} to get file)."""
    doc = await document_service.get_documents(db, vendor.id)
    if not doc:
        return success("No documents", data={"documents": {}})

    base = VendorDocumentOut.model_validate(doc).model_dump()
    # Replace full documents with metadata-only version
    base["documents"] = _docs_metadata_only(doc.documents)
    return success("Documents retrieved", data=base)


@router.get("/view/{doc_type}", response_model=APIResponse)
async def view_document(
    doc_type: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Get the full base64 file data for a specific document type."""
    doc = await document_service.get_documents(db, vendor.id)
    if not doc or not doc.documents or doc_type not in doc.documents:
        return success("Document not found", data=None)

    val = doc.documents[doc_type]
    return success("Document retrieved", data={"doc_type": doc_type, "data": val})


@router.get("/view/{doc_type}/{index}", response_model=APIResponse)
async def view_document_entry(
    doc_type: str,
    index: int,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Get the full base64 file data for a specific entry in a Multiple-type document."""
    doc = await document_service.get_documents(db, vendor.id)
    if not doc or not doc.documents or doc_type not in doc.documents:
        return success("Document not found", data=None)

    val = doc.documents[doc_type]
    if isinstance(val, list):
        if index < 0 or index >= len(val):
            return success("Entry not found", data=None)
        return success("Document retrieved", data={"doc_type": doc_type, "index": index, "data": val[index]})
    return success("Document retrieved", data={"doc_type": doc_type, "data": val})


@router.post("/upload", response_model=APIResponse)
async def upload_document(
    doc_type: str = Form(...),
    doc_number: str | None = Form(None),
    file: UploadFile = File(...),
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document — stored as base64 in vendor_documents.documents JSONB."""
    doc = await document_service.upload_document(
        db, vendor.id, vendor.organization_id, doc_type, file, doc_number
    )

    # Console log confirmation
    saved = doc.documents or {}
    entry = saved.get(doc_type)
    if isinstance(entry, list):
        stored_filename = entry[-1].get("filename", "?") if entry else "?"
        stored_size = len(entry[-1].get("file", "")) if entry else 0
    elif isinstance(entry, dict):
        stored_filename = entry.get("filename", "?")
        stored_size = len(entry.get("file", ""))
    else:
        stored_filename = "?"
        stored_size = 0

    print(f"\n{'='*60}")
    print(f"  ✅ DOCUMENT STORED IN DATABASE")
    print(f"  Database : vendor_db")
    print(f"  Table    : vendor_documents")
    print(f"  Column   : documents (JSONB)")
    print(f"  user_id  : {vendor.id}")
    print(f"  doc_type : {doc_type}")
    print(f"  filename : {stored_filename}")
    print(f"  b64_size : {stored_size:,} chars")
    print(f"  all_keys : {list(saved.keys())}")
    print(f"{'='*60}\n")

    logger.info(f"UPLOAD OK user={vendor.id} doc_type={doc_type} file={stored_filename} size={stored_size}")

    return success(
        f"Document '{doc_type}' uploaded and stored in database",
        data={
            "doc_type": doc_type,
            "filename": stored_filename,
            "uploaded": True,
            "stored_in": "vendor_db.vendor_documents.documents"
        },
    )


@router.put("", response_model=APIResponse)
async def update_document_fields(
    payload: VendorDocumentUpdate,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    doc = await document_service.update_document_fields(db, vendor.id, payload)
    return success("Documents updated", data=VendorDocumentOut.model_validate(doc).model_dump())


@router.delete("/{doc_type}", response_model=APIResponse)
async def delete_document(
    doc_type: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    await document_service.delete_document(db, vendor.id, doc_type)
    print(f"[DOC] Deleted '{doc_type}' for user {vendor.id}")
    return success(f"Document '{doc_type}' deleted", data={"doc_type": doc_type, "deleted": True})


@router.delete("/{doc_type}/{file_index}", response_model=APIResponse)
async def delete_document_entry(
    doc_type: str,
    file_index: int,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    await document_service.delete_document_entry(db, vendor.id, doc_type, file_index)
    return success(f"Entry {file_index} deleted", data={"doc_type": doc_type, "index": file_index, "deleted": True})


@router.put("/business", response_model=APIResponse)
async def update_business_details(
    payload: VendorDocumentUpdate,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    doc = await document_service.update_document_fields(db, vendor.id, payload)
    return success("Business details updated", data=VendorDocumentOut.model_validate(doc).model_dump())


@router.post("/business/upload", response_model=APIResponse)
async def upload_business_file(
    field: str = Form(...),
    file: UploadFile = File(...),
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    file_data = await read_document_as_base64(file)
    doc = await document_service.get_or_create_documents(db, vendor.id)
    if field == "epfo_file":
        doc.epfo_file = file_data["data"]
    elif field == "brand_office_files":
        current = copy.deepcopy(list(doc.brand_office_files or []))
        current.append(file_data["data"])
        doc.brand_office_files = current
        flag_modified(doc, "brand_office_files")
    await db.commit()
    print(f"[DOC] Business file '{field}' stored for user {vendor.id}")
    return success(f"File '{field}' uploaded", data={"field": field, "uploaded": True})
