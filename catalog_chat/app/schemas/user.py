from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    username: str
    fullName: str
    gmail: str
    address: str
    phone: str
    accountType: str
    avatar: str
    roleId: int
    totalPrice: int = 0

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    fullName: Optional[str] = None
    gmail: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    accountType: Optional[str] = None
    avatar: Optional[str] = None
    roleId: Optional[int] = None
    totalPrice: Optional[int] = None

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True
