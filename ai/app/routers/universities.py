"""Эндпоинты для вузов, отзывов, аналитики/рекомендаций и AI-обоснования."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import University, Specialty, Review, UserProfile
from app.services.recommendation_service import recommend_for_user
from app.services.llm_service import get_client, MODEL_NAME, GROQ_API_KEY

router = APIRouter(tags=["universities"])


@router.get("/universities")
def list_universities(
    city: str | None = None,
    type: str | None = None,
    db: Session = Depends(get_db)
):
    """Список всех вузов в базе. Можно фильтровать по городу и типу."""
    q = db.query(University)
    if city:
        q = q.filter(University.city == city)
    if type:
        q = q.filter(University.type == type)
    unis = q.all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "short_name": u.short_name,
            "type": u.type,
            "city": u.city,
            "website": u.website,
            "founded_year": u.founded_year,
            "student_count": u.student_count,
            "rating": u.rating,
            "specialties_count": len(u.specialties),
            "reviews_count": len(u.reviews),
            "parse_status": u.parse_status,
        }
        for u in unis
    ]


@router.get("/universities/{uni_id}")
def get_university(uni_id: int, db: Session = Depends(get_db)):
    """Детали вуза + все специальности + все отзывы."""
    u = db.query(University).filter_by(id=uni_id).first()
    if not u:
        raise HTTPException(404, "Вуз не найден")
    return {
        "id": u.id,
        "name": u.name,
        "short_name": u.short_name,
        "type": u.type,
        "city": u.city,
        "website": u.website,
        "description": u.description,
        "founded_year": u.founded_year,
        "student_count": u.student_count,
        "rating": u.rating,
        "parsed_at": u.parsed_at,
        "specialties": [
            {
                "id": s.id,
                "name": s.name,
                "faculty": s.faculty,
                "field": s.field,
                "passing_score": s.passing_score,
                "tuition_kgs": s.tuition_kgs,
                "budget_seats": s.budget_seats,
                "language_of_instruction": s.language_of_instruction,
            }
            for s in u.specialties
        ],
        "reviews": [
            {
                "id": r.id,
                "author": r.author,
                "rating": r.rating,
                "content": r.content,
                "pros": r.pros,
                "cons": r.cons,
                "sentiment": r.sentiment,
                "source": r.source,
                "created_at": r.created_at,
            }
            for r in u.reviews
        ],
    }


@router.get("/universities/{uni_id}/reviews")
def get_reviews(uni_id: int, db: Session = Depends(get_db)):
    """Только отзывы по конкретному вузу — для отдельной страницы на фронте."""
    u = db.query(University).filter_by(id=uni_id).first()
    if not u:
        raise HTTPException(404, "Вуз не найден")
    return {
        "university_id": uni_id,
        "university_name": u.name,
        "average_rating": u.rating,
        "total_reviews": len(u.reviews),
        "reviews": [
            {
                "id": r.id,
                "author": r.author,
                "rating": r.rating,
                "content": r.content,
                "pros": r.pros,
                "cons": r.cons,
                "sentiment": r.sentiment,
                "source": r.source,
            }
            for r in u.reviews
        ],
    }


@router.get("/recommendations/{user_id}")
def get_recommendations(user_id: int, top_n: int = 10, db: Session = Depends(get_db)):
    """Главная фича: топ специальностей с шансом поступления."""
    results = recommend_for_user(db, user_id, top_n=top_n)
    if not results:
        raise HTTPException(400, "Сначала заполни анкету: PUT /users/{user_id}/profile")
    return {"user_id": user_id, "recommendations": results}


@router.get("/recommendations/{user_id}/{specialty_id}/argument")
def argument_recommendation(user_id: int, specialty_id: int, db: Session = Depends(get_db)):
    """🔥 KILLER FEATURE: AI обосновывает рекомендацию используя ОТЗЫВЫ студентов.

    Возвращает развёрнутое объяснение почему этот вуз подходит,
    цитируя реальных студентов (или сгенерированные отзывы).
    """
    profile = db.query(UserProfile).filter_by(user_id=user_id).first()
    if not profile:
        raise HTTPException(400, "Сначала заполни анкету")

    sp = db.query(Specialty).filter_by(id=specialty_id).first()
    if not sp:
        raise HTTPException(404, "Специальность не найдена")

    uni = sp.university

    if not GROQ_API_KEY:
        return {
            "argument": "Для этого нужен GROQ_API_KEY. Это базовое описание вуза.",
            "specialty": sp.name,
            "university": uni.name,
        }

    # Собираем отзывы для контекста
    reviews_text = ""
    if uni.reviews:
        reviews_text = "\n".join([
            f"- [{r.rating}/5] {r.content}" + (f" Плюсы: {r.pros}." if r.pros else "")
                                            + (f" Минусы: {r.cons}." if r.cons else "")
            for r in uni.reviews[:6]
        ])
    else:
        reviews_text = "(нет отзывов в базе)"

    profile_text = (
        f"ОРТ: {profile.ort_score}, аттестат: {profile.gpa}, "
        f"бюджет: {profile.budget_kgs} сом, направление: {profile.target_field}, "
        f"интересы: {profile.interests}, языки: {profile.languages}"
    )

    prompt = f"""Ты — AI-консультант абитуриентов. Объясни студенту, подходит ли ему вот эта специальность в этом вузе. Используй отзывы реальных студентов как аргументы.

