from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    fullName = Column(String(255), nullable=False)
    gmail = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    phone = Column(String(255), nullable=False)
    accountType = Column(String(255), nullable=False)
    avatar = Column(String(1000), nullable=False)
    roleId = Column(Integer, ForeignKey("roles.id"), nullable=False)
    totalPrice = Column(Integer, nullable=False, default=0)

    role = relationship("Role", back_populates="users")
    products = relationship("Product", back_populates="shop")
