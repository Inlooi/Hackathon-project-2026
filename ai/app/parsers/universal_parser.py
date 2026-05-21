"""Универсальный LLM-парсер вузов и отзывов через Groq.

ПРЕИМУЩЕСТВА GROQ:
- 14,400 запросов/день (Gemini давал 20-50)
- Очень быстро: 1-3 секунды на запрос
- Спарсить 61 вуз с отзывами = 122 запроса = меньше 1% дневного лимита

КАК РАБОТАЕТ:
1. Скачивает HTML с сайта вуза
2. Чистит от мусора (скрипты, стили, навигация)
3. Передаёт текст в Groq с структурированным промптом
4. Получает JSON со специальностями и базовой инфой
5. Отдельным запросом просит Groq сгенерировать ПРАВДОПОДОБНЫЕ отзывы

⚠️ ПРО ОТЗЫВЫ:
В Кыргызстане нет единого агрегатора отзывов о вузах (как Otzovik).
Поэтому отзывы — синтетические, генерируются Groq на основе известной
публичной информации. Помечены source="ai_generated", чтобы фронт мог
показать это честно. Для прода планируется агрегировать Google Reviews,
Telegram-каналы абитуриентов и форму с модерацией.
"""
import json
import re
import time
import requests
from bs4 import BeautifulSoup
from datetime import datetime

from app.database import SessionLocal
from app.models.models import University, Specialty, Review, ParseLog
from app.services.llm_service import get_client, PARSER_MODEL, MAX_TOKENS_PARSER

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ru,en;q=0.9,ky;q=0.8",
}


# Глобальный флаг — если упёрлись в лимит, дальше не пытаемся
RATE_LIMITED = False


class RateLimitError(Exception):
    """Превышен лимит запросов к Groq."""


def _is_rate_limit_error(e: Exception) -> bool:
    name = type(e).__name__
    msg = str(e).lower()
    return "ratelimit" in name.lower() or "429" in msg or "quota" in msg or "rate_limit" in msg


EXTRACTION_PROMPT = """Извлеки информацию о кыргызском вузе из текста сайта. Верни СТРОГО валидный JSON без обрамляющих ```.

ВАЖНО:
- Если данных нет — ставь null или 0
- Цены указывай в кыргызских сомах (если на сайте в USD/RUB — переведи примерно: 1 USD ≈ 87 сом)
- Проходные баллы ОРТ в диапазоне 100-240
- field выбирай ТОЛЬКО из: IT, медицина, право, экономика, гуманитарные, инженерия, образование, творческие, сервис, сельское хозяйство, военные

Формат:
{{
  "description": "1-2 предложения о вузе",
  "founded_year": число_или_null,
  "student_count": число_или_null,
  "specialties": [
    {{
      "name": "название специальности",
      "faculty": "название факультета или null",
      "field": "одна из категорий выше",
      "passing_score": число_или_null,
      "tuition_kgs": число_в_сомах_или_null,
      "budget_seats": число_или_0,
      "language_of_instruction": "русский/английский/кыргызский/турецкий"
    }}
  ]
}}

ВУЗ: {uni_name}
ТЕКСТ САЙТА:
{text}
"""

REVIEWS_PROMPT = """Ты — эксперт по высшему образованию Кыргызстана. На основе известной публичной информации сгенерируй 4-6 РЕАЛИСТИЧНЫХ отзывов студентов о следующем вузе. Отзывы должны быть РАЗНОПЛАНОВЫМИ (и положительные, и негативные, и смешанные).

ВАЖНО:
- Отзывы должны звучать как написанные реальными студентами 18-23 лет
- Включай конкретику: названия предметов, преподавателей (вымышленных), факультетов
- Упоминай реальные плюсы/минусы вуза которые известны в общественном поле
- 1-2 отзыва пусть будут критическими (общага, бюрократия, преподаватели)
- Никаких клише типа "лучший вуз в мире"
- Используй разговорный стиль с лёгкими ошибками типичными для постов в соцсетях

Верни СТРОГО валидный JSON без обрамляющих ```:
{{
  "reviews": [
    {{
      "author": "вымышленное имя или ник",
      "rating": число_от_1_до_5,
      "content": "текст отзыва 2-4 предложения",
      "pros": "плюсы через запятую или null",
      "cons": "минусы через запятую или null",
      "sentiment": "positive" / "neutral" / "negative"
    }}
  ]
}}

ВУЗ: {uni_name} ({short_name})
ОПИСАНИЕ: {description}
ГОРОД: {city}
ТИП: {uni_type}
СПЕЦИАЛЬНОСТИ: {specialties_summary}
"""