ПРОФИЛЬ СТУДЕНТА:
{profile_text}

СПЕЦИАЛЬНОСТЬ: {sp.name}
ФАКУЛЬТЕТ: {sp.faculty}
НАПРАВЛЕНИЕ: {sp.field}
ПРОХОДНОЙ БАЛЛ: {sp.passing_score}
СТОИМОСТЬ: {sp.tuition_kgs} сом/год
БЮДЖЕТНЫХ МЕСТ: {sp.budget_seats}
ЯЗЫК ОБУЧЕНИЯ: {sp.language_of_instruction}

ВУЗ: {uni.name} ({uni.city})
ОПИСАНИЕ: {uni.description}
СРЕДНИЙ РЕЙТИНГ: {uni.rating}/5

ОТЗЫВЫ СТУДЕНТОВ:
{reviews_text}

Дай ответ в формате:
1. ✅ Почему подходит (2-3 пункта с упоминанием отзывов)
2. ⚠️ На что обратить внимание (1-2 риска по отзывам)
3. 💡 Совет (1 предложение)

Будь конкретным, цитируй отзывы кратко. Пиши на русском, дружелюбно, на «ты»."""

    try:
        client = get_client()
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.7,
        )
        argument = response.choices[0].message.content
    except Exception as e:
        argument = f"Не удалось получить обоснование: {type(e).__name__}"

    return {
        "user_id": user_id,
        "specialty_id": specialty_id,
        "specialty_name": sp.name,
        "university_name": uni.name,
        "argument": argument,
        "based_on_reviews_count": len(uni.reviews),
    }


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Статистика по базе — для дашборда на фронте."""
    total_unis = db.query(University).count()
    total_specs = db.query(Specialty).count()
    total_reviews = db.query(Review).count()

    # По городам
    cities = {}
    for u in db.query(University).all():
        if u.city:
            cities[u.city] = cities.get(u.city, 0) + 1

    # По типам
    types_count = {}
    for u in db.query(University).all():
        if u.type:
            types_count[u.type] = types_count.get(u.type, 0) + 1

    # По полям специальностей
    fields = {}
    for s in db.query(Specialty).all():
        if s.field:
            fields[s.field] = fields.get(s.field, 0) + 1

    return {
        "total_universities": total_unis,
        "total_specialties": total_specs,
        "total_reviews": total_reviews,
        "by_city": cities,
        "by_type": types_count,
        "by_field": fields,
    }
