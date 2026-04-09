from datetime import datetime
from pydantic import BaseModel, field_validator


class ProductBase(BaseModel):
    name: str
    category_id: str | None = None
    regular_price: float | None = None
    sale_price: float | None = None
    description: str | None = None
    height: float | None = None
    width: float | None = None
    weight: float | None = None
    sku_type: str = "single"
    attributes: dict | None = None

    @field_validator("sku_type")
    @classmethod
    def validate_sku_type(cls, v: str) -> str:
        if v not in ("single", "multi"):
            raise ValueError("sku_type must be 'single' or 'multi'")
        return v

    @field_validator("sale_price")
    @classmethod
    def sale_not_gt_regular(cls, v: float | None, info) -> float | None:
        regular = info.data.get("regular_price")
        if v is not None and regular is not None and v > regular:
            raise ValueError("sale_price cannot exceed regular_price")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    category_id: str | None = None
    regular_price: float | None = None
    sale_price: float | None = None
    description: str | None = None
    height: float | None = None
    width: float | None = None
    weight: float | None = None
    attributes: dict | None = None
    status: str | None = None


class ProductOut(BaseModel):
    id: str
    vendor_id: str
    organization_id: str
    name: str
    category_id: str | None = None
    category_name: str | None = None
    regular_price: float | None = None
    sale_price: float | None = None
    description: str | None = None
    height: float | None = None
    width: float | None = None
    weight: float | None = None
    sku_type: str = "single"
    attributes: dict | None = None
    thumbnail_image: str | None = None
    gallery_images: list[str] | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    """Lightweight list item — no heavy fields."""
    id: str
    name: str
    category_id: str | None
    category_name: str | None = None
    regular_price: float | None
    sale_price: float | None
    thumbnail_image: str | None
    sku_type: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductImportRow(BaseModel):
    """Schema for a single row from Excel bulk import."""
    name: str
    category: str | None = None
    regular_price: float | None = None
    sale_price: float | None = None
    description: str | None = None
    sku_type: str = "single"
