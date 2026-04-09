from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, new_uuid


class CompanyProfile(Base, TimestampMixin):
    """Singleton — admin company profile."""
    __tablename__ = "company_profile"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    company_name: Mapped[str | None] = mapped_column(String(200))
    company_logo: Mapped[str | None] = mapped_column(String(500))
    email: Mapped[str | None] = mapped_column(String(150))
    contact_number: Mapped[str | None] = mapped_column(String(20))
    office_address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str | None] = mapped_column(String(100))
    pincode: Mapped[str | None] = mapped_column(String(20))
    registration_image: Mapped[str | None] = mapped_column(String(500))
    pan_card_image: Mapped[str | None] = mapped_column(String(500))
