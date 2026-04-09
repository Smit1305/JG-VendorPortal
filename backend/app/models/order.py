from sqlalchemy import ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


class Order(Base, TimestampMixin):
    __tablename__ = "vendor_orders"
    __table_args__ = (
        Index("ix_vendor_orders_vendor_id", "vendor_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    vendor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    order_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)  # ORD-YYYY-NNN
    buyer: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[str] = mapped_column(String(20), nullable=False)
    value: Mapped[float | None] = mapped_column(Numeric(14, 2))
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    products: Mapped[list | None] = mapped_column(JSONB)  # [{name, qty, price, image}]

    vendor: Mapped["User"] = relationship("User")
