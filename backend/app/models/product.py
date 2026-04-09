from sqlalchemy import Enum, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, new_uuid


ProductStatus = Enum("active", "inactive", "draft", name="product_status_enum")
SkuType = Enum("single", "multi", name="sku_type_enum")


class Product(Base, TimestampMixin):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_vendor_id", "vendor_id"),
        Index("ix_products_org_id", "organization_id"),
        Index("ix_products_category_id", "category_id"),
        Index("ix_products_status", "status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    vendor_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    category_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    regular_price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    sale_price: Mapped[float | None] = mapped_column(Numeric(12, 2))
    description: Mapped[str | None] = mapped_column(Text)
    height: Mapped[float | None] = mapped_column(Numeric(8, 2))
    width: Mapped[float | None] = mapped_column(Numeric(8, 2))
    weight: Mapped[float | None] = mapped_column(Numeric(8, 2))
    thumbnail_image: Mapped[str | None] = mapped_column(String(500))
    gallery_images: Mapped[list | None] = mapped_column(JSONB)  # [path, ...]
    attributes: Mapped[dict | None] = mapped_column(JSONB)       # {key: value}
    sku_type: Mapped[str] = mapped_column(String(10), default="single")
    status: Mapped[str] = mapped_column(String(10), default="draft")

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="products")
    vendor: Mapped["User"] = relationship("User", back_populates="products")
    category: Mapped["Category | None"] = relationship("Category", back_populates="products")

    @property
    def category_name(self) -> str | None:
        return self.category.name if self.category else None
