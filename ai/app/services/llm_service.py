"""Чат-сервис: Groq API + память в SQLite.

ПОЧЕМУ GROQ ВМЕСТО GEMINI:
- 14,400 запросов/день бесплатно (у Gemini было 20)
- Очень быстрый — ответы за 1-2 секунды вместо 30
- OpenAI-совместимый API
- Карта не нужна

КАК РАБОТАЕТ ПАМЯТЬ:
1. При каждом сообщении достаём профиль юзера + последние 20 сообщений из БД
2. Формируем системный промпт с профилем + данными вузов
3. Передаём всю историю в Groq (он сам ничего не запоминает между запросами)
4. Сохраняем новое сообщение юзера и ответ бота в БД
5. В следующем запросе история подтянется автоматически
"""
import os
from groq import Groq
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.models.models import Message, UserProfile, University

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
_client: Groq | None = None
if GROQ_API_KEY:
    _client = Groq(api_key=GROQ_API_KEY)


def get_client() -> Groq | None:
    return _client


MODEL_NAME = "llama-3.3-70b-versatile"
PARSER_MODEL = "llama-3.1-8b-instant"

HISTORY_LIMIT = 20                  
MAX_TOKENS_CHAT = 1024
MAX_TOKENS_PARSER = 4096


SYSTEM_PROMPT_TEMPLATE = """Ты — дружелюбный AI-консультант по поступлению в вузы Кыргызстана. Помогаешь выпускнику школы выбрать университет и специальность.

ПРАВИЛА ОБЩЕНИЯ:
- Общайся на "ты", простым языком — твой собеседник 17-летний выпускник
- Отвечай на том языке, на котором пишет пользователь (русский, кыргызский или английский)
- Опирайся ТОЛЬКО на данные о вузах ниже. Не выдумывай факты
- Если данных не хватает — честно скажи "уточни на официальном сайте вуза"
- Учитывай профиль студента и историю разговора — это важно
- Задавай уточняющие вопросы если анкета пустая
- Будь кратким: 2-4 предложения в обычном ответе. Не вываливай весь список вузов разом

ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ:
{profile}

ДАННЫЕ О ВУЗАХ КЫРГЫЗСТАНА (используй их, чтобы давать конкретные рекомендации):
{universities}
"""


def _build_profile_text(profile: UserProfile | None) -> str:
    if not profile:
        return "Анкета не заполнена. Узнай у пользователя: ОРТ балл, оценки в школе, бюджет на обучение, интересующее направление."
    parts = []
    if profile.ort_score: parts.append(f"ОРТ балл: {profile.ort_score}")
    if profile.gpa: parts.append(f"Средний балл аттестата: {profile.gpa}")
    if profile.budget_kgs: parts.append(f"Бюджет на обучение: {profile.budget_kgs} сом/год")
    if profile.city: parts.append(f"Предпочитаемый город: {profile.city}")
    if profile.target_field: parts.append(f"Интересующее направление: {profile.target_field}")
    if profile.interests: parts.append(f"Интересы: {', '.join(profile.interests)}")
    if profile.languages: parts.append(f"Языки: {', '.join(profile.languages)}")
    return "\n".join(parts) if parts else "Анкета частично заполнена."


def _build_universities_text(db: Session, limit_specialties_per_uni: int = 5) -> str:
    """Компактное представление всех вузов и их топовых специальностей."""
    unis = db.query(University).all()
    out = []
    for u in unis:
        specs = u.specialties[:limit_specialties_per_uni]
        if not specs:
            continue
        spec_lines = []
        for s in specs:
            tuition = f"{s.tuition_kgs} сом" if s.tuition_kgs else "стоимость уточняется"
            score = f"проходной {s.passing_score}" if s.passing_score else "проходной не указан"
            budget = f", {s.budget_seats} бюджетных мест" if s.budget_seats else ""
            spec_lines.append(f"  • {s.name} ({s.field or '—'}): {score}, {tuition}{budget}")
        out.append(f"{u.name} ({u.short_name or ''}, {u.city or ''}):\n" + "\n".join(spec_lines))
    return "\n\n".join(out) if out else "(в базе пока нет вузов)"


def _load_history(db: Session, user_id: int) -> list[dict]:
    """Достаёт последние HISTORY_LIMIT сообщений в формате OpenAI/Groq."""
    msgs = (db.query(Message)
              .filter_by(user_id=user_id)
              .order_by(Message.created_at.desc())
              .limit(HISTORY_LIMIT)
              .all())
    msgs.reverse()
    history = []
    for m in msgs:
        history.append({"role": m.role, "content": m.content})
    return history


def send_message(db: Session, user_id: int, user_message: str) -> tuple[str, int]:
    """Отправляет сообщение в Groq с учётом истории и профиля.
    Возвращает (ответ_ассистента, id_сохранённого_сообщения_ассистента)."""

    if not _client:
        reply = ("[Тестовый режим — GROQ_API_KEY не задан] "
                 "Привет! Расскажи о своих оценках и интересах, и я подберу вузы.")
        db.add(Message(user_id=user_id, role="user", content=user_message))
        msg = Message(user_id=user_id, role="assistant", content=reply)
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return reply, msg.id

    profile = db.query(UserProfile).filter_by(user_id=user_id).first()
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        profile=_build_profile_text(profile),
        universities=_build_universities_text(db),
    )
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(_load_history(db, user_id))
    messages.append({"role": "user", "content": user_message})

    try:
        response = _client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            max_tokens=MAX_TOKENS_CHAT,
            temperature=0.7,
        )
        reply = response.choices[0].message.content
    except Exception as e:
        reply = f"Извини, произошла ошибка при обращении к AI. Попробуй ещё раз. ({type(e).__name__})"

    db.add(Message(user_id=user_id, role="user", content=user_message))
    assistant_msg = Message(user_id=user_id, role="assistant", content=reply)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    return reply, assistant_msg.id
