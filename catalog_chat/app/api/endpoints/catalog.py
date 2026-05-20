from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.catalog import CatalogCreate, CatalogUpdate, CatalogResponse
from app.schemas.product import ProductResponse
from app.services import catalog_service, product_service

router = APIRouter()

@router.post("/", response_model=CatalogResponse)
def create_catalog(catalog: CatalogCreate, db: Session = Depends(get_db)):
    return catalog_service.create_catalog(db=db, catalog=catalog)

@router.get("/", response_model=List[CatalogResponse])
def read_catalogs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    catalogs = catalog_service.get_catalogs(db, skip=skip, limit=limit)
    return catalogs

@router.get("/{id}", response_model=CatalogResponse)
def read_catalog(id: int, db: Session = Depends(get_db)):
    db_catalog = catalog_service.get_catalog(db, catalog_id=id)
    if db_catalog is None:
        raise HTTPException(status_code=404, detail="Catalog not found")
    return db_catalog

@router.get("/{id}/products", response_model=List[ProductResponse])
def read_products_by_catalog(id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    db_catalog = catalog_service.get_catalog(db, catalog_id=id)
    if db_catalog is None:
        raise HTTPException(status_code=404, detail="Catalog not found")
    return product_service.get_products_by_catalog(db, catalog_id=id, skip=skip, limit=limit)

@router.put("/{id}", response_model=CatalogResponse)
def update_catalog(id: int, catalog_update: CatalogUpdate, db: Session = Depends(get_db)):
    db_catalog = catalog_service.get_catalog(db, catalog_id=id)
    if db_catalog is None:
        raise HTTPException(status_code=404, detail="Catalog not found")
    return catalog_service.update_catalog(db=db, db_catalog=db_catalog, catalog_update=catalog_update)

@router.delete("/{id}", response_model=CatalogResponse)
def delete_catalog(id: int, db: Session = Depends(get_db)):
    db_catalog = catalog_service.get_catalog(db, catalog_id=id)
    if db_catalog is None:
        raise HTTPException(status_code=404, detail="Catalog not found")
    return catalog_service.delete_catalog(db=db, db_catalog=db_catalog)
