from sqlalchemy.orm import Session
from app.models.catalog import Catalog
from app.schemas.catalog import CatalogCreate, CatalogUpdate

def get_catalogs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Catalog).offset(skip).limit(limit).all()

def get_catalog(db: Session, catalog_id: int):
    return db.query(Catalog).filter(Catalog.id == catalog_id).first()

def create_catalog(db: Session, catalog: CatalogCreate):
    db_catalog = Catalog(**catalog.model_dump())
    db.add(db_catalog)
    db.commit()
    db.refresh(db_catalog)
    return db_catalog

def update_catalog(db: Session, db_catalog: Catalog, catalog_update: CatalogUpdate):
    update_data = catalog_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_catalog, key, value)
    db.commit()
    db.refresh(db_catalog)
    return db_catalog

def delete_catalog(db: Session, db_catalog: Catalog):
    db.delete(db_catalog)
    db.commit()
    return db_catalog
