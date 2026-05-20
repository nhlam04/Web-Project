from sqlalchemy import Column, Integer, String, Text
from app.db.database import Base

class Catalog(Base):
    __tablename__ = "catalog"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_type = Column(String(255), nullable=False)
    brand = Column(Text, nullable=False, default="")
    location = Column(Text, nullable=False, default="")