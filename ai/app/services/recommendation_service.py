"""Сервис рекомендаций. Берёт профиль юзера и считает шанс по всем специальностям."""
from sqlalchemy.orm import Session
from app.models.models import Specialty, University, UserProfile, Recommendation
from app.services.chance_calculator import calculate_admission_chance


def recommend_for_user(db: Session, user_id: int, top_n: int = 10) -> list[dict]:
    """Возвращает топ-N специальностей с лучшим шансом для юзера."""
    profile = db.query(UserProfile).filter_by(user_id=user_id).first()
    if not profile:
        return []

    specialties = db.query(Specialty).join(University).all()

    results = []
    for sp in specialties:
        chance, reasoning = calculate_admission_chance(
            ort_score=profile.ort_score,
            gpa=profile.gpa,
            budget_kgs=profile.budget_kgs,
            target_field=profile.target_field,
            passing_score=sp.passing_score,
            tuition_kgs=sp.tuition_kgs,
            budget_seats=sp.budget_seats or 0,
            specialty_field=sp.field,
        )
        results.append({
            "specialty_id": sp.id,
            "specialty_name": sp.name,
            "university_name": sp.university.name,
            "field": sp.field or "—",
            "chance_percent": chance,
            "passing_score": sp.passing_score,
            "tuition_kgs": sp.tuition_kgs,
            "budget_seats": sp.budget_seats or 0,
            "reasoning": reasoning,
        })

    results.sort(key=lambda r: r["chance_percent"], reverse=True)
    top = results[:top_n]

    # Сохраняем последние рекомендации в БД (для истории)
    db.query(Recommendation).filter_by(user_id=user_id).delete()
    for r in top:
        db.add(Recommendation(
            user_id=user_id,
            specialty_id=r["specialty_id"],
            chance_percent=r["chance_percent"],
            reasoning=r["reasoning"],
        ))
    db.commit()
    return top
