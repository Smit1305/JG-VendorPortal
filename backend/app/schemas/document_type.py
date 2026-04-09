from datetime import datetime
from pydantic import BaseModel


class DocumentTypeBase(BaseModel):
    name: str
    doc_type: str
    upload_type: str = "Single"   # Single | Multiple
    is_required: bool = False


class DocumentTypeCreate(DocumentTypeBase):
    pass


class DocumentTypeUpdate(BaseModel):
    name: str | None = None
    upload_type: str | None = None
    is_required: bool | None = None


class DocumentTypeOut(DocumentTypeBase):
    id: str
    created_at: datetime

    model_config = {"from_attributes": True}
