from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    name: str
    email: EmailStr
    mobile: str | None = None


class UserCreate(UserBase):
    password: str
    role: str = "vendor"
    organization_id: str


class UserUpdate(BaseModel):
    """Fields a vendor can update on their own profile."""
    name: str | None = None
    mobile: str | None = None
    profile_photo: str | None = None
    landlineno: str | None = None
    whatsappno: str | None = None
    # Vendor profile fields (passed through to vendor_profiles table)
    company_name: str | None = None
    country: str | None = None
    city: str | None = None
    state: str | None = None
    district: str | None = None
    zip_code: str | None = None      # stored as zip_code in vendor_profiles
    street_address: str | None = None
    apartment: str | None = None
    country_code: str | None = None
    phone_landline: str | None = None
    website: str | None = None
    fax: str | None = None
    contact_person_name: str | None = None
    designation: str | None = None
    annual_turnover: str | None = None
    # Tax / registration numbers
    gst_number: str | None = None
    tan_number: str | None = None
    pan_number: str | None = None
    vat_number: str | None = None
    msme_number: str | None = None
    # Business details
    business_description: str | None = None
    services: list[str] | None = None


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str


class UserStatusUpdate(BaseModel):
    verification_status: str | None = None
    document_verify_status: str | None = None
    is_active: bool | None = None


class UserOut(UserBase):
    id: str
    role: str
    verification_status: str
    document_verify_status: str
    profile_photo: str | None
    is_active: bool
    organization_id: str
    created_at: datetime
    landlineno: str | None = None
    whatsappno: str | None = None
    reject_reason: str | None = None
    resubmit_reason: str | None = None
    website_link: str | None = None
    full_address: str | None = None

    model_config = {"from_attributes": True}


class VendorProfileFlatOut(UserOut):
    """
    Flattened response for GET /vendor/profile.
    Merges user fields + vendor_profile fields into one object
    using the field names the frontend expects.
    """
    full_name: str | None = None
    photo_url: str | None = None
    company_name: str | None = None
    firm_type: str | None = None
    company_status: str | None = None
    country: str | None = None
    city: str | None = None
    state: str | None = None
    district: str | None = None
    pin_code: str | None = None          # vendor_profiles.zip_code
    address: str | None = None           # vendor_profiles.street_address
    apartment: str | None = None
    country_code: str | None = None
    phone_landline: str | None = None    # vendor_profiles.phone_landline (stdcodewithphone)
    gst_no: str | None = None            # vendor_profiles.gst_number
    tan_no: str | None = None            # vendor_profiles.tan_number
    pan_no: str | None = None            # vendor_profiles.pan_number
    vat_no: str | None = None            # vendor_profiles.vat_number
    msme_number: str | None = None
    website: str | None = None
    fax: str | None = None
    contact_person_name: str | None = None
    designation: str | None = None
    business_description: str | None = None
    services: list | None = None
    annual_turnover: str | None = None

    @classmethod
    def from_user(cls, user) -> "VendorProfileFlatOut":
        vp = getattr(user, "vendor_profile", None)
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            mobile=user.mobile,
            role=user.role,
            verification_status=user.verification_status,
            document_verify_status=user.document_verify_status,
            profile_photo=user.profile_photo,
            is_active=user.is_active,
            organization_id=user.organization_id,
            created_at=user.created_at,
            landlineno=user.landlineno,
            whatsappno=user.whatsappno,
            reject_reason=user.reject_reason,
            resubmit_reason=user.resubmit_reason,
            full_name=user.name,
            photo_url=user.profile_photo,
            company_name=vp.company_name if vp else None,
            firm_type=vp.firm_type if vp else None,
            company_status=vp.company_status if vp else None,
            country=vp.country if vp else None,
            city=vp.city if vp else None,
            state=vp.state if vp else None,
            district=vp.district if vp else None,
            pin_code=vp.zip_code if vp else None,
            address=vp.street_address if vp else None,
            apartment=vp.apartment if vp else None,
            country_code=vp.country_code if vp else None,
            phone_landline=vp.phone_landline if vp else None,
            gst_no=vp.gst_number if vp else None,
            tan_no=vp.tan_number if vp else None,
            pan_no=vp.pan_number if vp else None,
            vat_no=vp.vat_number if vp else None,
            msme_number=vp.msme_number if vp else None,
            website=vp.website if vp else None,
            fax=vp.fax if vp else None,
            contact_person_name=vp.contact_person_name if vp else None,
            designation=vp.designation if vp else None,
            business_description=vp.business_description if vp else None,
            services=vp.services if vp else None,
            annual_turnover=vp.annual_turnover if vp else None,
        )


class UserWithVendorOut(UserOut):
    """Extended user response that includes nested vendor profile."""
    vendor_profile: "VendorProfileOut | None" = None


# Resolve forward reference after vendor schema is importable
def _rebuild():
    from app.schemas.vendor import VendorProfileOut  # noqa: F401
    UserWithVendorOut.model_rebuild()


_rebuild()
