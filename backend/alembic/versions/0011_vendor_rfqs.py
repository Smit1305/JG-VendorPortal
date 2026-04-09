"""vendor_rfqs - create vendor_rfqs table

Revision ID: 0011_vendor_rfqs
Revises: 0010_vendor_orders
Create Date: 2026-04-09
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0011_vendor_rfqs"
down_revision: Union[str, None] = "0010_vendor_orders"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vendor_rfqs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("vendor_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("organization_id", sa.String(36),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rfq_id", sa.String(30), unique=True, nullable=False),
        sa.Column("buyer", sa.String(200), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=True),
        sa.Column("deadline", sa.String(20), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("category", sa.String(150), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("quoted_price", sa.Numeric(14, 2), nullable=True),
        sa.Column("delivery_days", sa.Integer, nullable=True),
        sa.Column("remarks", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_vendor_rfqs_vendor_id", "vendor_rfqs", ["vendor_id"])


def downgrade() -> None:
    op.drop_index("ix_vendor_rfqs_vendor_id", "vendor_rfqs")
    op.drop_table("vendor_rfqs")
