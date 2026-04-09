"""loans_and_rewards - add loan_applications, loyalty_accounts, loyalty_transactions, loyalty_rewards

Revision ID: 0006_loans_rewards
Revises: 0005_profile_photo_to_text
Create Date: 2026-04-08
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0006_loans_rewards"
down_revision: Union[str, None] = "0005_profile_photo_to_text"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── loan_applications ──────────────────────────────────────
    op.create_table(
        "loan_applications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("organization_id", sa.String(36),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("loan_type", sa.String(100), nullable=True),
        sa.Column("amount", sa.String(50), nullable=False),
        sa.Column("tenure", sa.String(50), nullable=True),
        sa.Column("purpose", sa.Text, nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("interest_rate", sa.String(30), nullable=True),
        sa.Column("disbursed_on", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_loan_applications_user_id", "loan_applications", ["user_id"])

    # ── loyalty_rewards (catalogue) ────────────────────────────
    op.create_table(
        "loyalty_rewards",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("points_required", sa.Integer, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
    )

    # ── loyalty_accounts ───────────────────────────────────────
    op.create_table(
        "loyalty_accounts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False, unique=True),
        sa.Column("total_points", sa.Integer, nullable=False, server_default="0"),
        sa.Column("member_since", sa.Date, nullable=False,
                  server_default=sa.text("CURRENT_DATE")),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_loyalty_accounts_user_id", "loyalty_accounts", ["user_id"])

    # ── loyalty_transactions ───────────────────────────────────
    op.create_table(
        "loyalty_transactions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("account_id", sa.String(36),
                  sa.ForeignKey("loyalty_accounts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("points", sa.Integer, nullable=False),
        sa.Column("event", sa.String(255), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_loyalty_transactions_account_id", "loyalty_transactions", ["account_id"])

    # ── Seed default loyalty rewards catalogue ─────────────────
    op.execute("""
        INSERT INTO loyalty_rewards (id, name, points_required, description, is_active, created_at, updated_at)
        VALUES
          (gen_random_uuid()::text, '5% Commission Discount',    500,  'Get 5% off commission for next 3 orders', true, now(), now()),
          (gen_random_uuid()::text, 'Priority Listing (1 Month)',1000, 'Products appear at top of search for 30 days', true, now(), now()),
          (gen_random_uuid()::text, 'Free Logistics (1 Order)',  1500, 'Free shipping on next order up to Rs. 5,000', true, now(), now()),
          (gen_random_uuid()::text, 'Dedicated Account Manager', 3000, 'Dedicated account manager for 3 months', true, now(), now())
    """)


def downgrade() -> None:
    op.drop_table("loyalty_transactions")
    op.drop_table("loyalty_accounts")
    op.drop_table("loyalty_rewards")
    op.drop_table("loan_applications")
