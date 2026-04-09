from sqlalchemy import Boolean, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


class User(Base, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_role", "role"),
        Index("ix_users_org_id", "organization_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    mobile: Mapped[str | None] = mapped_column(String(30))
    landlineno: Mapped[str | None] = mapped_column(String(30))
    whatsappno: Mapped[str | None] = mapped_column(String(30))
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    verification_status: Mapped[str] = mapped_column(String(20), default="unverified", nullable=False)
    document_verify_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    profile_photo: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    reject_reason: Mapped[str | None] = mapped_column(Text)
    resubmit_reason: Mapped[str | None] = mapped_column(Text)
    # Admin profile fields (from MySQL users table)
    website_link: Mapped[str | None] = mapped_column(String(255))
    full_address: Mapped[str | None] = mapped_column(String(500))

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="users")
    vendor_profile: Mapped["VendorProfile | None"] = relationship(
        "VendorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    vendor_document: Mapped["VendorDocument | None"] = relationship(
        "VendorDocument", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    service_provider: Mapped["ServiceProvider | None"] = relationship(
        "ServiceProvider", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="vendor", cascade="all, delete-orphan"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )
    loan_applications: Mapped[list["LoanApplication"]] = relationship(
        "LoanApplication", back_populates="user", cascade="all, delete-orphan"
    )
    loyalty_account: Mapped["LoyaltyAccount | None"] = relationship(
        "LoyaltyAccount", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
