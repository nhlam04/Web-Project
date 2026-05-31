import os
from sqlalchemy.orm import Session

from app.db.database import Base, engine
from app.models.catalog import Catalog
from app.models.product import Product
from app.services.product_service import ensure_projection_table


def init_catalog_database():
    Base.metadata.create_all(bind=engine)
    db = Session(bind=engine)
    try:
        ensure_projection_table(db)
        seed_seller_id = os.getenv("CATALOG_SEED_SELLER_ID", "00000000-0000-0000-0000-000000000000")
        if db.query(Catalog).count() == 0:
            db.add_all(
                [
                    Catalog(id=1, product_type="Electronics", brand="", location=""),
                    Catalog(id=2, product_type="Fashion", brand="", location=""),
                ]
            )
        if db.query(Product).count() == 0:
            db.add_all(
                [
                    Product(
                        id=1,
                        name="Tai nghe Chong on Pro",
                        price=2490000,
                        shortDesc="Demo headphones",
                        detailDesc={"description": "Noise cancelling headphones"},
                        quantity=20,
                        sold=0,
                        shopId=seed_seller_id,
                        images=["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80"],
                        ranking=0,
                        totalComments=0,
                        StarCount=0,
                        totalRates=0,
                        catalog_id=1,
                    ),
                    Product(
                        id=2,
                        name="Dong ho The thao",
                        price=3150000,
                        shortDesc="Demo watch",
                        detailDesc={"description": "Sport watch"},
                        quantity=15,
                        sold=0,
                        shopId=seed_seller_id,
                        images=["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"],
                        ranking=0,
                        totalComments=0,
                        StarCount=0,
                        totalRates=0,
                        catalog_id=2,
                    ),
                ]
            )
        db.commit()
    finally:
        db.close()
