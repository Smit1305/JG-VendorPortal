"""bank_details - add bank_details jsonb to vendor_profiles

Revision ID: 0007_bank_details
Revises: 0006_loans_rewards
Create Date: 2026-04-09
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0007_bank_details"
down_revision: Union[str, None] = "0006_loans_rewards"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "vendor_profiles",
        sa.Column("bank_details", JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("vendor_profiles", "bank_details")
