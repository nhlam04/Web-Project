from pydantic import BaseModel
from typing import Optional

class CatalogBase(BaseModel):
    product_type: str

class CatalogCreate(CatalogBase):
    pass

class CatalogUpdate(BaseModel):
    product_type: Optional[str] = None

class CatalogResponse(CatalogBase):
    id: int
    brand: str
    location: str

    class Config:
        from_attributes = True
