"""Модели БД. Все таблицы проекта.

ВЕРСИЯ 2: добавлены отзывы (Review) и метаданные парсинга.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    messages = relationship("Message", back_populates="user")


class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    ort_score = Column(Integer)
    gpa = Column(Float)
    budget_kgs = Column(Integer)
    city = Column(String(100))
    target_field = Column(String(200))
    interests = Column(JSON)
    languages = Column(JSON)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class University(Base):
    __tablename__ = "universities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False, index=True)
    short_name = Column(String(50))
    type = Column(String(50))
    city = Column(String(100))
    website = Column(String(300))
    description = Column(Text)
    founded_year = Column(Integer)               
    student_count = Column(Integer)              
    rating = Column(Float)                       
    parsed_at = Column(DateTime)                 
    parse_status = Column(String(30))            

    specialties = relationship("Specialty", back_populates="university", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="university", cascade="all, delete-orphan")


class Specialty(Base):
    __tablename__ = "specialties"
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=False)

    name = Column(String(300), nullable=False)
    faculty = Column(String(300))
    field = Column(String(100), index=True)
    passing_score = Column(Integer)
    tuition_kgs = Column(Integer)
    budget_seats = Column(Integer, default=0)
    duration_years = Column(Integer, default=4)
    language_of_instruction = Column(String(100))  

    university = relationship("University", back_populates="specialties")


class Review(Base):
    """Отзыв студента о вузе. Парсится с сайтов или загружается вручную."""
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=False, index=True)

    author = Column(String(200))                   
    rating = Column(Float)                         
    content = Column(Text, nullable=False)         
    pros = Column(Text)                            
    cons = Column(Text)                            
    sentiment = Column(String(20))                 
    source = Column(String(300))                   
    posted_at = Column(DateTime)                   
    created_at = Column(DateTime, default=datetime.utcnow)

    university = relationship("University", back_populates="reviews")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="messages")


class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    specialty_id = Column(Integer, ForeignKey("specialties.id"), nullable=False)
    chance_percent = Column(Float, nullable=False)
    reasoning = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class ParseLog(Base):
    """Лог попыток парсинга — для отладки и отчёта."""
    __tablename__ = "parse_logs"
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(500), nullable=False)
    status = Column(String(30))                   
    error = Column(Text)
    specialties_found = Column(Integer, default=0)
    reviews_found = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
