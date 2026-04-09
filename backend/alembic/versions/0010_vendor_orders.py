"""vendor_orders - create vendor_orders table

Revision ID: 0010_vendor_orders
Revises: 0009_support_tickets
Create Date: 2026-04-09
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0010_vendor_orders"
down_revision: Union[str, None] = "0009_support_tickets"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vendor_orders",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("vendor_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("organization_id", sa.String(36),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_id", sa.String(30), unique=True, nullable=False),
        sa.Column("buyer", sa.String(200), nullable=False),
        sa.Column("date", sa.String(20), nullable=False),
        sa.Column("value", sa.Numeric(14, 2), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("products", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_vendor_orders_vendor_id", "vendor_orders", ["vendor_id"])


def downgrade() -> None:
    op.drop_index("ix_vendor_orders_vendor_id", "vendor_orders")
    op.drop_table("vendor_orders")
