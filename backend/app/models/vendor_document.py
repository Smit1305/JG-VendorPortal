from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


class VendorDocument(Base, TimestampMixin):
    """
    Critical scalar fields are columns for queryability.
    Flexible / variable document types stay in JSONB.
    """
    __tablename__ = "vendor_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # ── Frequently queried scalar fields ─────────────────────
    number_of_employees: Mapped[int | None] = mapped_column(Integer)
    epfo_register_number: Mapped[str | None] = mapped_column(String(50))
    epfo_file: Mapped[str | None] = mapped_column(Text)
    registered_address: Mapped[str | None] = mapped_column(Text)
    head_office_address: Mapped[str | None] = mapped_column(Text)

    # ── Flexible JSONB fields ─────────────────────────────────
    # Format: { "gst": {"number": "...", "file": "path"}, "pan": {...}, ... }
    documents: Mapped[dict | None] = mapped_column(JSONB)

    # Format: [{"name": "...", "phone": "...", "email": "...", "designation": "..."}]
    contact_persons: Mapped[list | None] = mapped_column(JSONB)

    # Format: [{"address": "...", "city": "...", "state": "..."}]
    factory_addresses: Mapped[list | None] = mapped_column(JSONB)

    # Format: ["path/to/file1", "path/to/file2"]
    brand_office_files: Mapped[list | None] = mapped_column(JSONB)

    # Format: [{"category_id": "...", "subcategory_id": "..."}]
    product_categories: Mapped[list | None] = mapped_column(JSONB)

    user: Mapped["User"] = relationship("User", back_populates="vendor_document")
