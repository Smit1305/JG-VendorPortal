from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str
    label: int          # 0=master, 1=category, 2=subcategory, 3=product
    parent_id: str | None = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    organization_id: str = ""  # set by route handler from admin session


class CategoryUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None
    parent_id: str | None = None


class CategoryOut(CategoryBase):
    id: str
    organization_id: str

    model_config = {"from_attributes": True}


class CategoryTreeNode(CategoryOut):
    """Recursive tree structure for the category hierarchy endpoint."""
    children: list["CategoryTreeNode"] = []

    model_config = {"from_attributes": True}


# Required for recursive model
CategoryTreeNode.model_rebuild()
