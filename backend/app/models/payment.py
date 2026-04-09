from sqlalchemy import ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


class Payment(Base, TimestampMixin):
    __tablename__ = "vendor_payments"
    __table_args__ = (
        Index("ix_vendor_payments_vendor_id", "vendor_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    vendor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    payment_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)  # PAY-YYYY-NNN
    order_id: Mapped[str | None] = mapped_column(String(50))
    amount: Mapped[float | None] = mapped_column(Numeric(14, 2))
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    due_date: Mapped[str | None] = mapped_column(String(20))
    paid_date: Mapped[str | None] = mapped_column(String(20))
    buyer: Mapped[str | None] = mapped_column(String(200))
    mode: Mapped[str | None] = mapped_column(String(50))   # NEFT, RTGS, UPI…
    reference: Mapped[str | None] = mapped_column(String(100))

    vendor: Mapped["User"] = relationship("User")
