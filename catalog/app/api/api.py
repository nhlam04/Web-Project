from fastapi import APIRouter
from app.api.endpoints import users, products, catalog

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(catalog.router, prefix="/catalogs", tags=["catalogs"])
