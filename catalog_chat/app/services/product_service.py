from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Product).offset(skip).limit(limit).all()

def get_products_by_catalog(db: Session, catalog_id: int, skip: int = 0, limit: int = 100):
    return db.query(Product).filter(Product.catalog_id == catalog_id).offset(skip).limit(limit).all()

def create_product(db: Session, product: ProductCreate):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, db_product: Product, product_update: ProductUpdate):
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, db_product: Product):
    db.delete(db_product)
    db.commit()
    return db_product

def get_availability(db: Session, product_id: int):
    product = get_product(db, product_id)
    if not product:
        return None
    return {
        "productId": str(product.id),
        "sellerId": str(product.shopId),
        "name": product.name,
        "price": product.price,
        "quantity": product.quantity,
        "available": product.quantity > 0,
    }

def apply_order_placed(db: Session, event_id: str, items):
    if _is_processed(db, event_id):
        return
    for item in items:
        product_id = int(item["productId"])
        quantity = int(item["quantity"])
        product = get_product(db, product_id)
        if product:
            product.quantity = max(0, int(product.quantity) - quantity)
    _mark_processed(db, event_id)
    db.commit()

def apply_order_completed(db: Session, event_id: str, items):
    if _is_processed(db, event_id):
        return
    for item in items:
        product_id = int(item["productId"])
        quantity = int(item["quantity"])
        product = get_product(db, product_id)
        if product:
            product.sold = int(product.sold or 0) + quantity
    _mark_processed(db, event_id)
    db.commit()

def apply_order_cancelled(db: Session, event_id: str, items):
    if _is_processed(db, event_id):
        return
    for item in items:
        product_id = int(item["productId"])
        quantity = int(item["quantity"])
        product = get_product(db, product_id)
        if product:
            product.quantity = int(product.quantity or 0) + quantity
    _mark_processed(db, event_id)
    db.commit()

def apply_review_created(db: Session, event_id: str, payload):
    if _is_processed(db, event_id):
        return

    product_id = int(payload["productId"])
    rating = int(payload["rating"])
    comment = (payload.get("comment") or "").strip()
    product = get_product(db, product_id)
    if product:
        current_rates = int(product.totalRates or 0)
        current_average = int(product.StarCount or 0)
        next_rates = current_rates + 1
        next_average = round(((current_average * current_rates) + rating) / next_rates)

        product.totalRates = next_rates
        product.StarCount = max(1, min(5, next_average))
        product.ranking = product.StarCount
        if comment:
            product.totalComments = int(product.totalComments or 0) + 1

    _mark_processed(db, event_id)
    db.commit()

def ensure_projection_table(db: Session):
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS catalog_processed_events (
            event_id VARCHAR(100) PRIMARY KEY,
            processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    db.commit()

def _is_processed(db: Session, event_id: str):
    ensure_projection_table(db)
    result = db.execute(
        text("SELECT event_id FROM catalog_processed_events WHERE event_id = :event_id"),
        {"event_id": event_id},
    )
    return result.first() is not None

def _mark_processed(db: Session, event_id: str):
    db.execute(
        text("INSERT IGNORE INTO catalog_processed_events (event_id) VALUES (:event_id)"),
        {"event_id": event_id},
    )
