import math
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin
from app.core.response import APIResponse, success
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import UserOut, VendorProfileFlatOut
from app.schemas.vendor import (
    VendorDocumentOut,
    VendorDocumentUpdate,
    VendorProfileOut,
    VendorProfileUpdate,
    VendorStatusUpdate,
)
from app.services import email_service, vendor_service

router = APIRouter()

API_BASE = ""  # populated at runtime; files served at /uploads/...


def _build_vendor_detail(vendor) -> dict:
    """
    Return a flat dict suitable for the admin VendorDetail page.
    Merges user + vendor_profile fields and adds documents (as list),
    products, and service_provider.
    """
    flat = VendorProfileFlatOut.from_user(vendor)
    data = flat.model_dump()

    # Documents: convert JSONB dict → list for frontend display
    vd = getattr(vendor, "vendor_document", None)
    docs_list = []
    if vd and vd.documents:
        for doc_type, doc_data in vd.documents.items():
            if isinstance(doc_data, dict):
                docs_list.append({
                    "doc_type": doc_type,
                    "name": doc_type.replace("_", " ").title(),
                    "file_url": doc_data.get("file") or doc_data.get("file_url"),
                    "mime": doc_data.get("mime"),
                    "input_value": doc_data.get("number") or doc_data.get("doc_number") or doc_data.get("input_value"),
                    "file_index": None,
                })
            elif isinstance(doc_data, list):
                for i, entry in enumerate(doc_data):
                    docs_list.append({
                        "doc_type": doc_type,
                        "name": doc_type.replace("_", " ").title(),
                        "file_url": entry.get("file") or entry.get("image") or entry.get("file_url"),
                        "mime": entry.get("mime"),
                        "input_value": entry.get("number") or entry.get("inputValue") or entry.get("doc_number"),
                        "file_index": i,
                    })
    data["documents"] = docs_list

    # Products
    data["products"] = [
        {
            "id": p.id,
            "name": p.name,
            "price": p.regular_price or p.sale_price,
            "status": getattr(p, "status", "active"),
            "category_name": getattr(p, "category_id", None),
        }
        for p in (getattr(vendor, "products", None) or [])
    ]

    # Service provider
    sp = getattr(vendor, "service_provider", None)
    if sp:
        data["service_provider"] = {
            k: v for k, v in vars(sp).items()
            if not k.startswith("_")
        }
    else:
        data["service_provider"] = None

    return data


