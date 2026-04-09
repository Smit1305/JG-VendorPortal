from datetime import datetime
from pydantic import BaseModel, HttpUrl


# ── Vendor Profile ────────────────────────────────────────────

class VendorProfileBase(BaseModel):
    company_name: str | None = None
    email_address: str | None = None
    firm_type: str | None = None
    company_status: str | None = None
    # Location
    country: str | None = None
    state: str | None = None
    district: str | None = None
    zip_code: str | None = None
    city: str | None = None
    apartment: str | None = None
    street_address: str | None = None
    # Contact
    country_code: str | None = None
    phone_landline: str | None = None
    website: str | None = None
    fax: str | None = None
    # Tax
    gst_number: str | None = None
    tan_number: str | None = None
    pan_number: str | None = None
    vat_number: str | None = None
    msme_number: str | None = None
    # Contact person (from register_users)
    contact_person_name: str | None = None
    designation: str | None = None
    # Services & description
    services: list[str] | None = None
    business_description: str | None = None
    # Business financials
    annual_turnover: str | None = None


class VendorProfileCreate(VendorProfileBase):
    pass


class VendorProfileUpdate(VendorProfileBase):
    pass


class VendorProfileOut(VendorProfileBase):
    id: str
    user_id: str
    company_document: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Vendor Documents ──────────────────────────────────────────

class ContactPerson(BaseModel):
    name: str
    phone: str
    email: str | None = None
    designation: str | None = None


class FactoryAddress(BaseModel):
    address: str
    city: str | None = None
    state: str | None = None
    country: str | None = None
    zip_code: str | None = None


class VendorDocumentBase(BaseModel):
    number_of_employees: int | None = None
    epfo_register_number: str | None = None
    registered_address: str | None = None
    head_office_address: str | None = None
    documents: dict | None = None
    contact_persons: list[ContactPerson] | None = None
    factory_addresses: list[FactoryAddress] | None = None
    brand_office_files: list[str] | None = None
    product_categories: list[dict] | None = None


class VendorDocumentCreate(VendorDocumentBase):
    pass


class VendorDocumentUpdate(VendorDocumentBase):
    pass


class VendorDocumentOut(VendorDocumentBase):
    id: str
    user_id: str
    epfo_file: str | None = None
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Vendor Status (Admin action) ──────────────────────────────

class VendorStatusUpdate(BaseModel):
    document_verify_status: str                    # verified | rejected | resubmit
    rejection_reason: str | None = None            # used for reject / resubmit emails


# ── Onboarding checklist ──────────────────────────────────────

class OnboardingChecklist(BaseModel):
    core_details: bool
    documents_uploaded: bool
    business_details: bool
    product_details: bool
    account_verified: bool
    documents_verified: bool
