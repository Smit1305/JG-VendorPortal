"""vendor_payments - create vendor_payments table

Revision ID: 0013_vendor_payments
Revises: 0012_vendor_shipments
Create Date: 2026-04-09
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0013_vendor_payments"
down_revision: Union[str, None] = "0012_vendor_shipments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vendor_payments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("vendor_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("organization_id", sa.String(36),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("payment_id", sa.String(30), unique=True, nullable=False),
        sa.Column("order_id", sa.String(50), nullable=True),
        sa.Column("amount", sa.Numeric(14, 2), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("due_date", sa.String(20), nullable=True),
        sa.Column("paid_date", sa.String(20), nullable=True),
        sa.Column("buyer", sa.String(200), nullable=True),
        sa.Column("mode", sa.String(50), nullable=True),
        sa.Column("reference", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_vendor_payments_vendor_id", "vendor_payments", ["vendor_id"])


def downgrade() -> None:
    op.drop_index("ix_vendor_payments_vendor_id", "vendor_payments")
    op.drop_table("vendor_payments")
