from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    price = Column(Integer, nullable=False)
    shortDesc = Column(String(255), nullable=False)
    detailDesc = Column(JSON, nullable=False)
    quantity = Column(Integer, nullable=False)
    sold = Column(Integer, nullable=False, default=0)
    shopId = Column(Integer, ForeignKey("users.id"), nullable=False)
    images = Column(JSON, nullable=False)
    ranking = Column(Integer, nullable=False, default=0)
    totalComments = Column(Integer, nullable=False, default=0)
    StarCount = Column(Integer, nullable=False, default=0)
    totalRates = Column(Integer, nullable=False, default=0)
    catalog_id = Column(Integer, ForeignKey("catalog.id"), nullable=False)

    shop = relationship("User", back_populates="products")
    catalog = relationship("Catalog")
