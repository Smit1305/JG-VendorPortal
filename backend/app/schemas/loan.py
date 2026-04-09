from datetime import datetime
from pydantic import BaseModel


from pydantic import field_validator

class LoanApplyRequest(BaseModel):
    loan_type: str | None = None
    amount: str
    tenure: str | None = None
    purpose: str | None = None

    @field_validator("amount", mode="before")
    @classmethod
    def coerce_amount(cls, v):
        return str(v)


class LoanOut(BaseModel):
    id: str
    loan_type: str | None = None
    amount: str
    tenure: str | None = None
    purpose: str | None = None
    status: str
    interest_rate: str | None = None
    applied_on: str | None = None   # formatted date string YYYY-MM-DD
    disbursed_on: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
