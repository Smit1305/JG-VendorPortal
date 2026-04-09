from sqlalchemy import ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


class RFQ(Base, TimestampMixin):
    __tablename__ = "vendor_rfqs"
    __table_args__ = (
        Index("ix_vendor_rfqs_vendor_id", "vendor_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    vendor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    rfq_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)  # RFQ-YYYY-NNN
    buyer: Mapped[str] = mapped_column(String(200), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    quantity: Mapped[int | None] = mapped_column()
    deadline: Mapped[str | None] = mapped_column(String(20))
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(150))
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)
    quoted_price: Mapped[float | None] = mapped_column(Numeric(14, 2))
    delivery_days: Mapped[int | None] = mapped_column()
    remarks: Mapped[str | None] = mapped_column(Text)

    vendor: Mapped["User"] = relationship("User")
