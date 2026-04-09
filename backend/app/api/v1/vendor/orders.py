"""
Vendor Orders, RFQs, Logistics, Returns, Payments, Loans, Commercials,
Support Requests, and Rewards endpoints.  All fully database-backed.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_db, require_vendor
from app.core.response import APIResponse, success
from app.models.order import Order
from app.models.rfq import RFQ
from app.models.shipment import Shipment
from app.models.payment import Payment
from app.models.vendor_profile import VendorProfile
from app.models.vendor_return import VendorReturn
from app.models.support_ticket import SupportTicket
from app.models.user import User
from app.schemas.loan import LoanApplyRequest
from app.services import email_service, loan_service, loyalty_service, notification_service

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────

def _fmt_order(o: Order) -> dict:
    return {
        "id": o.order_id,
        "buyer": o.buyer,
        "date": o.date,
        "value": float(o.value) if o.value else 0,
        "status": o.status,
        "reason": o.reason,
        "products": o.products or [],
    }

def _fmt_rfq(r: RFQ) -> dict:
    return {
        "id": r.rfq_id,
        "buyer": r.buyer,
        "title": r.title,
        "qty": r.quantity,
        "deadline": r.deadline,
        "description": r.description,
        "category": r.category,
        "status": r.status,
        "quotedPrice": str(int(r.quoted_price)) if r.quoted_price else None,
        "delivery_days": r.delivery_days,
        "remarks": r.remarks,
    }

def _fmt_shipment(s: Shipment) -> dict:
    return {
        "id": s.shipment_id,
        "order_id": s.order_id,
        "carrier": s.carrier,
        "tracking": s.tracking,
        "status": s.status,
        "dispatch_date": s.dispatch_date,
        "expected_delivery": s.expected_delivery,
        "origin": s.origin,
        "destination": s.destination,
        "weight": s.weight,
        "items": s.items_count,
        "timeline": s.timeline or [],
    }

def _fmt_payment(p: Payment) -> dict:
    return {
        "id": p.payment_id,
        "order_id": p.order_id,
        "amount": f"{int(p.amount):,}" if p.amount else "0",
        "status": p.status,
        "due_date": p.due_date,
        "paid_date": p.paid_date,
        "buyer": p.buyer,
        "mode": p.mode,
        "reference": p.reference,
    }


# ── Orders ────────────────────────────────────────────────────

# Keep DEMO_ORDERS/DEMO_RFQS/DEMO_PAYMENTS as empty lists so dashboard import doesn't break
DEMO_ORDERS: list = []
DEMO_RFQS: list = []
DEMO_PAYMENTS: list = []


class CreateOrderRequest(BaseModel):
    buyer: str
    date: str = ""
    value: float | None = None
    status: str = "pending"
    reason: str | None = None
    products: list | None = None


@router.get("/orders", response_model=APIResponse)
async def get_orders(
    status: str | None = Query(None),
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    q = select(Order).where(Order.vendor_id == vendor.id)
    if status:
        q = q.where(Order.status == status)
    q = q.order_by(Order.created_at.desc())
    result = await db.execute(q)
    items = [_fmt_order(o) for o in result.scalars().all()]
    return success("Orders retrieved", data={"items": items, "total": len(items)})


@router.get("/orders/{order_id}", response_model=APIResponse)
async def get_order(
    order_id: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.order_id == order_id, Order.vendor_id == vendor.id)
    )
    o = result.scalar_one_or_none()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    return success("Order retrieved", data=_fmt_order(o))


@router.post("/orders", response_model=APIResponse, status_code=201)
async def create_order(
    payload: CreateOrderRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    year = datetime.utcnow().year
    count_result = await db.execute(select(func.count(Order.id)))
    seq = (count_result.scalar() or 0) + 1
    order_id = f"ORD-{year}-{seq:03d}"
    order = Order(
        vendor_id=vendor.id,
        organization_id=vendor.organization_id,
        order_id=order_id,
        buyer=payload.buyer,
        date=payload.date or datetime.utcnow().strftime("%Y-%m-%d"),
        value=payload.value,
        status=payload.status,
        reason=payload.reason,
        products=payload.products,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return success("Order created", data=_fmt_order(order))


@router.put("/orders/{order_id}", response_model=APIResponse)
async def update_order(
    order_id: str,
    payload: CreateOrderRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.order_id == order_id, Order.vendor_id == vendor.id)
    )
    o = result.scalar_one_or_none()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    o.buyer = payload.buyer
    o.date = payload.date or o.date
    o.value = payload.value
    o.status = payload.status
    o.reason = payload.reason
    o.products = payload.products
    await db.commit()
    await db.refresh(o)
    return success("Order updated", data=_fmt_order(o))


@router.delete("/orders/{order_id}", response_model=APIResponse)
async def delete_order(
    order_id: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.order_id == order_id, Order.vendor_id == vendor.id)
    )
    o = result.scalar_one_or_none()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    await db.delete(o)
    await db.commit()
    return success("Order deleted")


# ── RFQs ─────────────────────────────────────────────────────

class CreateRFQRequest(BaseModel):
    buyer: str
    title: str
    quantity: int | None = None
    deadline: str | None = None
    description: str | None = None
    category: str | None = None
    status: str = "open"


class QuoteRequest(BaseModel):
    price: float
    delivery_days: int | None = None
    remarks: str | None = None


@router.get("/rfqs", response_model=APIResponse)
async def get_rfqs(
    status: str | None = Query(None),
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    q = select(RFQ).where(RFQ.vendor_id == vendor.id)
    if status:
        q = q.where(RFQ.status == status)
    q = q.order_by(RFQ.created_at.desc())
    result = await db.execute(q)
    items = [_fmt_rfq(r) for r in result.scalars().all()]
    return success("RFQs retrieved", data={"items": items, "total": len(items)})


@router.get("/rfqs/{rfq_id}", response_model=APIResponse)
async def get_rfq(
    rfq_id: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RFQ).where(RFQ.rfq_id == rfq_id, RFQ.vendor_id == vendor.id)
    )
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return success("RFQ retrieved", data=_fmt_rfq(r))


@router.post("/rfqs", response_model=APIResponse, status_code=201)
async def create_rfq(
    payload: CreateRFQRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    year = datetime.utcnow().year
    count_result = await db.execute(select(func.count(RFQ.id)))
    seq = (count_result.scalar() or 0) + 1
    rfq_id = f"RFQ-{year}-{seq:03d}"
    rfq = RFQ(
        vendor_id=vendor.id,
        organization_id=vendor.organization_id,
        rfq_id=rfq_id,
        buyer=payload.buyer,
        title=payload.title,
        quantity=payload.quantity,
        deadline=payload.deadline,
        description=payload.description,
        category=payload.category,
        status=payload.status,
    )
    db.add(rfq)
    await db.commit()
    await db.refresh(rfq)
    return success("RFQ created", data=_fmt_rfq(rfq))


@router.post("/rfqs/{rfq_id}/quote", response_model=APIResponse)
async def submit_quote(
    rfq_id: str,
    payload: QuoteRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RFQ).where(RFQ.rfq_id == rfq_id, RFQ.vendor_id == vendor.id)
    )
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="RFQ not found")
    r.quoted_price = payload.price
    r.delivery_days = payload.delivery_days
    r.remarks = payload.remarks
    r.status = "quoted"
    await db.commit()
    return success("Quote submitted successfully. Buyer will review within 2 business days.")


@router.delete("/rfqs/{rfq_id}", response_model=APIResponse)
async def delete_rfq(
    rfq_id: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RFQ).where(RFQ.rfq_id == rfq_id, RFQ.vendor_id == vendor.id)
    )
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="RFQ not found")
    await db.delete(r)
    await db.commit()
    return success("RFQ deleted")


# ── Logistics ─────────────────────────────────────────────────

class CreateShipmentRequest(BaseModel):
    order_id: str | None = None
    carrier: str | None = None
    tracking: str | None = None
    status: str = "Pending"
    dispatch_date: str | None = None
    expected_delivery: str | None = None
    origin: str | None = None
    destination: str | None = None
    weight: str | None = None
    items_count: str | None = None
    timeline: list | None = None


@router.get("/logistics", response_model=APIResponse)
async def get_logistics(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Shipment).where(Shipment.vendor_id == vendor.id).order_by(Shipment.created_at.desc())
    )
    items = [_fmt_shipment(s) for s in result.scalars().all()]
    return success("Logistics retrieved", data={"items": items, "total": len(items)})


@router.get("/logistics/{shipment_id}", response_model=APIResponse)
async def get_shipment(
    shipment_id: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Shipment).where(Shipment.shipment_id == shipment_id, Shipment.vendor_id == vendor.id)
    )
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return success("Shipment retrieved", data=_fmt_shipment(s))


@router.post("/logistics", response_model=APIResponse, status_code=201)
async def create_shipment(
    payload: CreateShipmentRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    year = datetime.utcnow().year
    count_result = await db.execute(select(func.count(Shipment.id)))
    seq = (count_result.scalar() or 0) + 1
    shipment_id = f"SHP-{year}-{seq:03d}"
    shipment = Shipment(
        vendor_id=vendor.id,
        organization_id=vendor.organization_id,
        shipment_id=shipment_id,
        order_id=payload.order_id,
        carrier=payload.carrier,
        tracking=payload.tracking,
        status=payload.status,
        dispatch_date=payload.dispatch_date,
        expected_delivery=payload.expected_delivery,
        origin=payload.origin,
        destination=payload.destination,
        weight=payload.weight,
        items_count=payload.items_count,
        timeline=payload.timeline,
    )
    db.add(shipment)
    await db.commit()
    await db.refresh(shipment)
    return success("Shipment created", data=_fmt_shipment(shipment))


@router.put("/logistics/{shipment_id}", response_model=APIResponse)
async def update_shipment(
    shipment_id: str,
    payload: CreateShipmentRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm.attributes import flag_modified
    result = await db.execute(
        select(Shipment).where(Shipment.shipment_id == shipment_id, Shipment.vendor_id == vendor.id)
    )
    s = result.scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    for field in ("order_id", "carrier", "tracking", "status", "dispatch_date",
                  "expected_delivery", "origin", "destination", "weight", "items_count"):
        val = getattr(payload, field, None)
        if val is not None:
            setattr(s, field, val)
    if payload.timeline is not None:
        s.timeline = payload.timeline
        flag_modified(s, "timeline")
    await db.commit()
    await db.refresh(s)
    return success("Shipment updated", data=_fmt_shipment(s))


# ── Returns ───────────────────────────────────────────────────

class CreateReturnRequest(BaseModel):
    order_id: str
    product: str
    quantity: int | None = None
    reason: str
    refund_amount: float | None = None


def _fmt_return(r: VendorReturn) -> dict:
    return {
        "id":            r.return_id,
        "order_id":      r.order_id,
        "product":       r.product,
        "quantity":      r.quantity,
        "reason":        r.reason,
        "status":        r.status,
        "requested_on":  r.requested_on,
        "refund_amount": float(r.refund_amount) if r.refund_amount else None,
    }


@router.get("/returns", response_model=APIResponse)
async def get_returns(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VendorReturn)
        .where(VendorReturn.vendor_id == vendor.id)
        .order_by(VendorReturn.created_at.desc())
    )
    items = [_fmt_return(r) for r in result.scalars().all()]
    return success("Returns retrieved", data={"items": items, "total": len(items)})


@router.get("/returns/{return_id}", response_model=APIResponse)
async def get_return(
    return_id: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VendorReturn).where(
            VendorReturn.return_id == return_id,
            VendorReturn.vendor_id == vendor.id,
        )
    )
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Return not found")
    return success("Return retrieved", data=_fmt_return(r))


@router.post("/returns", response_model=APIResponse, status_code=201)
async def create_return(
    payload: CreateReturnRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    # Generate sequential return ID: RET-YYYY-NNNN
    year = datetime.utcnow().year
    count_result = await db.execute(select(func.count(VendorReturn.id)))
    seq = (count_result.scalar_one() or 0) + 1
    return_id = f"RET-{year}-{seq:03d}"

    ret = VendorReturn(
        vendor_id=vendor.id,
        organization_id=vendor.organization_id,
        return_id=return_id,
        order_id=payload.order_id,
        product=payload.product,
        quantity=payload.quantity,
        reason=payload.reason,
        refund_amount=payload.refund_amount,
        status="pending",
        requested_on=datetime.utcnow().strftime("%Y-%m-%d"),
    )
    db.add(ret)
    await db.commit()

    return success("Return request submitted", data={
        "id":           return_id,
        "order_id":     ret.order_id,
        "product":      ret.product,
        "quantity":     ret.quantity,
        "reason":       ret.reason,
        "status":       ret.status,
        "requested_on": ret.requested_on,
    })


# ── Payments ──────────────────────────────────────────────────

class CreatePaymentRequest(BaseModel):
    order_id: str | None = None
    amount: float | None = None
    status: str = "pending"
    due_date: str | None = None
    paid_date: str | None = None
    buyer: str | None = None
    mode: str | None = None
    reference: str | None = None


@router.get("/payments", response_model=APIResponse)
async def get_payments(
    status: str | None = Query(None),
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    q = select(Payment).where(Payment.vendor_id == vendor.id)
    if status:
        q = q.where(Payment.status == status.lower())
    q = q.order_by(Payment.created_at.desc())
    result = await db.execute(q)
    items = [_fmt_payment(p) for p in result.scalars().all()]
    return success("Payments retrieved", data={"items": items, "total": len(items)})


@router.get("/payments/{payment_id}", response_model=APIResponse)
async def get_payment(
    payment_id: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Payment).where(Payment.payment_id == payment_id, Payment.vendor_id == vendor.id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    return success("Payment retrieved", data=_fmt_payment(p))


@router.post("/payments", response_model=APIResponse, status_code=201)
async def create_payment(
    payload: CreatePaymentRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    year = datetime.utcnow().year
    count_result = await db.execute(select(func.count(Payment.id)))
    seq = (count_result.scalar() or 0) + 1
    payment_id = f"PAY-{year}-{seq:03d}"
    payment = Payment(
        vendor_id=vendor.id,
        organization_id=vendor.organization_id,
        payment_id=payment_id,
        order_id=payload.order_id,
        amount=payload.amount,
        status=payload.status,
        due_date=payload.due_date,
        paid_date=payload.paid_date,
        buyer=payload.buyer,
        mode=payload.mode,
        reference=payload.reference,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return success("Payment created", data=_fmt_payment(payment))


@router.put("/payments/{payment_id}", response_model=APIResponse)
async def update_payment(
    payment_id: str,
    payload: CreatePaymentRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Payment).where(Payment.payment_id == payment_id, Payment.vendor_id == vendor.id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    for field in ("order_id", "amount", "status", "due_date", "paid_date", "buyer", "mode", "reference"):
        val = getattr(payload, field, None)
        if val is not None:
            setattr(p, field, val)
    await db.commit()
    await db.refresh(p)
    return success("Payment updated", data=_fmt_payment(p))


# ── Loans ─────────────────────────────────────────────────────

@router.get("/loans", response_model=APIResponse)
async def get_loans(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    loans = await loan_service.list_loans(db, vendor.id)
    items = [loan_service.format_loan(l) for l in loans]
    return success("Loan applications retrieved", data={"items": items, "total": len(items)})


@router.post("/loans", response_model=APIResponse, status_code=201)
async def apply_loan(
    payload: LoanApplyRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    loan = await loan_service.apply(db, vendor.id, vendor.organization_id, payload)
    return success(
        "Loan application submitted. Our finance team will contact you within 3 business days.",
        data=loan_service.format_loan(loan),
    )


# ── Commercials ───────────────────────────────────────────────

@router.get("/commercials", response_model=APIResponse)
async def get_commercials(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    # Load real bank details from vendor_profiles
    profile_result = await db.execute(
        select(VendorProfile).where(VendorProfile.user_id == vendor.id)
    )
    profile = profile_result.scalar_one_or_none()
    bank_details = profile.bank_details if profile and profile.bank_details else {
        "account_name": "", "account_number": "", "bank_name": "", "ifsc": "", "branch": ""
    }

    return success("Commercial details retrieved", data={
        "settlement_rules": [
            {"label": "Settlement Cycle", "value": "Net 30 days after delivery confirmation"},
            {"label": "Commission Rate",  "value": "3.5% of invoice value"},
            {"label": "Payment Mode",     "value": "NEFT / RTGS to registered bank account"},
            {"label": "TDS Applicable",   "value": "Yes – 1% on invoice value (Section 194C)"},
        ],
        "bank_details": bank_details,
        "commission_structure": [
            {"tier": "Bronze", "rate": "3.5%", "range": "Up to ₹10L/month"},
            {"tier": "Silver", "rate": "3.0%", "range": "₹10L – ₹50L/month"},
            {"tier": "Gold",   "rate": "2.5%", "range": "₹50L – ₹2Cr/month"},
            {"tier": "Platinum","rate": "2.0%", "range": "Above ₹2Cr/month"},
        ],
    })


class BankDetailsRequest(BaseModel):
    account_name: str = ""
    account_number: str = ""
    bank_name: str = ""
    ifsc: str = ""
    branch: str = ""

@router.put("/commercials/bank", response_model=APIResponse)
async def update_bank_details(
    payload: BankDetailsRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    profile_result = await db.execute(
        select(VendorProfile).where(VendorProfile.user_id == vendor.id)
    )
    profile = profile_result.scalar_one_or_none()
    if not profile:
        # Create a minimal profile row if none exists
        profile = VendorProfile(user_id=vendor.id)
        db.add(profile)
    profile.bank_details = payload.model_dump()
    await db.commit()
    return success("Bank details updated successfully", data=payload.model_dump())


# ── Support ───────────────────────────────────────────────────

DEMO_TICKETS = [
    {
        "id": "TKT-2026-001",
        "subject": "Payment not received for ORD-2026-001",
        "category": "Payments",
        "status": "Resolved",
        "priority": "High",
        "created": "2026-03-20",
        "last_update": "2026-03-22",
        "messages": [
            {"from": "vendor",  "text": "Payment for order ORD-2026-001 is overdue by 5 days.", "time": "2026-03-20 10:30"},
            {"from": "support", "text": "Escalated to finance team. Expect payment in 2 business days.", "time": "2026-03-22 14:15"},
        ],
    },
    {
        "id": "TKT-2026-002",
        "subject": "Product listing not visible in search",
        "category": "Technical Issue",
        "status": "Open",
        "priority": "Medium",
        "created": "2026-04-02",
        "last_update": None,
        "messages": [
            {"from": "vendor", "text": "My product 'Industrial Motor 5HP' does not appear in search results.", "time": "2026-04-02 09:00"},
        ],
    },
]


@router.get("/support", response_model=APIResponse)
async def get_support_tickets(
    status: str | None = Query(None),
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    q = select(SupportTicket).where(SupportTicket.vendor_id == vendor.id)
    if status:
        q = q.where(SupportTicket.status == status)
    q = q.order_by(SupportTicket.created_at.desc())
    result = await db.execute(q)
    tickets = result.scalars().all()
    items = [
        {
            "id": t.ticket_id,
            "subject": t.subject,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "created": t.created_at.strftime("%Y-%m-%d") if t.created_at else None,
            "last_update": t.updated_at.strftime("%Y-%m-%d") if t.updated_at else None,
            "messages": t.messages or [],
        }
        for t in tickets
    ]
    return success("Support tickets retrieved", data={"items": items, "total": len(items)})


class CreateTicketRequest(BaseModel):
    subject: str
    category: str = ""
    priority: str = "Medium"
    description: str = ""


@router.post("/support", response_model=APIResponse, status_code=201)
async def create_support_ticket(
    payload: CreateTicketRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    year = datetime.utcnow().year
    count_result = await db.execute(select(func.count(SupportTicket.id)))
    seq = (count_result.scalar() or 0) + 1
    ticket_id = f"TKT-{year}-{seq:03d}"

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    messages = [{"from": "vendor", "text": payload.description, "time": now_str}] if payload.description else []

    ticket = SupportTicket(
        vendor_id=vendor.id,
        organization_id=vendor.organization_id,
        ticket_id=ticket_id,
        subject=payload.subject,
        category=payload.category or None,
        priority=payload.priority,
        status="Open",
        description=payload.description or None,
        messages=messages,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    # Notify all admin users about the new ticket
    admins_result = await db.execute(select(User).where(User.role == "admin"))
    for admin in admins_result.scalars().all():
        await notification_service.create_notification(
            db,
            user_id=admin.id,
            title="New Support Ticket",
            message=f"{vendor.name} raised ticket {ticket_id}: {payload.subject}",
            type="support",
            link="/admin/tickets",
        )

    return success("Support ticket created. Our team will respond within 24 hours.", data={
        "id": ticket.ticket_id,
        "subject": ticket.subject,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "created": ticket.created_at.strftime("%Y-%m-%d") if ticket.created_at else None,
        "last_update": None,
        "messages": ticket.messages or [],
    })


class ReplyRequest(BaseModel):
    message: str


@router.post("/support/{ticket_id}/reply", response_model=APIResponse)
async def reply_to_ticket(
    ticket_id: str,
    payload: ReplyRequest,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy.orm.attributes import flag_modified
    result = await db.execute(
        select(SupportTicket).where(
            SupportTicket.ticket_id == ticket_id,
            SupportTicket.vendor_id == vendor.id,
        )
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Ticket not found")

    msgs = list(ticket.messages or [])
    msgs.append({
        "from": "vendor",
        "text": payload.message,
        "time": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
    })
    ticket.messages = msgs
    flag_modified(ticket, "messages")
    await db.commit()

    # Notify all admin users of vendor reply
    admins_result = await db.execute(select(User).where(User.role == "admin"))
    for admin in admins_result.scalars().all():
        await notification_service.create_notification(
            db,
            user_id=admin.id,
            title="Vendor Replied to Ticket",
            message=f"{vendor.name} replied on ticket {ticket.ticket_id}: {ticket.subject}",
            type="support",
            link="/admin/tickets",
        )

    return success("Reply sent successfully")


# ── Rewards ───────────────────────────────────────────────────

@router.get("/rewards", response_model=APIResponse)
async def get_rewards(
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    data = await loyalty_service.get_rewards_data(db, vendor.id)
    return success("Rewards retrieved", data=data)


@router.post("/rewards/redeem/{reward_id}", response_model=APIResponse)
async def redeem_reward(
    reward_id: str,
    vendor=Depends(require_vendor),
    db: AsyncSession = Depends(get_db),
):
    reward_name = await loyalty_service.redeem_reward(db, vendor.id, reward_id)
    return success(f"'{reward_name}' redeemed successfully! Check your email for confirmation.")


# ── Assistance ────────────────────────────────────────────────

class AssistanceRequest(BaseModel):
    service: str | None = None
    name: str
    email: str
    phone: str | None = None
    message: str


@router.post("/assistance", response_model=APIResponse, status_code=201)
async def request_assistance(
    payload: AssistanceRequest,
    vendor=Depends(require_vendor),
):
    notify_to = settings.MAIL_FROM
    if notify_to:
        try:
            await email_service.send_assistance_request_notification(
                to=notify_to,
                vendor_name=payload.name,
                vendor_email=payload.email,
                vendor_phone=payload.phone or "",
                service=payload.service or "General Assistance",
                message=payload.message,
            )
        except Exception:
            pass  # Don't fail the request if email sending fails

    return success("Assistance request submitted. Our team will contact you within 24 hours.")
