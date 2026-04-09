from pydantic import BaseModel, EmailStr, field_validator
import re


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    mobile: str
    password: str
    company_name: str
    firm_type: str
    city: str
    state: str
    country: str
    pin_code: str | None = None
    address: str | None = None
    district: str | None = None
    apartment: str | None = None
    phone: str | None = None          # landline (stored on users.landlineno)
    alt_contact: str | None = None    # whatsapp (stored on users.whatsappno)
    country_code: str | None = None
    phone_landline: str | None = None
    fax: str | None = None
    website: str | None = None
    gst_number: str | None = None
    tan_number: str | None = None
    pan_number: str | None = None
    vat_number: str | None = None
    msme_number: str | None = None
    company_status: str | None = None
    services: list[str] | None = None
    contact_person_name: str | None = None
    designation: str | None = None
    business_description: str | None = None
    annual_turnover: str | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("mobile")
    @classmethod
    def mobile_digits(cls, v: str) -> str:
        # Accept +countrycode + number format
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not re.fullmatch(r"\+?\d{7,15}", cleaned):
            raise ValueError("Invalid mobile number")
        return cleaned


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user: dict | None = None  # basic user info for frontend navbar


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v
