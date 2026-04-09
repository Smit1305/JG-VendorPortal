"""support_tickets - create support_tickets table

Revision ID: 0009_support_tickets
Revises: 0008_vendor_returns
Create Date: 2026-04-09
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0009_support_tickets"
down_revision: Union[str, None] = "0008_vendor_returns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "support_tickets",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("vendor_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("organization_id", sa.String(36),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ticket_id", sa.String(30), unique=True, nullable=False),
        sa.Column("subject", sa.String(300), nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("priority", sa.String(20), nullable=False, server_default="Medium"),
        sa.Column("status", sa.String(20), nullable=False, server_default="Open"),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("messages", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_support_tickets_vendor_id", "support_tickets", ["vendor_id"])


def downgrade() -> None:
    op.drop_index("ix_support_tickets_vendor_id", "support_tickets")
    op.drop_table("support_tickets")
