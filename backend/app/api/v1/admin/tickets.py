from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin
from app.core.response import APIResponse, success
from app.models.support_ticket import SupportTicket
from app.models.user import User
from app.services import notification_service

router = APIRouter()

VALID_STATUSES = {"Open", "In Progress", "Resolved", "Closed"}


def _fmt(ticket: SupportTicket, vendor_name: str | None = None) -> dict:
    return {
        "id":          ticket.ticket_id,
        "db_id":       ticket.id,
        "vendor_id":   ticket.vendor_id,
        "vendor_name": vendor_name or ticket.vendor_id,
        "subject":     ticket.subject,
        "category":    ticket.category,
        "priority":    ticket.priority,
        "status":      ticket.status,
        "created":     ticket.created_at.strftime("%Y-%m-%d") if ticket.created_at else None,
        "last_update": ticket.updated_at.strftime("%Y-%m-%d %H:%M") if ticket.updated_at else None,
        "messages":    ticket.messages or [],
    }


@router.get("", response_model=APIResponse)
async def list_all_tickets(
    status: str | None = None,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    q = select(SupportTicket).order_by(SupportTicket.created_at.desc())
    if status:
        q = q.where(SupportTicket.status == status)
    result = await db.execute(q)
    tickets = result.scalars().all()

    vendor_ids = list({t.vendor_id for t in tickets})
    users_result = await db.execute(select(User).where(User.id.in_(vendor_ids)))
    user_map = {u.id: u.name for u in users_result.scalars().all()}

    return success("Tickets retrieved", data=[_fmt(t, user_map.get(t.vendor_id)) for t in tickets])


class StatusUpdateRequest(BaseModel):
    status: str


@router.patch("/{ticket_id}/status", response_model=APIResponse)
async def update_ticket_status(
    ticket_id: str,
    payload: StatusUpdateRequest,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {VALID_STATUSES}")

    result = await db.execute(select(SupportTicket).where(SupportTicket.ticket_id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.status = payload.status
    await db.commit()
    await db.refresh(ticket)

    user_result = await db.execute(select(User).where(User.id == ticket.vendor_id))
    vendor = user_result.scalar_one_or_none()

    # Notify vendor of status change
    if vendor:
        await notification_service.create_notification(
            db,
            user_id=vendor.id,
            title="Ticket Status Updated",
            message=f"Your ticket {ticket.ticket_id} has been marked as {payload.status}",
            type="support",
            link="/vendor/support",
        )

    return success("Ticket status updated", data=_fmt(ticket, vendor.name if vendor else None))


class ReplyRequest(BaseModel):
    message: str


@router.post("/{ticket_id}/reply", response_model=APIResponse)
async def admin_reply_to_ticket(
    ticket_id: str,
    payload: ReplyRequest,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not payload.message.strip():
        raise HTTPException(status_code=422, detail="message cannot be empty")

    result = await db.execute(select(SupportTicket).where(SupportTicket.ticket_id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    msgs = list(ticket.messages or [])
    msgs.append({
        "from": "support",
        "text": payload.message.strip(),
        "time": datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
    })
    ticket.messages = msgs
    flag_modified(ticket, "messages")

    # Auto move to In Progress when admin first replies on an Open ticket
    if ticket.status == "Open":
        ticket.status = "In Progress"

    await db.commit()
    await db.refresh(ticket)

    user_result = await db.execute(select(User).where(User.id == ticket.vendor_id))
    vendor = user_result.scalar_one_or_none()

    # Notify the vendor that admin replied
    if vendor:
        await notification_service.create_notification(
            db,
            user_id=vendor.id,
            title="Support Ticket Reply",
            message=f"Admin replied to your ticket {ticket.ticket_id}: {ticket.subject}",
            type="support",
            link="/vendor/support",
        )

    return success("Reply sent", data=_fmt(ticket, vendor.name if vendor else None))
