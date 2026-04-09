from datetime import date, datetime
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


class LoyaltyAccount(Base, TimestampMixin):
    """One loyalty account per vendor user — tracks total points and tier."""
    __tablename__ = "loyalty_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True
    )
    total_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    member_since: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="loyalty_account")
    transactions: Mapped[list["LoyaltyTransaction"]] = relationship(
        "LoyaltyTransaction", back_populates="account",
        cascade="all, delete-orphan", order_by="LoyaltyTransaction.created_at.desc()"
    )


class LoyaltyTransaction(Base):
    """Single point-earning or redemption event for a vendor."""
    __tablename__ = "loyalty_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    account_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("loyalty_accounts.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    points: Mapped[int] = mapped_column(Integer, nullable=False)   # positive=earned, negative=redeemed
    event: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # "earned" | "redeemed"
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    account: Mapped["LoyaltyAccount"] = relationship("LoyaltyAccount", back_populates="transactions")


class LoyaltyReward(Base, TimestampMixin):
    """Admin-managed catalogue of redeemable rewards."""
    __tablename__ = "loyalty_rewards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    points_required: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
