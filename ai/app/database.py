import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/univer.db")
engine_args = {"connect_args": {"check_same_thread": False}} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency для FastAPI — даёт сессию БД и закрывает после запроса."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Создаёт все таблицы. Вызвать один раз при запуске."""
    from app.models import models  
    Base.metadata.create_all(bind=engine)