@router.get("", response_model=APIResponse)
async def list_vendors(
    doc_status: str | None = Query(None, description="pending | verified | rejected | resubmit"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    vendors, total = await vendor_service.list_vendors(
        db, admin.organization_id, doc_status, page, per_page
    )
    return success(
        "Vendors retrieved",
        data=PaginatedResponse(
            items=[VendorProfileFlatOut.from_user(v).model_dump() for v in vendors],
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page),
        ).model_dump(),
    )


@router.get("/pending", response_model=APIResponse)
async def list_pending_vendors(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Shortcut — vendors awaiting document verification."""
    vendors, total = await vendor_service.list_vendors(
        db, admin.organization_id, "pending", page, per_page
    )
    return success(
        "Pending vendors retrieved",
        data=PaginatedResponse(
            items=[VendorProfileFlatOut.from_user(v).model_dump() for v in vendors],
            total=total,
            page=page,
            per_page=per_page,
            pages=math.ceil(total / per_page),
        ).model_dump(),
    )


@router.get("/{vendor_id}", response_model=APIResponse)
async def get_vendor(
    vendor_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    vendor = await vendor_service.get_vendor_detail(db, vendor_id)
    return success("Vendor retrieved", data=_build_vendor_detail(vendor))


@router.patch("/{vendor_id}/status", response_model=APIResponse)
async def update_vendor_status(
    vendor_id: str,
    payload: VendorStatusUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve / reject / request resubmission of vendor documents."""
    vendor = await vendor_service.update_vendor_status(db, vendor_id, payload, admin)

    # Fire transactional email (non-blocking — email failure never breaks API)
    try:
        if payload.document_verify_status == "verified":
            await email_service.send_vendor_doc_approved(vendor.email, vendor.name)
        elif payload.document_verify_status == "rejected":
            await email_service.send_vendor_doc_rejected(
                vendor.email, vendor.name, payload.rejection_reason
            )
        elif payload.document_verify_status == "resubmit":
            await email_service.send_vendor_doc_resubmit(
                vendor.email, vendor.name, payload.rejection_reason
            )
    except Exception:
        pass  # log in production

    # Create in-app notification for the vendor
    try:
        from app.services import notification_service
        notif_map = {
            "verified": ("Documents Verified ✓", "Your documents have been verified. You can now access all vendor features.", "success", "/vendor/documents"),
            "rejected": ("Documents Rejected", f"Your documents were rejected. {payload.rejection_reason or 'Please re-upload.'}", "error", "/vendor/documents"),
            "resubmit": ("Resubmission Required", f"Please resubmit your documents. {payload.rejection_reason or ''}", "warning", "/vendor/documents"),
        }
        if payload.document_verify_status in notif_map:
            title, message, ntype, link = notif_map[payload.document_verify_status]
            await notification_service.create_notification(db, vendor_id, title, message, ntype, link)
    except Exception:
        pass

    return success(
        f"Vendor status updated to '{payload.document_verify_status}'",
        data=UserOut.model_validate(vendor).model_dump(),
    )


@router.put("/{vendor_id}/core", response_model=APIResponse)
async def update_vendor_core(
    vendor_id: str,
    payload: VendorProfileUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    profile = await vendor_service.update_vendor_core_by_admin(db, vendor_id, payload)
    return success(
        "Vendor core details updated",
        data=VendorProfileOut.model_validate(profile).model_dump(),
    )


@router.get("/{vendor_id}/documents", response_model=APIResponse)
async def get_vendor_documents(
    vendor_id: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    doc = await vendor_service.get_vendor_documents(db, vendor_id)
    data = VendorDocumentOut.model_validate(doc).model_dump() if doc else None
    return success("Vendor documents retrieved", data=data)


@router.post("/{vendor_id}/documents", response_model=APIResponse)
async def update_vendor_documents(
    vendor_id: str,
    payload: VendorDocumentUpdate,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    doc = await vendor_service.upsert_vendor_documents(db, vendor_id, payload)
    return success(
        "Vendor documents updated",
        data=VendorDocumentOut.model_validate(doc).model_dump(),
    )


@router.delete("/{vendor_id}/documents/{doc_type}", response_model=APIResponse)
async def delete_vendor_document(
    vendor_id: str,
    doc_type: str,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    doc = await vendor_service.delete_document_key(db, vendor_id, doc_type)
    return success(
        f"Document '{doc_type}' deleted",
        data=VendorDocumentOut.model_validate(doc).model_dump(),
    )


@router.post("/{vendor_id}/documents/upload", response_model=APIResponse)
async def upload_vendor_document_by_admin(
    vendor_id: str,
    doc_type: str = Form(...),
    doc_number: str | None = Form(None),
    file: UploadFile = File(...),
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin uploads a file for a vendor's document (e.g. GST, PAN)."""
    from app.services import document_service
    # Look up vendor's organization for correct upload path
    from sqlalchemy import select
    from app.models.user import User
    res = await db.execute(select(User).where(User.id == vendor_id))
    vendor_user = res.scalar_one_or_none()
    org_id = vendor_user.organization_id if vendor_user else admin.organization_id

    doc = await document_service.upload_document(
        db, vendor_id, org_id, doc_type, file, doc_number
    )
    return success(
        f"Document '{doc_type}' uploaded for vendor",
        data=VendorDocumentOut.model_validate(doc).model_dump(),
    )


@router.delete("/{vendor_id}/documents/{doc_type}/{file_index}", response_model=APIResponse)
async def delete_vendor_document_entry(
    vendor_id: str,
    doc_type: str,
    file_index: int,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete one entry from a Multiple-type document array for a vendor."""
    from app.services import document_service
    doc = await document_service.delete_document_entry(db, vendor_id, doc_type, file_index)
    return success(
        f"Document entry deleted",
        data=VendorDocumentOut.model_validate(doc).model_dump(),
    )
