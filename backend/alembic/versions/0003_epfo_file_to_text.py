"""epfo_file_to_text - widen epfo_file to Text for base64 storage

Revision ID: 0003_epfo_file_to_text
Revises: 0002_missing_columns
Create Date: 2026-04-08
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0003_epfo_file_to_text"
down_revision: Union[str, None] = "0002_missing_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "vendor_documents",
        "epfo_file",
        type_=sa.Text,
        existing_type=sa.String(500),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "vendor_documents",
        "epfo_file",
        type_=sa.String(500),
        existing_type=sa.Text,
        existing_nullable=True,
    )
