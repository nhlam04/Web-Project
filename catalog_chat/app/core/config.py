import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Catalog API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/qlbanhang")
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "web-project")
settings = Settings()
