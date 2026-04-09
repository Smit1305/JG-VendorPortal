from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


class ServiceProvider(Base, TimestampMixin):
    """
    Matches PHP service_providers table exactly.
    """
    __tablename__ = "service_providers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Company info
    company_name: Mapped[str | None] = mapped_column(String(200))       # companyname
    registered_address: Mapped[str | None] = mapped_column(Text)        # regisaddress
    country: Mapped[str | None] = mapped_column(String(100))
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))              # stateprovince
    zip_code: Mapped[str | None] = mapped_column(String(20))            # zippostalcode
    phone_number: Mapped[str | None] = mapped_column(String(30))        # phonenumber
    country_code: Mapped[str | None] = mapped_column(String(10))
    website: Mapped[str | None] = mapped_column(String(200))
    nature_of_business: Mapped[str | None] = mapped_column(String(200)) # natureofbusiness

    # Contact person
    contact_person: Mapped[str | None] = mapped_column(String(100))     # contactperson
    designation: Mapped[str | None] = mapped_column(String(100))
    contact_email: Mapped[str | None] = mapped_column(String(150))      # email

    # Firm details
    firm_type: Mapped[str | None] = mapped_column(String(100))          # typeoffirm
    industry_categories: Mapped[list | None] = mapped_column(JSONB)     # indcategory
    industry_subcategories: Mapped[list | None] = mapped_column(JSONB)  # indsubcatgory

    # Tax & registration
    gst_number: Mapped[str | None] = mapped_column(String(30))
    tan_number: Mapped[str | None] = mapped_column(String(30))
    pan_number: Mapped[str | None] = mapped_column(String(30))
    epfo_number: Mapped[str | None] = mapped_column(String(50))
    company_reg_number: Mapped[str | None] = mapped_column(String(50))  # company_reg_number
    msme_available: Mapped[str | None] = mapped_column(String(10))      # yes/no
    msme_details: Mapped[str | None] = mapped_column(String(200))
    iso_available: Mapped[str | None] = mapped_column(String(10))       # yes/no
    iso_details: Mapped[str | None] = mapped_column(Text)

    # Services
    primary_services: Mapped[str | None] = mapped_column(Text)          # primaryservies
    secondary_services: Mapped[str | None] = mapped_column(Text)        # secondaryservices

    # Experience
    existing_clients: Mapped[str | None] = mapped_column(Text)          # existingclients
    past_experience: Mapped[str | None] = mapped_column(String(500))    # pastexp
    annual_turnover: Mapped[str | None] = mapped_column(String(50))     # stored as string

    # Document files — JSONB for flexibility
    documents: Mapped[dict | None] = mapped_column(JSONB)
    # {gst_file, pan_file, tan_file, company_file, msme_file, iso_files[],
    #  financial_statements[], client_file, aadhar_file}

    # Service centers — JSONB array
    service_centers: Mapped[list | None] = mapped_column(JSONB)
    # [{"address":"","city":"","state":"","pin_code":"","contact_person":"","phone":""}]

    # Authorization
    auth_name: Mapped[str | None] = mapped_column(String(100))
    auth_designation: Mapped[str | None] = mapped_column(String(100))
    auth_date: Mapped[str | None] = mapped_column(String(20))
    auth_phone: Mapped[str | None] = mapped_column(String(30))          # auth_phonee
    auth_email: Mapped[str | None] = mapped_column(String(150))

    user: Mapped["User"] = relationship("User", back_populates="service_provider")