def fetch_page_text(url: str, max_chars: int = 6000) -> str:
    """Скачивает страницу и достаёт чистый текст.

    max_chars уменьшен до 6000, чтобы влезать в Groq TPM (6000 токенов/минуту).
    Этого хватает чтобы достать ключевую инфу о факультетах и специальностях.
    """
    # Некоторые сайты с битыми сертификатами — пробуем без проверки SSL как fallback
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20, allow_redirects=True)
    except requests.exceptions.SSLError:
        resp = requests.get(url, headers=HEADERS, timeout=20, allow_redirects=True, verify=False)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")
    for tag in soup(["script", "style", "noscript", "nav", "footer", "header"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text[:max_chars]


def _clean_json_response(raw: str) -> str:
    """Чистит ответ от markdown-обёртки и мусора вокруг JSON."""
    raw = raw.strip()
    # Убираем обёртку ```json ... ```
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    # Иногда Llama добавляет преамбулу — пытаемся вырезать JSON начиная с первой {
    first_brace = raw.find("{")
    last_brace = raw.rfind("}")
    if first_brace >= 0 and last_brace > first_brace:
        raw = raw[first_brace:last_brace + 1]
    return raw


def _extract_retry_delay(error_str: str) -> float | None:
    """Достаёт из текста ошибки Groq, сколько секунд ждать.
    Groq возвращает что-то типа 'Please try again in 12.345s'."""
    match = re.search(r"try again in (\d+(?:\.\d+)?)\s*s", error_str, re.IGNORECASE)
    if match:
        return float(match.group(1)) + 1.0  # +1 секунда для надёжности
    return None


def _is_daily_limit(error_str: str) -> bool:
    """Дневной лимит — обычно с указанием суток (h или 24h)."""
    return any(token in error_str.lower() for token in [
        "daily", "per day", "24h", "tokens per day", "requests per day",
        "rpd limit", "tpd limit"
    ])


def _call_groq_for_json(prompt: str, max_retries: int = 5) -> dict | None:
    """Вызывает Groq с просьбой вернуть JSON.
    Автоматически ждёт и ретраит при минутном лимите.
    Бросает RateLimitError только при дневном лимите.

    Прогрессивная пауза: 1-я попытка ждёт сколько Groq сказал, 2-я ждёт +50%, 3-я +100% и т.д.
    """
    global RATE_LIMITED
    if RATE_LIMITED:
        return None
    client = get_client()
    if not client:
        print("   ⚠️  GROQ_API_KEY не задан")
        return None

    attempt = 0
    while attempt <= max_retries:
        try:
            response = client.chat.completions.create(
                model=PARSER_MODEL,
                messages=[
                    {"role": "system", "content": "Ты помощник для извлечения структурированных данных. Отвечай ТОЛЬКО валидным JSON без пояснений."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=MAX_TOKENS_PARSER,
                temperature=0.3,
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content
            return json.loads(_clean_json_response(raw))
        except json.JSONDecodeError as e:
            print(f"   ⚠️  JSON parse error: {e}")
            return None
        except Exception as e:
            error_str = str(e)
            if _is_rate_limit_error(e):
                # Если это дневной лимит — стопаем всё
                if _is_daily_limit(error_str):
                    print(f"   🚫 ДНЕВНОЙ лимит Groq исчерпан. Подожди до завтра.")
                    RATE_LIMITED = True
                    raise RateLimitError()

                # Минутный лимит — ждём и ретраим с прогрессивной паузой
                base_wait = _extract_retry_delay(error_str) or 30.0
                # Каждая следующая попытка ждёт всё дольше: 1.0x, 1.5x, 2.0x, 2.5x, 3.0x
                multiplier = 1.0 + (attempt * 0.5)
                wait = base_wait * multiplier
                attempt += 1
                if attempt > max_retries:
                    print(f"   ⚠️  Превышено {max_retries} ретраев. Пропускаю.")
                    return None
                print(f"   ⏳ Минутный лимит. Жду {wait:.0f}с и ретраю (попытка {attempt}/{max_retries})...")
                time.sleep(wait)
                continue

            print(f"   ⚠️  LLM error: {type(e).__name__}: {error_str[:200]}")
            return None
    return None


def extract_university_data(text: str, uni_name: str) -> dict | None:
    """Просит Groq выдать JSON с описанием вуза и специальностями."""
    prompt = EXTRACTION_PROMPT.format(uni_name=uni_name, text=text)
    return _call_groq_for_json(prompt)


def generate_reviews(uni_info: dict) -> list[dict]:
    """Генерирует синтетические отзывы для вуза через Groq."""
    global RATE_LIMITED
    if RATE_LIMITED:
        return []
    specialties_summary = ", ".join(
        sp.get("name", "") for sp in (uni_info.get("specialties") or [])[:5]
    ) or "разные направления"

    prompt = REVIEWS_PROMPT.format(
        uni_name=uni_info["name"],
        short_name=uni_info.get("short_name", ""),
        description=uni_info.get("description", ""),
        city=uni_info.get("city", "Бишкек"),
        uni_type=uni_info.get("type", "государственный"),
        specialties_summary=specialties_summary,
    )
    try:
        data = _call_groq_for_json(prompt)
        return data.get("reviews", []) if data else []
    except RateLimitError:
        return []


def save_university(uni_meta: dict, parsed_data: dict | None, reviews: list[dict],
                    db_session=None) -> int | None:
    """Сохраняет вуз + специальности + отзывы в БД."""
    db = db_session or SessionLocal()
    close_after = db_session is None
    try:
        existing = db.query(University).filter_by(name=uni_meta["name"]).first()
        if existing:
            uni = existing
            db.query(Specialty).filter_by(university_id=uni.id).delete()
            db.query(Review).filter_by(university_id=uni.id).delete()
        else:
            uni = University(name=uni_meta["name"])
            db.add(uni)

        uni.short_name = uni_meta.get("short_name")
        uni.type = uni_meta.get("type")
        uni.city = uni_meta.get("city")
        uni.website = uni_meta.get("website")
        uni.parsed_at = datetime.utcnow()

        if parsed_data:
            uni.description = parsed_data.get("description")
            uni.founded_year = parsed_data.get("founded_year")
            uni.student_count = parsed_data.get("student_count")
            uni.parse_status = "ok"
        else:
            uni.parse_status = "failed"
            if not uni.description:
                uni.description = f"{uni_meta.get('type', '').capitalize()} вуз в городе {uni_meta.get('city', '')}."

        db.flush()

        # Специальности
        specialties_count = 0
        if parsed_data and parsed_data.get("specialties"):
            for sp in parsed_data["specialties"]:
                if not sp.get("name"):
                    continue
                db.add(Specialty(
                    university_id=uni.id,
                    name=sp["name"],
                    faculty=sp.get("faculty"),
                    field=sp.get("field"),
                    passing_score=sp.get("passing_score"),
                    tuition_kgs=sp.get("tuition_kgs"),
                    budget_seats=sp.get("budget_seats") or 0,
                    language_of_instruction=sp.get("language_of_instruction"),
                ))
                specialties_count += 1

        # Отзывы
        reviews_count = 0
        if reviews:
            ratings = []
            for rv in reviews:
                if not rv.get("content"):
                    continue
                rating = rv.get("rating")
                if isinstance(rating, (int, float)):
                    ratings.append(float(rating))
                db.add(Review(
                    university_id=uni.id,
                    author=rv.get("author"),
                    rating=rating,
                    content=rv["content"],
                    pros=rv.get("pros"),
                    cons=rv.get("cons"),
                    sentiment=rv.get("sentiment"),
                    source="ai_generated",
                    posted_at=None,
                ))
                reviews_count += 1
            if ratings:
                uni.rating = round(sum(ratings) / len(ratings), 2)

        db.commit()
        print(f"   ✅ Сохранено: специальностей={specialties_count}, отзывов={reviews_count}")
        return uni.id
    except Exception as e:
        db.rollback()
        print(f"   ❌ Ошибка сохранения: {type(e).__name__}: {e}")
        return None
    finally:
        if close_after:
            db.close()


def parse_one_university(uni_meta: dict, generate_reviews_flag: bool = True) -> dict:
    """Полный пайплайн для одного вуза. Возвращает отчёт.

    Бросает RateLimitError если упёрлись в лимит API.
    """
    name = uni_meta["name"]
    url = uni_meta.get("website")
    report = {"name": name, "url": url, "status": "failed", "specialties": 0, "reviews": 0, "error": None}

    print(f"\n🔎 [{name}]")

    parsed_data = None
    if url:
        try:
            print(f"   ⬇️  Качаю {url}")
            text = fetch_page_text(url)
            print(f"   📄 Получено {len(text)} символов, отправляю в Groq...")
            parsed_data = extract_university_data(text, name)
            if parsed_data:
                report["specialties"] = len(parsed_data.get("specialties") or [])
        except RateLimitError:
            raise
        except requests.RequestException as e:
            print(f"   ⚠️  Сайт недоступен: {type(e).__name__}")
            report["error"] = f"site unreachable: {type(e).__name__}"
        except Exception as e:
            print(f"   ⚠️  Ошибка: {type(e).__name__}: {e}")
            report["error"] = str(e)

    # Отзывы генерим только если основной парсинг прошёл
    reviews = []
    if generate_reviews_flag and parsed_data and not RATE_LIMITED:
        uni_info_for_reviews = {**uni_meta}
        uni_info_for_reviews["description"] = parsed_data.get("description", "")
        uni_info_for_reviews["specialties"] = parsed_data.get("specialties", [])
        print(f"   💬 Генерирую отзывы...")
        reviews = generate_reviews(uni_info_for_reviews)
        report["reviews"] = len(reviews)

    # Сохраняем в БД
    uni_id = save_university(uni_meta, parsed_data, reviews)
    if uni_id:
        report["status"] = "ok" if parsed_data else "partial"
        report["uni_id"] = uni_id

    # Лог
    db = SessionLocal()
    try:
        db.add(ParseLog(
            url=url or "",
            status=report["status"],
            error=report["error"],
            specialties_found=report["specialties"],
            reviews_found=report["reviews"],
        ))
        db.commit()
    finally:
        db.close()

    return report
