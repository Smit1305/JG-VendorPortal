from datetime import datetime
from pydantic import BaseModel


class ServiceProviderBase(BaseModel):
    company_name: str | None = None
    registered_address: str | None = None
    country: str | None = None
    country_code: str | None = None
    state: str | None = None
    city: str | None = None
    zip_code: str | None = None
    phone_number: str | None = None
    website: str | None = None
    nature_of_business: str | None = None
    contact_person: str | None = None
    designation: str | None = None
    contact_email: str | None = None
    firm_type: str | None = None
    industry_categories: list | None = None
    industry_subcategories: list | None = None
    gst_number: str | None = None
    tan_number: str | None = None
    pan_number: str | None = None
    epfo_number: str | None = None
    company_reg_number: str | None = None
    msme_available: str | None = None
    msme_details: str | None = None
    iso_available: str | None = None
    iso_details: str | None = None          # Text field in model
    primary_services: str | None = None
    secondary_services: str | None = None
    existing_clients: str | None = None
    past_experience: str | None = None
    annual_turnover: str | None = None      # stored as string in model
    service_centers: list | None = None
    auth_name: str | None = None
    auth_designation: str | None = None
    auth_date: str | None = None
    auth_phone: str | None = None
    auth_email: str | None = None


class ServiceProviderCreate(ServiceProviderBase):
    pass


class ServiceProviderUpdate(ServiceProviderBase):
    pass


class ServiceProviderOut(ServiceProviderBase):
    id: str
    user_id: str
    documents: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
