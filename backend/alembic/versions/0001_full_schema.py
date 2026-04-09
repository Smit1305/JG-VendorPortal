"""full_schema - matches jigisha_vendor.sql

Revision ID: 0001_full_schema
Revises:
Create Date: 2026-04-06
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_full_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # NOTE: Using VARCHAR for enum columns to avoid async enum creation issues.
    # SQLAlchemy models use Enum types but the DB stores them as varchar-compatible values.

    # ── organizations ──────────────────────────────────────────
    op.create_table(
        "organizations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(200), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("logo", sa.String(500)),
        sa.Column("email", sa.String(150)),
        sa.Column("contact_number", sa.String(20)),
        sa.Column("address", sa.String(500)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ── token_blacklist ────────────────────────────────────────
    op.create_table(
        "token_blacklist",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("token", sa.Text, nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_token_blacklist_token", "token_blacklist", ["token"])
    op.create_index("ix_token_blacklist_expires_at", "token_blacklist", ["expires_at"])

    # ── document_types (was 'masters') ─────────────────────────
    op.create_table(
        "document_types",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("doc_type", sa.String(50), nullable=False, unique=True),
        sa.Column("upload_type", sa.String(10), nullable=False, server_default="Single"),
        sa.Column("is_required", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ── company_profile ────────────────────────────────────────
    op.create_table(
        "company_profile",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_name", sa.String(200)),
        sa.Column("company_logo", sa.String(500)),
        sa.Column("email", sa.String(150)),
        sa.Column("contact_number", sa.String(20)),
        sa.Column("office_address", sa.Text),
        sa.Column("city", sa.String(100)),
        sa.Column("state", sa.String(100)),
        sa.Column("country", sa.String(100)),
        sa.Column("pincode", sa.String(20)),
        sa.Column("registration_image", sa.String(500)),
        sa.Column("pan_card_image", sa.String(500)),
        sa.Column("gst_percentage", sa.String(10)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ── users ──────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("organization_id", sa.String(36),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(150), nullable=False, unique=True),
        sa.Column("mobile", sa.String(30)),
        sa.Column("landlineno", sa.String(30)),
        sa.Column("whatsappno", sa.String(30)),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("verification_status", sa.String(20), nullable=False, server_default="unverified"),
        sa.Column("document_verify_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("profile_photo", sa.String(500)),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("reject_reason", sa.Text),
        sa.Column("resubmit_reason", sa.Text),
        sa.Column("website_link", sa.String(255)),
        sa.Column("full_address", sa.String(500)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_org_id", "users", ["organization_id"])

    # ── refresh_tokens ─────────────────────────────────────────
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token", sa.Text, nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_revoked", sa.Boolean, nullable=False, server_default="false"),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_token", "refresh_tokens", ["token"])

    # ── password_reset_tokens ──────────────────────────────────
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean, nullable=False, server_default="false"),
    )
    op.create_index("ix_prt_token", "password_reset_tokens", ["token"])
    op.create_index("ix_prt_user_id", "password_reset_tokens", ["user_id"])

    # ── categories ─────────────────────────────────────────────
    op.create_table(
        "categories",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("organization_id", sa.String(36),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parent_id", sa.String(36),
                  sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("label", sa.SmallInteger, nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_categories_parent_id", "categories", ["parent_id"])
    op.create_index("ix_categories_org_id", "categories", ["organization_id"])
    op.create_index("ix_categories_label", "categories", ["label"])

    # ── vendor_profiles ────────────────────────────────────────
    op.create_table(
        "vendor_profiles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("company_name", sa.String(200)),
        sa.Column("email_address", sa.String(150)),
        sa.Column("firm_type", sa.String(100)),
        sa.Column("company_status", sa.String(100)),
        sa.Column("country", sa.String(100)),
        sa.Column("state", sa.String(100)),
        sa.Column("district", sa.String(100)),
        sa.Column("zip_code", sa.String(20)),
        sa.Column("city", sa.String(100)),
        sa.Column("apartment", sa.String(200)),
        sa.Column("street_address", sa.Text),
        sa.Column("country_code", sa.String(10)),
        sa.Column("phone_landline", sa.String(30)),
        sa.Column("website", sa.String(200)),
        sa.Column("fax", sa.String(30)),
        sa.Column("gst_number", sa.String(30)),
        sa.Column("tan_number", sa.String(30)),
        sa.Column("pan_number", sa.String(30)),
        sa.Column("vat_number", sa.String(30)),
        sa.Column("msme_number", sa.String(30)),
        sa.Column("services", postgresql.JSONB),
        sa.Column("business_description", sa.Text),
        sa.Column("company_document", sa.String(500)),
        sa.Column("contact_person_name", sa.String(100)),
        sa.Column("designation", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ── vendor_documents ───────────────────────────────────────
    op.create_table(
        "vendor_documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("number_of_employees", sa.Integer),
        sa.Column("epfo_register_number", sa.String(50)),
        sa.Column("epfo_file", sa.String(500)),
        sa.Column("registered_address", sa.Text),
        sa.Column("head_office_address", sa.Text),
        sa.Column("documents", postgresql.JSONB),
        sa.Column("contact_persons", postgresql.JSONB),
        sa.Column("factory_addresses", postgresql.JSONB),
        sa.Column("brand_office_files", postgresql.JSONB),
        sa.Column("product_categories", postgresql.JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ── service_providers ──────────────────────────────────────
    op.create_table(
        "service_providers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("company_name", sa.String(200)),
        sa.Column("registered_address", sa.Text),
        sa.Column("country", sa.String(100)),
        sa.Column("city", sa.String(100)),
        sa.Column("state", sa.String(100)),
        sa.Column("zip_code", sa.String(20)),
        sa.Column("phone_number", sa.String(30)),
        sa.Column("country_code", sa.String(10)),
        sa.Column("website", sa.String(200)),
        sa.Column("nature_of_business", sa.String(200)),
        sa.Column("contact_person", sa.String(100)),
        sa.Column("designation", sa.String(100)),
        sa.Column("contact_email", sa.String(150)),
        sa.Column("firm_type", sa.String(100)),
        sa.Column("industry_categories", postgresql.JSONB),
        sa.Column("industry_subcategories", postgresql.JSONB),
        sa.Column("gst_number", sa.String(30)),
        sa.Column("tan_number", sa.String(30)),
        sa.Column("pan_number", sa.String(30)),
        sa.Column("epfo_number", sa.String(50)),
        sa.Column("company_reg_number", sa.String(50)),
        sa.Column("msme_available", sa.String(10)),
        sa.Column("msme_details", sa.String(200)),
        sa.Column("iso_available", sa.String(10)),
        sa.Column("iso_details", sa.Text),
        sa.Column("primary_services", sa.Text),
        sa.Column("secondary_services", sa.Text),
        sa.Column("existing_clients", sa.Text),
        sa.Column("past_experience", sa.String(500)),
        sa.Column("annual_turnover", sa.String(50)),
        sa.Column("documents", postgresql.JSONB),
        sa.Column("service_centers", postgresql.JSONB),
        sa.Column("auth_name", sa.String(100)),
        sa.Column("auth_designation", sa.String(100)),
        sa.Column("auth_date", sa.String(20)),
        sa.Column("auth_phone", sa.String(30)),
        sa.Column("auth_email", sa.String(150)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ── products ───────────────────────────────────────────────
    op.create_table(
        "products",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("organization_id", sa.String(36),
                  sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("vendor_id", sa.String(36),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category_id", sa.String(36),
                  sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("regular_price", sa.Numeric(12, 2)),
        sa.Column("sale_price", sa.Numeric(12, 2)),
        sa.Column("description", sa.Text),
        sa.Column("height", sa.Numeric(8, 2)),
        sa.Column("width", sa.Numeric(8, 2)),
        sa.Column("weight", sa.Numeric(8, 2)),
        sa.Column("thumbnail_image", sa.String(500)),
        sa.Column("gallery_images", postgresql.JSONB),
        sa.Column("attributes", postgresql.JSONB),
        sa.Column("sku_type", sa.String(10), nullable=False, server_default="single"),
        sa.Column("status", sa.String(10), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_products_vendor_id", "products", ["vendor_id"])
    op.create_index("ix_products_org_id", "products", ["organization_id"])
    op.create_index("ix_products_category_id", "products", ["category_id"])
    op.create_index("ix_products_status", "products", ["status"])

    # ── Seed: document_types ────────────────────────────────────
    op.execute(sa.text("""
        INSERT INTO document_types (id, name, doc_type, upload_type, is_required, created_at, updated_at) VALUES
        (gen_random_uuid()::text, 'PAN Card', 'PAN_Card', 'Single', true, now(), now()),
        (gen_random_uuid()::text, 'GST', 'GST', 'Single', true, now(), now()),
        (gen_random_uuid()::text, 'Certificate of Incorporation', 'Certificate_of_Incorporation', 'Single', true, now(), now()),
        (gen_random_uuid()::text, 'Establishment Certificate', 'Establishment_Certificate', 'Single', true, now(), now()),
        (gen_random_uuid()::text, 'Trademark & Copyright Certificates', 'Trademark_Copyright_Certificates', 'Multiple', true, now(), now()),
        (gen_random_uuid()::text, 'Turnover Certificate', 'Turnover_Certificate', 'Single', true, now(), now()),
        (gen_random_uuid()::text, 'MSME Certificate', 'MSME_Certificate', 'Single', true, now(), now()),
        (gen_random_uuid()::text, 'Product Specifications', 'Product_Specifications', 'Multiple', true, now(), now()),
        (gen_random_uuid()::text, 'List of Products', 'List_of_Products', 'Multiple', true, now(), now()),
        (gen_random_uuid()::text, 'Product Images', 'Product_Images', 'Multiple', true, now(), now()),
        (gen_random_uuid()::text, 'Product Certificates', 'Product_Certificates', 'Multiple', true, now(), now()),
        (gen_random_uuid()::text, 'Product Approval Certificate', 'Product_Approval_Certificate', 'Single', true, now(), now()),
        (gen_random_uuid()::text, 'ISO Certificate', 'ISO_Certificate', 'Single', true, now(), now()),
        (gen_random_uuid()::text, 'List Of Plant & Machinery', 'List_Of_Plant_Machinery', 'Multiple', true, now(), now()),
        (gen_random_uuid()::text, 'Annual Production Capacity Documents', 'Annual_Production_Capacity', 'Multiple', true, now(), now()),
        (gen_random_uuid()::text, 'List Of Raw Material', 'List_Of_Raw_Material', 'Multiple', true, now(), now()),
        (gen_random_uuid()::text, 'Plant Images', 'Plant_Images', 'Multiple', true, now(), now()),
        (gen_random_uuid()::text, 'List of Service Centers', 'List_of_Service_Centers', 'Multiple', true, now(), now()),
        (gen_random_uuid()::text, 'TAN Number', 'TAN_Number', 'Single', false, now(), now()),
        (gen_random_uuid()::text, 'Company Profile (Detailed)', 'Company_Profile_Detailed', 'Multiple', true, now(), now()),
        (gen_random_uuid()::text, 'Product Catalogue', 'Product_Catalogue', 'Multiple', true, now(), now()),
        (gen_random_uuid()::text, 'Production Unit/Factory Address', 'Production_Unit_Factory_Address', 'Multiple', true, now(), now())
    """))

    # ── Seed: default organization ──────────────────────────────
    op.execute(sa.text("""
        INSERT INTO organizations (id, name, slug, is_active, email, created_at, updated_at)
        VALUES (gen_random_uuid()::text, 'Jigisha Enterprises', 'default', true, 'jigisha@gmail.com', now(), now())
    """))

    # ── Seed: company_profile ───────────────────────────────────
    op.execute(sa.text("""
        INSERT INTO company_profile (id, company_name, city, state, country, pincode, contact_number, email, office_address, created_at, updated_at)
        VALUES (gen_random_uuid()::text, 'Jigisha Enterprises', 'Ajmer', 'Rajasthan', 'India', '305001', '0000000000', 'jigisha@gmail.com', 'Demo Address', now(), now())
    """))

    # ── Seed: categories (from MySQL category_settings) ─────────
    op.execute(sa.text("""
        WITH org AS (SELECT id FROM organizations WHERE slug = 'default' LIMIT 1),
        parents AS (
            INSERT INTO categories (id, organization_id, parent_id, label, name, is_active, created_at, updated_at)
            SELECT gen_random_uuid()::text, org.id, NULL, 1, name, true, now(), now()
            FROM (VALUES ('Repairing Services'), ('MRO Services')) AS t(name), org
            RETURNING id, name
        )
        INSERT INTO categories (id, organization_id, parent_id, label, name, is_active, created_at, updated_at)
        SELECT gen_random_uuid()::text, (SELECT id FROM organizations WHERE slug='default'), p.id, 2, sub.name, true, now(), now()
        FROM (VALUES
            ('Mechanical Equipment Repair Services', 'Repairing Services'),
            ('Electrical Repair Services',           'Repairing Services'),
            ('IT & Computer Repair Services',        'Repairing Services'),
            ('Electronics & Appliance Repair',       'Repairing Services'),
            ('Home & Building Repair Services',      'Repairing Services'),
            ('Mechanical Maintenance Services',      'MRO Services'),
            ('Electrical Maintenance Services',      'MRO Services'),
            ('Instrumentation & Control Maintenance','MRO Services'),
            ('Civil & Structural Maintenance',       'MRO Services'),
            ('HVAC & Facility Maintenance',          'MRO Services')
        ) AS sub(name, parent_name)
        JOIN parents p ON p.name = sub.parent_name
    """))


def downgrade() -> None:
    op.drop_table("products")
    op.drop_table("service_providers")
    op.drop_table("vendor_documents")
    op.drop_table("vendor_profiles")
    op.drop_table("password_reset_tokens")
    op.drop_table("refresh_tokens")
    op.drop_table("categories")
    op.drop_table("users")
    op.drop_table("company_profile")
    op.drop_table("document_types")
    op.drop_table("token_blacklist")
    op.drop_table("organizations")
