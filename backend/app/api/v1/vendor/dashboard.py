"""
Vendor Dashboard endpoint.

Real data from DB  : products, loan applications, loyalty account/transactions, onboarding checklist, chart
Demo data (no table): orders, RFQs, payments (until those models are built)
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_vendor
from app.core.response import APIResponse, success
from app.models.loan import LoanApplication
from app.models.loyalty import LoyaltyAccount, LoyaltyTransaction
from app.models.product import Product
from app.models.vendor_return import VendorReturn
from app.models.support_ticket import SupportTicket
from app.models.vendor_profile import VendorProfile
from app.models.vendor_document import VendorDocument
from app.models.service_provider import ServiceProvider
from app.models.order import Order
from app.models.rfq import RFQ
from app.models.payment import Payment
from app.models.shipment import Shipment
from app.services import product_service, profile_service

router = APIRouter()


def _days_ago_str(dt) -> str:
    if not dt:
        return "recently"
    now = datetime.utcnow()
    aware = dt.replace(tzinfo=None) if hasattr(dt, "tzinfo") else dt
    diff_seconds = int((now - aware).total_seconds())
    if diff_seconds < 60:
        return "just now"
    if diff_seconds < 3600:
        m = diff_seconds // 60
        return f"{m}m ago"
    if diff_seconds < 86400:
        h = diff_seconds // 3600
        return f"{h}h ago"
    delta = diff_seconds // 86400
    if delta == 1:
        return "yesterday"
    if delta < 7:
        return f"{delta}d ago"
    if delta < 30:
        return f"{delta // 7}w ago"
    return f"{delta // 30}mo ago"


def _parse_amount(s) -> int:
    try:
        return int(str(s or "0").replace(",", ""))
    except (ValueError, TypeError):
        return 0


def _compute_tier(points: int) -> str:
    if points >= 20000:
        return "Platinum"
    if points >= 5000:
        return "Gold"
    if points >= 1000:
        return "Silver"
    return "Bronze"


@router.get("", response_model=APIResponse)
async def get_vendor_dashboard(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    # ── 1. Onboarding checklist (real) ────────────────────────
    try:
        checklist = await profile_service.get_checklist(db, vendor.id)
        checklist_data = checklist.model_dump()
    except Exception:
        checklist_data = {
            "core_details": False,
            "documents_uploaded": False,
            "business_details": False,
            "product_details": False,
            "account_verified": vendor.verification_status == "verified",
            "documents_verified": vendor.document_verify_status == "verified",
        }

    # ── 2. Product stats (real) ───────────────────────────────
    prod_status_result = await db.execute(
        select(Product.status, func.count(Product.id))
        .where(Product.vendor_id == vendor.id)
        .group_by(Product.status)
    )
    product_counts = dict(prod_status_result.all())
    total_products   = sum(product_counts.values())
    active_products  = product_counts.get("active", 0)
    inactive_products = product_counts.get("inactive", 0)
    draft_products   = product_counts.get("draft", 0)

    # Best products — top 3 active by most recently updated
    best_prod_result = await db.execute(
        select(Product.name, Product.regular_price, Product.sale_price, Product.status)
        .where(Product.vendor_id == vendor.id, Product.status == "active")
        .order_by(Product.created_at.desc())
        .limit(5)
    )
    best_products = []
    for row in best_prod_result.all():
        price = row.sale_price or row.regular_price
        best_products.append({
            "name": row.name,
            "amount": f"₹ {int(price):,}" if price else "—",
        })

    # ── 3. Chart — products listed per month (last 6 months, real) ──
    now = datetime.utcnow()
    # Build ordered list of the last 6 calendar months
    month_slots = []
    for i in range(5, -1, -1):
        total_months = now.month - 1 - i
        year = now.year + (total_months // 12)
        month = (total_months % 12) + 1
        month_slots.append((year, month, datetime(year, month, 1).strftime("%b")))

    six_months_ago = datetime(month_slots[0][0], month_slots[0][1], 1)
    chart_rows = await db.execute(
        select(Product.created_at, Product.regular_price)
        .where(Product.vendor_id == vendor.id, Product.created_at >= six_months_ago)
    )
    monthly_buckets: dict[tuple, dict] = {
        (y, m): {"products": 0, "catalog_value": 0.0} for y, m, _ in month_slots
    }
    for row in chart_rows.all():
        key = (row.created_at.year, row.created_at.month)
        if key in monthly_buckets:
            monthly_buckets[key]["products"] += 1
            monthly_buckets[key]["catalog_value"] += float(row.regular_price or 0)

    chart_data = [
        {
            "month": label,
            "products": monthly_buckets[(y, m)]["products"],
            "catalog_value": round(monthly_buckets[(y, m)]["catalog_value"], 2),
        }
        for y, m, label in month_slots
    ]

    # ── 4. Loan stats (real) ──────────────────────────────────
    loan_status_result = await db.execute(
        select(LoanApplication.status, func.count(LoanApplication.id))
        .where(LoanApplication.user_id == vendor.id)
        .group_by(LoanApplication.status)
    )
    loan_counts    = dict(loan_status_result.all())
    total_loans    = sum(loan_counts.values())
    loans_pending  = loan_counts.get("pending", 0)
    loans_approved = loan_counts.get("approved", 0)
    loans_disbursed = loan_counts.get("disbursed", 0)
    loans_rejected = loan_counts.get("rejected", 0)

    # ── 4. Loyalty account (real) ─────────────────────────────
    loyalty_result = await db.execute(
        select(LoyaltyAccount).where(LoyaltyAccount.user_id == vendor.id)
    )
    loyalty = loyalty_result.scalar_one_or_none()
    loyalty_points = loyalty.total_points if loyalty else 0
    loyalty_tier   = _compute_tier(loyalty_points)
    loyalty_since  = loyalty.member_since.strftime("%b %Y") if loyalty and loyalty.member_since else None

    # ── 5. Recent activity — built from real DB events ────────
    activity_items: list[tuple[datetime, dict]] = []

    # Loan applications
    loan_activity = await db.execute(
        select(LoanApplication)
        .where(LoanApplication.user_id == vendor.id)
        .order_by(LoanApplication.created_at.desc())
        .limit(4)
    )
    for loan in loan_activity.scalars().all():
        activity_items.append((
            loan.created_at,
            {
                "type": "payment",
                "title": f"Loan application — {loan.status.capitalize()}",
                "desc": f"₹ {loan.amount} · {loan.loan_type or 'General'}" + (f" · {loan.purpose[:50]}" if loan.purpose else ""),
                "time": _days_ago_str(loan.created_at),
                "link": "/vendor/loans",
            },
        ))

    # Loyalty transactions
    if loyalty:
        tx_activity = await db.execute(
            select(LoyaltyTransaction)
            .where(LoyaltyTransaction.account_id == loyalty.id)
            .order_by(LoyaltyTransaction.created_at.desc())
            .limit(4)
        )
        for tx in tx_activity.scalars().all():
            activity_items.append((
                tx.created_at,
                {
                    "type": "support",
                    "title": "Loyalty points " + ("earned" if tx.points >= 0 else "redeemed"),
                    "desc": f"{tx.event} — {'+' if tx.points >= 0 else ''}{tx.points} pts (total: {loyalty_points})",
                    "time": _days_ago_str(tx.created_at),
                    "link": "/vendor/rewards",
                },
            ))

    # Products added
    prod_activity = await db.execute(
        select(Product)
        .where(Product.vendor_id == vendor.id)
        .order_by(Product.created_at.desc())
        .limit(4)
    )
    for prod in prod_activity.scalars().all():
        activity_items.append((
            prod.created_at,
            {
                "type": "order",
                "title": "Product listed",
                "desc": f"{prod.name} — {prod.status.capitalize()}",
                "time": _days_ago_str(prod.created_at),
                "link": f"/vendor/products/{prod.id}",
            },
        ))

    # Return requests
    return_activity = await db.execute(
        select(VendorReturn)
        .where(VendorReturn.vendor_id == vendor.id)
        .order_by(VendorReturn.created_at.desc())
        .limit(4)
    )
    for ret in return_activity.scalars().all():
        refund_str = f" · ₹ {float(ret.refund_amount):,.0f}" if ret.refund_amount else ""
        activity_items.append((
            ret.created_at,
            {
                "type": "rfq",
                "title": f"Return request — {ret.status.capitalize()}",
                "desc": f"{ret.return_id} · {ret.product[:50]}{refund_str}",
                "time": _days_ago_str(ret.created_at),
                "link": "/vendor/returns",
            },
        ))

    # Orders
    order_activity = await db.execute(
        select(Order)
        .where(Order.vendor_id == vendor.id)
        .order_by(Order.created_at.desc())
        .limit(3)
    )
    for ord_ in order_activity.scalars().all():
        activity_items.append((
            ord_.created_at,
            {
                "type": "order",
                "title": f"Order {ord_.status.capitalize()}",
                "desc": f"{ord_.order_id} · {ord_.buyer}" + (f" · ₹ {int(ord_.value):,}" if ord_.value else ""),
                "time": _days_ago_str(ord_.created_at),
                "link": f"/vendor/orders/{ord_.order_id}",
            },
        ))

    # RFQs
    rfq_activity = await db.execute(
        select(RFQ)
        .where(RFQ.vendor_id == vendor.id)
        .order_by(RFQ.created_at.desc())
        .limit(3)
    )
    for rfq_ in rfq_activity.scalars().all():
        activity_items.append((
            rfq_.created_at,
            {
                "type": "rfq",
                "title": f"RFQ — {rfq_.status.capitalize()}",
                "desc": f"{rfq_.rfq_id} · {rfq_.title[:60]} · {rfq_.buyer}",
                "time": _days_ago_str(rfq_.created_at),
                "link": f"/vendor/rfqs/{rfq_.rfq_id}",
            },
        ))

    # Payments
    pay_activity = await db.execute(
        select(Payment)
        .where(Payment.vendor_id == vendor.id)
        .order_by(Payment.created_at.desc())
        .limit(3)
    )
    for pay_ in pay_activity.scalars().all():
        activity_items.append((
            pay_.created_at,
            {
                "type": "payment",
                "title": f"Payment — {pay_.status.capitalize()}",
                "desc": f"{pay_.payment_id} · {pay_.buyer or ''}" + (f" · ₹ {int(pay_.amount):,}" if pay_.amount else ""),
                "time": _days_ago_str(pay_.created_at),
                "link": "/vendor/payments",
            },
        ))

    # Support tickets
    ticket_activity = await db.execute(
        select(SupportTicket)
        .where(SupportTicket.vendor_id == vendor.id)
        .order_by(SupportTicket.created_at.desc())
        .limit(4)
    )
    for tkt in ticket_activity.scalars().all():
        activity_items.append((
            tkt.created_at,
            {
                "type": "support",
                "title": f"Support ticket — {tkt.status}",
                "desc": f"{tkt.ticket_id} · {tkt.subject[:80]}" + (f" [{tkt.category}]" if tkt.category else ""),
                "time": _days_ago_str(tkt.created_at),
                "link": "/vendor/support",
            },
        ))

    # Vendor documents updated
    doc_result = await db.execute(
        select(VendorDocument)
        .where(VendorDocument.user_id == vendor.id)
        .limit(1)
    )
    doc = doc_result.scalar_one_or_none()
    if doc and doc.updated_at:
        activity_items.append((
            doc.updated_at,
            {
                "type": "order",
                "title": "Documents updated",
                "desc": "Vendor documents & compliance details updated",
                "time": _days_ago_str(doc.updated_at),
                "link": "/vendor/profile",
            },
        ))

    # Service provider profile saved
    sp_result = await db.execute(
        select(ServiceProvider)
        .where(ServiceProvider.user_id == vendor.id)
        .order_by(ServiceProvider.updated_at.desc())
        .limit(1)
    )
    sp = sp_result.scalar_one_or_none()
    if sp and sp.updated_at:
        activity_items.append((
            sp.updated_at,
            {
                "type": "order",
                "title": "Service provider profile updated",
                "desc": f"{sp.company_name or 'Profile'} — {sp.firm_type or ''}".strip(" —"),
                "time": _days_ago_str(sp.updated_at),
                "link": "/vendor/service-provider",
            },
        ))

    # Vendor profile updates
    vp_result = await db.execute(
        select(VendorProfile)
        .where(VendorProfile.user_id == vendor.id)
        .order_by(VendorProfile.updated_at.desc())
        .limit(1)
    )
    vp = vp_result.scalar_one_or_none()
    if vp and vp.updated_at:
        activity_items.append((
            vp.updated_at,
            {
                "type": "payment",
                "title": "Vendor profile updated",
                "desc": "Business profile information updated",
                "time": _days_ago_str(vp.updated_at),
                "link": "/vendor/profile",
            },
        ))

    # Sort by timestamp desc, take top 10
    activity_items.sort(key=lambda x: x[0] or datetime.min, reverse=True)
    recent_activity = [item for _, item in activity_items[:10]]

    # ── 6. Orders stats (real) ────────────────────────────────
    order_status_result = await db.execute(
        select(Order.status, func.count(Order.id))
        .where(Order.vendor_id == vendor.id)
        .group_by(Order.status)
    )
    order_counts = dict(order_status_result.all())
    total_orders       = sum(order_counts.values())
    orders_in_progress = order_counts.get("processing", 0) + order_counts.get("shipped", 0)
    orders_completed   = order_counts.get("completed", 0) + order_counts.get("delivered", 0)
    orders_refunded    = order_counts.get("cancelled", 0)

    # ── 7. RFQ stats (real) ───────────────────────────────────
    rfq_status_result = await db.execute(
        select(RFQ.status, func.count(RFQ.id))
        .where(RFQ.vendor_id == vendor.id)
        .group_by(RFQ.status)
    )
    rfq_counts = dict(rfq_status_result.all())
    total_rfqs             = sum(rfq_counts.values())
    rfqs_pending_response  = rfq_counts.get("open", 0)
    rfqs_buyer_pending     = rfq_counts.get("quoted", 0)
    rfqs_successful        = rfq_counts.get("closed", 0)
    rfqs_expired           = rfq_counts.get("expired", 0)

    # ── 8. Payment stats (real) ───────────────────────────────
    pay_result = await db.execute(
        select(Payment.status, func.sum(Payment.amount))
        .where(Payment.vendor_id == vendor.id)
        .group_by(Payment.status)
    )
    pay_sums = {row[0]: float(row[1] or 0) for row in pay_result.all()}
    payments_completed = int(pay_sums.get("paid", 0))
    payments_pending   = int(pay_sums.get("pending", 0) + pay_sums.get("overdue", 0))

    # ── 9. Shipment stats (real) ──────────────────────────────
    shp_result = await db.execute(
        select(Shipment.status, func.count(Shipment.id))
        .where(Shipment.vendor_id == vendor.id)
        .group_by(Shipment.status)
    )
    shp_counts = dict(shp_result.all())
    shipments_in_transit = shp_counts.get("In Transit", 0)
    shipments_delivered  = shp_counts.get("Delivered", 0)
    shipments_processing = shp_counts.get("Processing", 0)
    total_shipments      = sum(shp_counts.values())

    # ── 10. Top delivery destinations ────────────────────────
    dest_result = await db.execute(
        select(Shipment.destination, func.count(Shipment.id).label("cnt"))
        .where(Shipment.vendor_id == vendor.id)
        .group_by(Shipment.destination)
        .order_by(func.count(Shipment.id).desc())
        .limit(5)
    )
    top_destinations = [{"name": row[0], "count": row[1]} for row in dest_result.all()]

    return success(
        "Dashboard",
        data={
            "vendor_id":  vendor.id,
            "name":       vendor.name,
            "email":      vendor.email,
            "verification_status":    vendor.verification_status,
            "document_verify_status": vendor.document_verify_status,

            # Products — REAL
            "total_products":    total_products,
            "active_products":   active_products,
            "inactive_products": inactive_products,
            "draft_products":    draft_products,
            "best_products":     best_products,

            # Loans — REAL
            "total_loans":     total_loans,
            "loans_pending":   loans_pending,
            "loans_approved":  loans_approved,
            "loans_disbursed": loans_disbursed,
            "loans_rejected":  loans_rejected,

            # Loyalty — REAL
            "loyalty_points": loyalty_points,
            "loyalty_tier":   loyalty_tier,
            "loyalty_since":  loyalty_since,

            # Onboarding — REAL
            "onboarding": checklist_data,

            # Orders — REAL
            "total_orders":       total_orders,
            "orders_in_progress": orders_in_progress,
            "orders_completed":   orders_completed,
            "orders_refunded":    orders_refunded,

            # RFQs — REAL
            "total_rfqs":            total_rfqs,
            "rfqs_pending_response": rfqs_pending_response,
            "rfqs_buyer_pending":    rfqs_buyer_pending,
            "rfqs_successful":       rfqs_successful,
            "rfqs_expired":          rfqs_expired,

            # Payments — REAL
            "payments_completed": payments_completed,
            "payments_pending":   payments_pending,

            # Shipments — REAL
            "total_shipments":      total_shipments,
            "shipments_in_transit": shipments_in_transit,
            "shipments_delivered":  shipments_delivered,
            "shipments_processing": shipments_processing,

            # Top Destinations — REAL
            "top_destinations": top_destinations,

            # Chart — REAL
            "chart_data": chart_data,

            # Activity — REAL
            "recent_activity": recent_activity,
        },
    )
