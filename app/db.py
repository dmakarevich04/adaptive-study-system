from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

db_name = os.getenv('POSTGRES_DB') or os.getenv('POSTGRES_DB_NAME') or 'tests'
#DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER','postgres')}:{os.getenv('POSTGRES_PASSWORD','1234')}@{os.getenv('POSTGRES_HOST','db')}:{os.getenv('POSTGRES_PORT','5432')}/{db_name}"
DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER','postgres')}:{os.getenv('POSTGRES_PASSWORD','1234')}@{os.getenv('POSTGRES_HOST','localhost')}:{os.getenv('POSTGRES_PORT','5432')}/{db_name}"
engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
