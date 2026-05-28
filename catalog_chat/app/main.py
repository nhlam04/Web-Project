from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api import api_router
from app.core.config import settings

from app.db.database import engine, Base
from app.models import user, product, catalog, chat
from app.bootstrap import init_catalog_database
from app.rabbitmq_consumer import start_catalog_consumer

init_catalog_database()
start_catalog_consumer()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/v1/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
