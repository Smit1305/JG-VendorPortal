"""missing_columns - add annual_turnover to vendor_profiles

Revision ID: 0002_missing_columns
Revises: 0001_full_schema
Create Date: 2026-04-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002_missing_columns"
down_revision: Union[str, None] = "0001_full_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── vendor_profiles: add annual_turnover ──────────────────
    op.add_column("vendor_profiles", sa.Column("annual_turnover", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("vendor_profiles", "annual_turnover")
