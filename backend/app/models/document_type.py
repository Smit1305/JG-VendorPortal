from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, new_uuid


class DocumentType(Base, TimestampMixin):
    """Master list of document types (was 'masters' table)."""
    __tablename__ = "document_types"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    # Single = one file per doc type; Multiple = many files allowed
    upload_type: Mapped[str] = mapped_column(String(10), nullable=False, default="Single")
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
