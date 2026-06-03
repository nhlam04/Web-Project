from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, SellerProductCreate, SellerProductUpdate
from app.services import product_service

router = APIRouter()

@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    return product_service.create_product(db=db, product=product)

@router.get("/", response_model=List[ProductResponse])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = product_service.get_products(db, skip=skip, limit=limit)
    return products

def require_seller_id(x_seller_id: str = Header(default="")):
    seller_id = (x_seller_id or "").strip()
    if not seller_id:
        raise HTTPException(status_code=401, detail="Missing x-seller-id header")
    return seller_id

@router.get("/seller", response_model=List[ProductResponse])
def read_seller_products(
    skip: int = 0,
    limit: int = 100,
    seller_id: str = Depends(require_seller_id),
    db: Session = Depends(get_db),
):
    return product_service.get_products_by_seller(db, seller_id=seller_id, skip=skip, limit=limit)

@router.post("/seller", response_model=ProductResponse, status_code=201)
def create_seller_product(
    product: SellerProductCreate,
    seller_id: str = Depends(require_seller_id),
    db: Session = Depends(get_db),
):
    return product_service.create_seller_product(db=db, product=product, seller_id=seller_id)

@router.put("/seller/{product_id}", response_model=ProductResponse)
def update_seller_product(
    product_id: int,
    product_update: SellerProductUpdate,
    seller_id: str = Depends(require_seller_id),
    db: Session = Depends(get_db),
):
    db_product = product_service.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if str(db_product.shopId) != seller_id:
        raise HTTPException(status_code=403, detail="Seller cannot update another seller product")
    return product_service.update_seller_product(db=db, db_product=db_product, product_update=product_update)

@router.get("/{product_id}", response_model=ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = product_service.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.get("/{product_id}/availability")
def read_product_availability(product_id: int, db: Session = Depends(get_db)):
    availability = product_service.get_availability(db, product_id=product_id)
    if availability is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return availability

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
    db_product = product_service.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_service.update_product(db=db, db_product=db_product, product_update=product_update)

@router.delete("/{product_id}", response_model=ProductResponse)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = product_service.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_service.delete_product(db=db, db_product=db_product)
