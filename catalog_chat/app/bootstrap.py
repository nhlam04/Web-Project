import os
from sqlalchemy.orm import Session

from app.db.database import Base, engine
from app.models.catalog import Catalog
from app.models.product import Product
from app.seeds.catalog_seed import make_catalogs, make_products
from app.services.product_service import ensure_projection_table


def init_catalog_database():
    Base.metadata.create_all(bind=engine)
    db = Session(bind=engine)
    try:
        ensure_projection_table(db)
        seed_seller_id = os.getenv("CATALOG_SEED_SELLER_ID", "00000000-0000-0000-0000-000000000000")
        seed_catalogs = make_catalogs()
        for seed_catalog in seed_catalogs:
            existing_catalog = db.query(Catalog).filter(Catalog.id == seed_catalog.id).first()
            if existing_catalog:
                existing_catalog.product_type = seed_catalog.product_type
                existing_catalog.brand = seed_catalog.brand
                existing_catalog.location = seed_catalog.location
            else:
                db.add(seed_catalog)
        db.flush()

        force_seed = os.getenv("CATALOG_FORCE_SEED", "false").lower() in {"1", "true", "yes"}
        if force_seed or db.query(Product).count() == 0:
            if force_seed:
                db.query(Product).delete(synchronize_session=False)
                db.flush()
            else:
                for product in make_products(seed_seller_id):
                    existing_product = db.query(Product).filter(Product.id == product.id).first()
                    if existing_product:
                        existing_product.name = product.name
                        existing_product.price = product.price
                        existing_product.shortDesc = product.shortDesc
                        existing_product.detailDesc = product.detailDesc
                        existing_product.quantity = product.quantity
                        existing_product.sold = product.sold
                        existing_product.shopId = product.shopId
                        existing_product.images = product.images
                        existing_product.ranking = product.ranking
                        existing_product.totalComments = product.totalComments
                        existing_product.StarCount = product.StarCount
                        existing_product.totalRates = product.totalRates
                        existing_product.catalog_id = product.catalog_id
                    else:
                        db.add(product)
                db.commit()
                return
            db.add_all(make_products(seed_seller_id))
        db.commit()
    finally:
        db.close()
