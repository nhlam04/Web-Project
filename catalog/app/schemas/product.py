from pydantic import BaseModel
from typing import Optional, Any

class ProductBase(BaseModel):
    name: str
    price: int
    shortDesc: str
    detailDesc: Any  # JSON field
    quantity: int
    sold: int = 0
    shopId: int
    images: Any  # JSON field
    ranking: int = 0
    totalComments: int = 0
    StarCount: int = 0
    totalRates: int = 0
    catalog_id: int

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    shortDesc: Optional[str] = None
    detailDesc: Optional[Any] = None
    quantity: Optional[int] = None
    sold: Optional[int] = None
    shopId: Optional[int] = None
    images: Optional[Any] = None
    ranking: Optional[int] = None
    totalComments: Optional[int] = None
    StarCount: Optional[int] = None
    totalRates: Optional[int] = None
    catalog_id: Optional[int] = None

class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True
