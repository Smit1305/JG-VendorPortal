from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


class Shipment(Base, TimestampMixin):
    __tablename__ = "vendor_shipments"
    __table_args__ = (
        Index("ix_vendor_shipments_vendor_id", "vendor_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    vendor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    shipment_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)  # SHP-YYYY-NNN
    order_id: Mapped[str | None] = mapped_column(String(50))
    carrier: Mapped[str | None] = mapped_column(String(200))
    tracking: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="Pending", nullable=False)
    dispatch_date: Mapped[str | None] = mapped_column(String(20))
    expected_delivery: Mapped[str | None] = mapped_column(String(20))
    origin: Mapped[str | None] = mapped_column(String(300))
    destination: Mapped[str | None] = mapped_column(String(300))
    weight: Mapped[str | None] = mapped_column(String(50))
    items_count: Mapped[str | None] = mapped_column(String(20))
    timeline: Mapped[list | None] = mapped_column(JSONB)  # [{event, location, time}]

    vendor: Mapped["User"] = relationship("User")
