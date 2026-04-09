from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


class LoanApplication(Base, TimestampMixin):
    """Vendor loan applications submitted through the portal."""
    __tablename__ = "loan_applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    loan_type: Mapped[str | None] = mapped_column(String(100))
    amount: Mapped[str] = mapped_column(String(50), nullable=False)
    tenure: Mapped[str | None] = mapped_column(String(50))
    purpose: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
    interest_rate: Mapped[str | None] = mapped_column(String(30))
    disbursed_on: Mapped[str | None] = mapped_column(String(20))  # store as YYYY-MM-DD string

    user: Mapped["User"] = relationship("User", back_populates="loan_applications")
