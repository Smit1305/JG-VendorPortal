from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


class VendorProfile(Base, TimestampMixin):
    """
    Matches PHP vendor_core_details + register_users company fields.
    Stores all vendor company/profile information.
    """
    __tablename__ = "vendor_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Company info — from vendor_core_details
    company_name: Mapped[str | None] = mapped_column(String(200))   # nameofcompany
    email_address: Mapped[str | None] = mapped_column(String(150))  # emailaddress
    firm_type: Mapped[str | None] = mapped_column(String(100))      # typeoffirm
    company_status: Mapped[str | None] = mapped_column(String(100)) # statusofcompany

    # Location — from vendor_core_details
    country: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))          # stateprovince
    district: Mapped[str | None] = mapped_column(String(100))
    zip_code: Mapped[str | None] = mapped_column(String(20))        # zippostalcode
    city: Mapped[str | None] = mapped_column(String(100))           # citytownvillage
    apartment: Mapped[str | None] = mapped_column(String(200))
    street_address: Mapped[str | None] = mapped_column(Text)

    # Contact — from vendor_core_details
    country_code: Mapped[str | None] = mapped_column(String(10))
    phone_landline: Mapped[str | None] = mapped_column(String(30))  # stdcodewithphone
    website: Mapped[str | None] = mapped_column(String(200))

    # Tax numbers — from register_users
    gst_number: Mapped[str | None] = mapped_column(String(30))      # gstno
    tan_number: Mapped[str | None] = mapped_column(String(30))      # tanno
    pan_number: Mapped[str | None] = mapped_column(String(30))      # panno
    vat_number: Mapped[str | None] = mapped_column(String(30))      # vatno
    msme_number: Mapped[str | None] = mapped_column(String(30))

    # Services selected at registration — JSONB array
    services: Mapped[list | None] = mapped_column(JSONB)            # services[]

    # Business description
    business_description: Mapped[str | None] = mapped_column(Text)

    # Company document upload
    company_document: Mapped[str | None] = mapped_column(String(500))

    # Contact person info — from register_users
    contact_person_name: Mapped[str | None] = mapped_column(String(100))  # contactpersonname
    designation: Mapped[str | None] = mapped_column(String(100))
    fax: Mapped[str | None] = mapped_column(String(30))

    # Business financials — from PHP vendors.turnover
    annual_turnover: Mapped[str | None] = mapped_column(String(100))

    # Bank account details (stored as JSONB)
    bank_details: Mapped[dict | None] = mapped_column(JSONB)

    user: Mapped["User"] = relationship("User", back_populates="vendor_profile", lazy="select")
