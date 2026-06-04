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
                    Catalog(id=1, product_type="Thiết bị Điện tử & Công nghệ", brand="{'Asus', 'Dell', 'HP', 'Lenovo', 'Apple', 'Acer', 'MSI'}", location="{'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'}"),
                    Catalog(id=2, product_type="Thời trang & Phụ kiện", brand="", location=""),
                    Catalog(id=3, product_type="Nhà cửa & Đời sống", brand="", location=""),
                    Catalog(id=4, product_type="Sức khỏe & Sắc đẹp", brand="", location=""),
                    Catalog(id=5, product_type="Mẹ & Bé", brand="", location=""),
                    Catalog(id=6, product_type="Thể thao & Dã ngoại", brand="", location=""),
                    Catalog(id=7, product_type="Sách, VPP & Quà tặng", brand="", location=""),
                    Catalog(id=8, product_type="Bách hóa Online", brand="", location=""),
                ]
            )
        if db.query(Product).count() == 0:
            db.add_all(
                [
                    Product(
                        id=5,
                        name="Asus ExpertBook BM1",
                        price=12390000,
                        shortDesc="BM1403CDA-S60974W",
                        detailDesc={"CPU": "AMD Ryzen™ 5 7535HS", "GPU": "AMD Radeon™ 660M", "RAM": "16GB DDR5 SO-DIMM", "memory": "4.0-inch, FHD (1920 x 1080) 16:9", "OS": "Windows 11", "screen": "512GB M.2 2280 NVMe™ PCIe® 4.0 SSD", "factory": "Asus"},
                        quantity=100,
                        sold=0,
                        shopId=seed_seller_id,
                        images=["https://surfaceviet.vn/wp-content/uploads/2024/03/Surface-Laptop-6-Platinum.png"],
                        ranking=1,
                        totalComments=10,
                        StarCount=4,
                        totalRates=100,
                        catalog_id=1,
                    ),
                    Product(
                        id=7,
                        name="Asus",
                        price=100,
                        shortDesc="",
                        detailDesc={},
                        quantity=100,
                        sold=1,
                        shopId=seed_seller_id,
                        images=["https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_744_1_29.png"],
                        ranking=0,
                        totalComments=0,
                        StarCount=0,
                        totalRates=0,
                        catalog_id=1,
                    ),
                    Product(
                        id=8,
                        name="Asus",
                        price=100,
                        shortDesc="",
                        detailDesc={},
                        quantity=100,
                        sold=1,
                        shopId=seed_seller_id,
                        images=["https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/44/311178/asus-vivobook-go-15-e1504fa-r5-nj776w-140225-100949-251-600x600.jpg"],
                        ranking=0,
                        totalComments=0,
                        StarCount=0,
                        totalRates=0,
                        catalog_id=2,
                    ),
                    Product(
                        id=9,
                        name="Asus",
                        price=100,
                        shortDesc="",
                        detailDesc={},
                        quantity=100,
                        sold=1,
                        shopId=seed_seller_id,
                        images=["https://cdn2.fptshop.com.vn/unsafe/HP_15_fd0305_TU_vang_1_525c47b289.jpg"],
                        ranking=0,
                        totalComments=0,
                        StarCount=0,
                        totalRates=0,
                        catalog_id=3,
                    ),
                    Product(
                        id=10,
                        name="Asus",
                        price=100,
                        shortDesc="",
                        detailDesc={},
                        quantity=100,
                        sold=1,
                        shopId=seed_seller_id,
                        images=[],
                        ranking=0,
                        totalComments=0,
                        StarCount=0,
                        totalRates=0,
                        catalog_id=4,
                    ),
                    Product(
                        id=11,
                        name="Asus",
                        price=100,
                        shortDesc="",
                        detailDesc={},
                        quantity=100,
                        sold=1,
                        shopId=seed_seller_id,
                        images=[],
                        ranking=0,
                        totalComments=0,
                        StarCount=0,
                        totalRates=0,
                        catalog_id=5,
                    ),
                    Product(
                        id=12,
                        name="Asus",
                        price=100,
                        shortDesc="",
                        detailDesc={},
                        quantity=100,
                        sold=1,
                        shopId=seed_seller_id,
                        images=[],
                        ranking=0,
                        totalComments=0,
                        StarCount=0,
                        totalRates=0,
                        catalog_id=6,
                    ),
                    Product(
                        id=13,
                        name="2",
                        price=1,
                        shortDesc="1",
                        detailDesc={"CPU": "1", "GPU": "1", "RAM": "1", "memory": "1", "OS": "1", "screen": "1", "factory": "1"},
                        quantity=0,
                        sold=1,
                        shopId=seed_seller_id,
                        images=["https://laptop88.vn/media/product/9440__new_100___laptop_msi_modern_15_f13mg_082vn.jpg", "https://laptop88.vn/media/product/8242_a2.jpg", "https://laptop88.vn/media/product/9440_20597_msi_modern_15_f13mg__5.jpg"],
                        ranking=0,
                        totalComments=0,
                        StarCount=0,
                        totalRates=0,
                        catalog_id=7,
                    ),
                    Product(
                        id=14,
                        name="2",
                        price=2,
                        shortDesc="2",
                        detailDesc={"CPU": "2", "GPU": "2", "RAM": "2", "memory": "2", "OS": "2", "screen": "2", "factory": "2"},
                        quantity=2,
                        sold=0,
                        shopId=seed_seller_id,
                        images=["", "", ""],
                        ranking=0,
                        totalComments=0,
                        StarCount=0,
                        totalRates=0,
                        catalog_id=8,
                    ),
                ]
            )
        db.commit()
    finally:
        db.close()
