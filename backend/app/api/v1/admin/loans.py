from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, require_admin
from app.core.response import APIResponse, success
from app.models.loan import LoanApplication
from app.models.user import User

router = APIRouter()


class LoanUpdateRequest(BaseModel):
    status: str | None = None          # pending | approved | rejected | disbursed
    interest_rate: str | None = None   # e.g. "14% p.a."
    disbursed_on: str | None = None    # YYYY-MM-DD


def _fmt(loan: LoanApplication, vendor_name: str | None = None) -> dict:
    return {
        "id": loan.id,
        "vendor_id": loan.user_id,
        "vendor_name": vendor_name or loan.user_id,
        "loan_type": loan.loan_type,
        "amount": loan.amount,
        "tenure": loan.tenure,
        "purpose": loan.purpose,
        "status": loan.status,
        "interest_rate": loan.interest_rate,
        "applied_on": loan.created_at.strftime("%Y-%m-%d") if loan.created_at else None,
        "disbursed_on": loan.disbursed_on,
    }


@router.get("", response_model=APIResponse)
async def list_all_loans(
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LoanApplication).order_by(LoanApplication.created_at.desc())
    )
    loans = result.scalars().all()

    # Bulk-load vendor names
    vendor_ids = list({l.user_id for l in loans})
    users_result = await db.execute(select(User).where(User.id.in_(vendor_ids)))
    user_map = {u.id: u.name for u in users_result.scalars().all()}

    return success("Loans retrieved", data=[_fmt(l, user_map.get(l.user_id)) for l in loans])


@router.patch("/{loan_id}", response_model=APIResponse)
async def update_loan(
    loan_id: str,
    payload: LoanUpdateRequest,
    admin=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(LoanApplication).where(LoanApplication.id == loan_id))
    loan = result.scalar_one_or_none()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    VALID_STATUSES = {"pending", "approved", "rejected", "disbursed"}
    if payload.status is not None:
        if payload.status not in VALID_STATUSES:
            raise HTTPException(status_code=422, detail=f"status must be one of {VALID_STATUSES}")
        loan.status = payload.status

    if payload.interest_rate is not None:
        loan.interest_rate = payload.interest_rate

    if payload.disbursed_on is not None:
        loan.disbursed_on = payload.disbursed_on
        if loan.status != "disbursed":
            loan.status = "disbursed"

    await db.commit()
    await db.refresh(loan)

    # get vendor name
    user_result = await db.execute(select(User).where(User.id == loan.user_id))
    vendor = user_result.scalar_one_or_none()
    return success("Loan updated", data=_fmt(loan, vendor.name if vendor else None))
