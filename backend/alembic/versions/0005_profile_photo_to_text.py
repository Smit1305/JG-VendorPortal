"""profile_photo column to Text for base64 storage

Revision ID: 0005_profile_photo_to_text
Revises: 0004_notifications
Create Date: 2026-04-08
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0005_profile_photo_to_text"
down_revision: Union[str, None] = "0004_notifications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("users", "profile_photo", type_=sa.Text, existing_type=sa.String(500), existing_nullable=True)


def downgrade() -> None:
    op.alter_column("users", "profile_photo", type_=sa.String(500), existing_type=sa.Text, existing_nullable=True)
