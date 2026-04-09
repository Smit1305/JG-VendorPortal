from datetime import date

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.loan import LoanApplication
from app.schemas.loan import LoanApplyRequest


async def list_loans(db: AsyncSession, user_id: str) -> list[LoanApplication]:
    result = await db.execute(
        select(LoanApplication)
        .where(LoanApplication.user_id == user_id)
        .order_by(LoanApplication.created_at.desc())
    )
    return result.scalars().all()


async def apply(
    db: AsyncSession,
    user_id: str,
    org_id: str,
    payload: LoanApplyRequest,
) -> LoanApplication:
    loan = LoanApplication(
        user_id=user_id,
        organization_id=org_id,
        loan_type=payload.loan_type,
        amount=payload.amount,
        tenure=payload.tenure,
        purpose=payload.purpose,
        status="pending",
    )
    db.add(loan)
    await db.commit()
    await db.refresh(loan)
    return loan


def format_loan(loan: LoanApplication) -> dict:
    """Return a dict matching the frontend LoanOut shape."""
    return {
        "id": loan.id,
        "loan_type": loan.loan_type,
        "amount": loan.amount,
        "tenure": loan.tenure,
        "purpose": loan.purpose,
        "status": loan.status,
        "interest_rate": loan.interest_rate,
        "applied_on": loan.created_at.strftime("%Y-%m-%d") if loan.created_at else None,
        "disbursed_on": loan.disbursed_on,
    }
