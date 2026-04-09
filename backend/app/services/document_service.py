import copy
import json
import logging

from fastapi import UploadFile
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from app.core.exceptions import NotFound
from app.models.vendor_document import VendorDocument
from app.models.document_type import DocumentType
from app.schemas.vendor import VendorDocumentUpdate
from app.services.file_service import read_document_as_base64

logger = logging.getLogger("document_service")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


async def _get_or_create(db: AsyncSession, user_id: str) -> VendorDocument:
    result = await db.execute(
        select(VendorDocument).where(VendorDocument.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        logger.info(f"[DOC] No existing record for user {user_id} — creating new row")
        doc = VendorDocument(user_id=user_id, documents={})
        db.add(doc)
        await db.flush()
        logger.info(f"[DOC] New VendorDocument row created, id={doc.id}")
    else:
        logger.info(f"[DOC] Found existing record id={doc.id} for user {user_id}")
    return doc


async def get_or_create_documents(db: AsyncSession, user_id: str) -> VendorDocument:
    return await _get_or_create(db, user_id)


async def get_documents(db: AsyncSession, user_id: str) -> VendorDocument | None:
    result = await db.execute(
        select(VendorDocument).where(VendorDocument.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def update_document_fields(
    db: AsyncSession, user_id: str, payload: VendorDocumentUpdate
) -> VendorDocument:
    doc = await _get_or_create(db, user_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(doc, field, value)
    await db.commit()
    await db.refresh(doc)
    return doc


async def _get_upload_type(db: AsyncSession, doc_type: str) -> str:
    # Try by doc_type slug first
    result = await db.execute(
        select(DocumentType).where(DocumentType.doc_type == doc_type)
    )
    dt = result.scalar_one_or_none()
    if dt:
        logger.info(f"[DOC] doc_type='{doc_type}' → upload_type='{dt.upload_type}'")
        return dt.upload_type or "Single"
    # Fallback: try by name
    result2 = await db.execute(
        select(DocumentType).where(DocumentType.name == doc_type)
    )
    dt2 = result2.scalar_one_or_none()
    upload_type = (dt2.upload_type or "Single") if dt2 else "Single"
    logger.info(f"[DOC] doc_type='{doc_type}' (by name fallback) → upload_type='{upload_type}'")
    return upload_type


async def upload_document(
    db: AsyncSession,
    user_id: str,
    org_id: str,
    doc_type: str,
    file: UploadFile,
    doc_number: str | None = None,
) -> VendorDocument:
    logger.info(f"[DOC] ── UPLOAD START ── user={user_id} doc_type={doc_type} file={file.filename} size≈{file.size}")

    # 1. Read file → base64
    file_data = await read_document_as_base64(file)
    b64_len = len(file_data["data"])
    logger.info(f"[DOC] base64 encoded, length={b64_len} chars, mime={file_data['mime']}")

    # 2. Upload type
    upload_type = await _get_upload_type(db, doc_type)

    # 3. Get/create row
    doc = await _get_or_create(db, user_id)

    # 4. Deep-copy current JSONB
    current = copy.deepcopy(doc.documents or {})
    logger.info(f"[DOC] Current documents keys before update: {list(current.keys())}")

    # 5. Build entry
    entry = {
        "file": file_data["data"],
        "filename": file_data["filename"],
        "mime": file_data["mime"],
        "number": doc_number or "",
    }

    # 6. Merge
    if upload_type == "Multiple":
        existing = current.get(doc_type)
        arr = list(existing) if isinstance(existing, list) else ([existing] if isinstance(existing, dict) else [])
        arr.append(entry)
        current[doc_type] = arr
        logger.info(f"[DOC] Multiple type — appended, now {len(arr)} entries for '{doc_type}'")
    else:
        current[doc_type] = entry
        logger.info(f"[DOC] Single type — replaced entry for '{doc_type}'")

    # 7. Assign + mark modified
    doc.documents = current
    flag_modified(doc, "documents")
    logger.info(f"[DOC] flag_modified called, about to commit...")

    # 8. Commit
    await db.commit()
    logger.info(f"[DOC] ✅ COMMIT SUCCESS")

    # 9. Refresh and verify
    await db.refresh(doc)
    saved_keys = list((doc.documents or {}).keys())
    logger.info(f"[DOC] ✅ UPLOAD COMPLETE — documents now has keys: {saved_keys}")

    # 10. Double-check with raw SQL
    raw = await db.execute(
        text("SELECT jsonb_object_keys(documents) as k FROM vendor_documents WHERE user_id = :uid"),
        {"uid": user_id}
    )
    db_keys = [r.k for r in raw.fetchall()]
    logger.info(f"[DOC] ✅ RAW SQL VERIFY — keys in DB: {db_keys}")

    print(f"\n{'='*60}")
    print(f"  DOCUMENT UPLOADED TO DATABASE")
    print(f"  user_id  : {user_id}")
    print(f"  doc_type : {doc_type}")
    print(f"  filename : {file_data['filename']}")
    print(f"  mime     : {file_data['mime']}")
    print(f"  b64_size : {b64_len} chars")
    print(f"  DB keys  : {db_keys}")
    print(f"{'='*60}\n")

    return doc


async def delete_document(
    db: AsyncSession, user_id: str, doc_type: str
) -> VendorDocument:
    result = await db.execute(
        select(VendorDocument).where(VendorDocument.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc or not doc.documents or doc_type not in doc.documents:
        raise NotFound(f"Document '{doc_type}' not found")

    updated = copy.deepcopy(doc.documents)
    del updated[doc_type]
    doc.documents = updated
    flag_modified(doc, "documents")
    await db.commit()
    await db.refresh(doc)
    logger.info(f"[DOC] Deleted '{doc_type}' for user {user_id}")
    return doc


async def delete_document_entry(
    db: AsyncSession, user_id: str, doc_type: str, file_index: int
) -> VendorDocument:
    result = await db.execute(
        select(VendorDocument).where(VendorDocument.user_id == user_id)
    )
    doc = result.scalar_one_or_none()
    if not doc or not doc.documents or doc_type not in doc.documents:
        raise NotFound(f"Document '{doc_type}' not found")

    updated = copy.deepcopy(doc.documents)
    entry = updated[doc_type]

    if isinstance(entry, list):
        if file_index < 0 or file_index >= len(entry):
            raise NotFound(f"Document entry {file_index} not found")
        new_list = [e for i, e in enumerate(entry) if i != file_index]
        if new_list:
            updated[doc_type] = new_list
        else:
            del updated[doc_type]
    else:
        del updated[doc_type]

    doc.documents = updated
    flag_modified(doc, "documents")
    await db.commit()
    await db.refresh(doc)
    logger.info(f"[DOC] Deleted entry {file_index} of '{doc_type}' for user {user_id}")
    return doc
