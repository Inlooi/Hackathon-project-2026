"""Pydantic-схемы для валидации запросов и ответов API."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# ---------- User ----------
class UserCreate(BaseModel):
    name: str
    email: EmailStr


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Profile ----------
class ProfileIn(BaseModel):
    ort_score: Optional[int] = None
    gpa: Optional[float] = None
    budget_kgs: Optional[int] = None
    city: Optional[str] = None
    target_field: Optional[str] = None
    interests: Optional[list[str]] = None
    languages: Optional[list[str]] = None


class ProfileOut(ProfileIn):
    user_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------- Chat ----------
class ChatMessageIn(BaseModel):
    user_id: int
    message: str


class ChatMessageOut(BaseModel):
    reply: str
    message_id: int


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Recommendations ----------
class RecommendationOut(BaseModel):
    specialty_id: int
    specialty_name: str
    university_name: str
    field: str
    chance_percent: float
    passing_score: Optional[int]
    tuition_kgs: Optional[int]
    budget_seats: int
    reasoning: str
