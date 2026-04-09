from sqlalchemy import ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


class VendorReturn(Base, TimestampMixin):
    __tablename__ = "vendor_returns"
    __table_args__ = (
        Index("ix_vendor_returns_vendor_id", "vendor_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    vendor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    return_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)  # RET-YYYY-NNNN
    order_id: Mapped[str] = mapped_column(String(50), nullable=False)
    product: Mapped[str] = mapped_column(String(300), nullable=False)
    quantity: Mapped[int | None] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    refund_amount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    requested_on: Mapped[str] = mapped_column(String(20), nullable=False)  # YYYY-MM-DD

    vendor: Mapped["User"] = relationship("User")
