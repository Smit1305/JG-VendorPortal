from datetime import datetime
from pydantic import BaseModel, EmailStr


class CompanyProfileBase(BaseModel):
    company_name: str | None = None
    email: EmailStr | None = None
    contact_number: str | None = None
    office_address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    pincode: str | None = None


class CompanyProfileUpdate(CompanyProfileBase):
    pass


class CompanyProfileOut(CompanyProfileBase):
    id: str
    company_logo: str | None = None
    registration_image: str | None = None
    pan_card_image: str | None = None
    updated_at: datetime

    model_config = {"from_attributes": True}
