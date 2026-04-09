from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    logo: Mapped[str | None] = mapped_column(String(500))
    email: Mapped[str | None] = mapped_column(String(150))
    contact_number: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str | None] = mapped_column(String(500))

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="organization")
    products: Mapped[list["Product"]] = relationship("Product", back_populates="organization")
    categories: Mapped[list["Category"]] = relationship("Category", back_populates="organization")
