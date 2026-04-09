from pydantic import BaseModel, EmailStr


class OrganizationBase(BaseModel):
    name: str
    slug: str
    email: EmailStr | None = None
    contact_number: str | None = None
    address: str | None = None
    logo: str | None = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    contact_number: str | None = None
    address: str | None = None
    logo: str | None = None


class OrganizationOut(OrganizationBase):
    id: str
    is_active: bool

    model_config = {"from_attributes": True}
