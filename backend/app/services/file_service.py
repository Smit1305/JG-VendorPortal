import base64
import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

# ── Allowed MIME types ────────────────────────────────────────
_ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_ALLOWED_DOC   = {"application/pdf", "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
_ALLOWED_EXCEL = {"application/vnd.ms-excel",
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
ALLOWED_ANY = _ALLOWED_IMAGE | _ALLOWED_DOC | _ALLOWED_EXCEL

# Public alias used by document_service for vendor document uploads
ALLOWED_DOC_MIME = _ALLOWED_DOC | _ALLOWED_IMAGE


def _upload_root() -> Path:
    return Path(settings.UPLOAD_DIR).resolve()


def _vendor_dir(org_id: str, vendor_id: str, sub: str = "") -> Path:
    """
    Path structure: uploads/{org_id}/{vendor_id}/{sub}/
    sub examples: "docs", "products", "profile"
    """
    parts = [_upload_root(), org_id, vendor_id]
    if sub:
        parts.append(sub)
    return Path(*parts)


def _company_dir() -> Path:
    return _upload_root() / "company"


# ── Core upload ───────────────────────────────────────────────

async def save_file(
    file: UploadFile,
    dest_dir: Path,
    allowed_types: set[str] = ALLOWED_ANY,
) -> str:
    """
    Validate, stream-write, and return the relative path from upload root.
    Raises HTTP 400 on invalid type or size.
    """
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not allowed",
        )

    # Read in one shot and check size
    contents = await file.read()
    if len(contents) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB} MB",
        )

    dest_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "file").suffix.lower()
    filename = f"{uuid.uuid4().hex}{ext}"
    full_path = dest_dir / filename

    async with aiofiles.open(full_path, "wb") as f:
        await f.write(contents)

    # Return path relative to upload root for DB storage
    return str(full_path.relative_to(_upload_root()))


async def delete_file(relative_path: str) -> None:
    """Remove a file from disk given its relative path (no-op for base64 stored docs)."""
    if relative_path and not relative_path.startswith("data:"):
        full_path = _upload_root() / relative_path
        if full_path.exists():
            full_path.unlink()


async def read_document_as_base64(
    file: UploadFile,
    allowed_types: set[str] = None,
) -> dict:
    """
    Read an uploaded file, validate it, and return a dict with:
      { "data": "data:<mime>;base64,<b64>", "filename": "<original name>", "mime": "<content_type>" }
    Nothing is written to disk.
    """
    if allowed_types is None:
        allowed_types = ALLOWED_DOC_MIME

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' is not allowed. Use PDF or image files.",
        )

    contents = await file.read()
    if len(contents) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB} MB",
        )

    b64 = base64.b64encode(contents).decode("utf-8")
    return {
        "data": f"data:{file.content_type};base64,{b64}",
        "filename": file.filename or "document",
        "mime": file.content_type,
    }


# ── Convenience wrappers ──────────────────────────────────────

async def save_vendor_document(
    file: UploadFile,
    org_id: str,
    vendor_id: str,
) -> str:
    return await save_file(
        file,
        dest_dir=_vendor_dir(org_id, vendor_id, "docs"),
        allowed_types=_ALLOWED_DOC | _ALLOWED_IMAGE,
    )


async def save_vendor_product_image(
    file: UploadFile,
    org_id: str,
    vendor_id: str,
) -> str:
    return await save_file(
        file,
        dest_dir=_vendor_dir(org_id, vendor_id, "products"),
        allowed_types=_ALLOWED_IMAGE,
    )


async def save_vendor_profile_photo(
    file: UploadFile,
    org_id: str,
    vendor_id: str,
) -> str:
    return await save_file(
        file,
        dest_dir=_vendor_dir(org_id, vendor_id, "profile"),
        allowed_types=_ALLOWED_IMAGE,
    )


async def save_company_file(file: UploadFile, sub: str = "") -> str:
    dest = _company_dir() / sub if sub else _company_dir()
    return await save_file(file, dest_dir=dest, allowed_types=_ALLOWED_IMAGE | _ALLOWED_DOC)


async def save_excel_import(file: UploadFile, org_id: str, vendor_id: str) -> str:
    return await save_file(
        file,
        dest_dir=_vendor_dir(org_id, vendor_id, "imports"),
        allowed_types=_ALLOWED_EXCEL,
    )
