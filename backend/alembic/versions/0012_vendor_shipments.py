"""vendor_shipments - create vendor_shipments table

Revision ID: 0012_vendor_shipments
Revises: 0011_vendor_rfqs
Create Date: 2026-04-09
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0012_vendor_shipments"
down_revision: Union[str, None] = "0011_vendor_rfqs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vendor_shipments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("vendor_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("organization_id", sa.String(36),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("shipment_id", sa.String(30), unique=True, nullable=False),
        sa.Column("order_id", sa.String(50), nullable=True),
        sa.Column("carrier", sa.String(200), nullable=True),
        sa.Column("tracking", sa.String(100), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="Pending"),
        sa.Column("dispatch_date", sa.String(20), nullable=True),
        sa.Column("expected_delivery", sa.String(20), nullable=True),
        sa.Column("origin", sa.String(300), nullable=True),
        sa.Column("destination", sa.String(300), nullable=True),
        sa.Column("weight", sa.String(50), nullable=True),
        sa.Column("items_count", sa.String(20), nullable=True),
        sa.Column("timeline", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_vendor_shipments_vendor_id", "vendor_shipments", ["vendor_id"])


def downgrade() -> None:
    op.drop_index("ix_vendor_shipments_vendor_id", "vendor_shipments")
    op.drop_table("vendor_shipments")
