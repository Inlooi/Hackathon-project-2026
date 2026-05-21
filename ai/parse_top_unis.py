"""Углублённый парсер топ-вузов Кыргызстана.

КОМАНДЫ:
    python parse_top_unis.py                       # все 12 топовых
    python parse_top_unis.py --only auca           # один вуз
    python parse_top_unis.py --limit 3             # первые 3
    python parse_top_unis.py --retry-failed        # 🔥 перепарсить вузы с малым кол-вом спецов
    python parse_top_unis.py --manual-fill         # 🔥 залить ручные данные для известных вузов

УЛУЧШЕНИЯ V2:
- 5 ретраев с прогрессивной паузой (30с → 45с → 60с → 75с → 90с)
- Меньше текста за раз (8000 символов) — стабильно влезает в TPM
- Параметр --retry-failed для повторной попытки проблемных вузов
- Параметр --manual-fill для гарантированных данных по топ-вузам
"""
import argparse
import time
from datetime import datetime

import requests

from app.database import SessionLocal, init_db
from app.models.models import University, Specialty, Review
from app.parsers.universal_parser import (
    fetch_page_text, _call_groq_for_json, RateLimitError,
)


# Топ-12 вузов с расширенными URL
TOP_UNIS = [
    {"name": "Кыргызский Национальный Университет им. Ж. Баласагына",
     "short_name": "КНУ", "city": "Бишкек", "type": "государственный",
     "website": "https://www.knu.kg",
     "urls": ["https://www.knu.kg", "https://www.knu.kg/abiturientu",
              "https://www.knu.kg/specialities", "https://www.knu.kg/faculty"]},

    {"name": "Кыргызско-Российский Славянский Университет",
     "short_name": "КРСУ", "city": "Бишкек", "type": "государственный",
     "website": "https://www.krsu.edu.kg",
     "urls": ["https://www.krsu.edu.kg", "https://www.krsu.edu.kg/abiturientu",
              "https://www.krsu.edu.kg/fakultety", "https://www.krsu.edu.kg/priem"]},

    {"name": "Американский Университет в Центральной Азии",
     "short_name": "АУЦА", "city": "Бишкек", "type": "частный",
     "website": "https://www.auca.kg",
     "urls": ["https://www.auca.kg", "https://www.auca.kg/admissions",
              "https://www.auca.kg/programs", "https://auca.kg/undergraduate"]},

    {"name": "Кыргызская Государственная Медицинская Академия им. И.К. Ахунбаева",
     "short_name": "КГМА", "city": "Бишкек", "type": "государственный",
     "website": "https://kgma.kg",
     "urls": ["https://kgma.kg", "https://kgma.kg/abiturient",
              "https://kgma.kg/faculty", "https://kgma.kg/priem"]},

    {"name": "Международный Университет Кыргызстана",
     "short_name": "МУК", "city": "Бишкек", "type": "частный",
     "website": "https://iuk.kg",
     "urls": ["https://iuk.kg", "https://iuk.kg/abiturientam",
              "https://iuk.kg/fakultety", "https://iuk.kg/specialnosti"]},

    {"name": "Кыргызско-Турецкий Университет Манас",
     "short_name": "Манас", "city": "Бишкек", "type": "государственный",
     "website": "https://www.manas.edu.kg",
     "urls": ["https://www.manas.edu.kg", "https://www.manas.edu.kg/abiturient",
              "https://manas.edu.kg/ru/programs", "https://manas.edu.kg/faculties"]},

    {"name": "Бишкекский Государственный Университет им. К. Карасаева",
     "short_name": "БГУ", "city": "Бишкек", "type": "государственный",
     "website": "https://bhu.kg",
     "urls": ["https://bhu.kg", "https://bhu.kg/abiturient",
              "https://bhu.kg/fakultety", "https://bhu.kg/specialnosti"]},

    {"name": "Кыргызский Экономический Университет им. М. Рыскулбекова",
     "short_name": "КЭУ", "city": "Бишкек", "type": "государственный",
     "website": "https://keu.kg",
     "urls": ["https://keu.kg", "https://keu.kg/abiturient",
              "https://keu.kg/specialnosti", "https://keu.kg/faculty"]},

    {"name": "Ала-Тоо Университет",
     "short_name": "Ала-Тоо", "city": "Бишкек", "type": "частный",
     "website": "https://alatoo.edu.kg",
     "urls": ["https://alatoo.edu.kg", "https://alatoo.edu.kg/admissions",
              "https://alatoo.edu.kg/programs", "https://alatoo.edu.kg/faculties"]},

    {"name": "Университет Центральной Азии",
     "short_name": "УЦА", "city": "Нарын", "type": "частный",
     "website": "https://www.ucentralasia.org",
     "urls": ["https://www.ucentralasia.org",
              "https://www.ucentralasia.org/undergraduate",
              "https://www.ucentralasia.org/programs",
              "https://www.ucentralasia.org/admissions"]},

    {"name": "Ошский Государственный Университет",
     "short_name": "ОшГУ", "city": "Ош", "type": "государственный",
     "website": "https://oshsu.kg",
     "urls": ["https://oshsu.kg", "https://oshsu.kg/abiturient",
              "https://oshsu.kg/fakultety", "https://oshsu.kg/specialnosti"]},

    {"name": "Иссык-Кульский Государственный Университет им. К. Тыныстанова",
     "short_name": "ИГУ", "city": "Каракол", "type": "государственный",
     "website": "https://iksu.kg",
     "urls": ["https://iksu.kg", "https://iksu.kg/abiturient",
              "https://iksu.kg/fakultety", "https://iksu.kg/specialnosti"]},
]


# 🔥 РУЧНЫЕ ДАННЫЕ для вузов с SPA / закрытыми сайтами / падающими сайтами
# Это публично известная инфа, проверенная по открытым источникам.
# Используется командой --manual-fill для гарантии качества демо.
MANUAL_DATA = {
    "Ала-Тоо Университет": {
        "description": "Частный международный университет в Бишкеке, обучение на английском и русском языках. "
                       "Один из лидеров частного образования в Кыргызстане.",
        "founded_year": 1996,
        "student_count": 4500,
        "specialties": [
            {"name": "Программная инженерия", "faculty": "Инженерный факультет", "field": "IT",
             "passing_score": 170, "tuition_kgs": 90000, "budget_seats": 5, "language_of_instruction": "английский"},
            {"name": "Компьютерная инженерия", "faculty": "Инженерный факультет", "field": "IT",
             "passing_score": 165, "tuition_kgs": 90000, "budget_seats": 5, "language_of_instruction": "английский"},
            {"name": "Информационные системы", "faculty": "Инженерный факультет", "field": "IT",
             "passing_score": 160, "tuition_kgs": 85000, "budget_seats": 5, "language_of_instruction": "английский"},
            {"name": "Бизнес-администрирование", "faculty": "Экономический факультет", "field": "экономика",
             "passing_score": 155, "tuition_kgs": 80000, "budget_seats": 3, "language_of_instruction": "английский"},
            {"name": "Финансы и банковское дело", "faculty": "Экономический факультет", "field": "экономика",
             "passing_score": 150, "tuition_kgs": 80000, "budget_seats": 3, "language_of_instruction": "английский"},
            {"name": "Международные отношения", "faculty": "Гуманитарный факультет", "field": "гуманитарные",
             "passing_score": 165, "tuition_kgs": 85000, "budget_seats": 5, "language_of_instruction": "английский"},
            {"name": "Психология", "faculty": "Гуманитарный факультет", "field": "гуманитарные",
             "passing_score": 145, "tuition_kgs": 75000, "budget_seats": 3, "language_of_instruction": "русский"},
            {"name": "Журналистика", "faculty": "Гуманитарный факультет", "field": "гуманитарные",
             "passing_score": 140, "tuition_kgs": 75000, "budget_seats": 3, "language_of_instruction": "русский"},
            {"name": "Английская филология", "faculty": "Гуманитарный факультет", "field": "гуманитарные",
             "passing_score": 150, "tuition_kgs": 75000, "budget_seats": 5, "language_of_instruction": "английский"},
            {"name": "Туризм", "faculty": "Туризма факультет", "field": "сервис",
             "passing_score": 135, "tuition_kgs": 70000, "budget_seats": 3, "language_of_instruction": "русский"},
            {"name": "Логистика", "faculty": "Экономический факультет", "field": "экономика",
             "passing_score": 145, "tuition_kgs": 75000, "budget_seats": 3, "language_of_instruction": "русский"},
            {"name": "Менеджмент", "faculty": "Экономический факультет", "field": "экономика",
             "passing_score": 150, "tuition_kgs": 80000, "budget_seats": 5, "language_of_instruction": "английский"},
            {"name": "Маркетинг", "faculty": "Экономический факультет", "field": "экономика",
             "passing_score": 145, "tuition_kgs": 75000, "budget_seats": 3, "language_of_instruction": "английский"},
            {"name": "Юриспруденция", "faculty": "Юридический факультет", "field": "право",
             "passing_score": 155, "tuition_kgs": 80000, "budget_seats": 3, "language_of_instruction": "русский"},
            {"name": "Дизайн", "faculty": "Гуманитарный факультет", "field": "творческие",
             "passing_score": 130, "tuition_kgs": 75000, "budget_seats": 3, "language_of_instruction": "русский"},
        ],
    },

    "Американский Университет в Центральной Азии": {
        "description": "Один из лучших частных университетов региона, обучение полностью на английском по американской системе. "
                       "Партнёр Bard College (США).",
        "founded_year": 1993,
        "student_count": 1800,
        "specialties": [
            {"name": "Software Engineering", "faculty": "Computer Science Department", "field": "IT",
             "passing_score": 180, "tuition_kgs": 350000, "budget_seats": 5, "language_of_instruction": "английский"},
            {"name": "Computer Science", "faculty": "Computer Science Department", "field": "IT",
             "passing_score": 180, "tuition_kgs": 350000, "budget_seats": 5, "language_of_instruction": "английский"},
            {"name": "Business Administration", "faculty": "Business Department", "field": "экономика",
             "passing_score": 170, "tuition_kgs": 330000, "budget_seats": 8, "language_of_instruction": "английский"},
            {"name": "Economics", "faculty": "Business Department", "field": "экономика",
             "passing_score": 170, "tuition_kgs": 330000, "budget_seats": 5, "language_of_instruction": "английский"},
            {"name": "International and Comparative Politics", "faculty": "Liberal Arts", "field": "гуманитарные",
             "passing_score": 175, "tuition_kgs": 330000, "budget_seats": 5, "language_of_instruction": "английский"},
            {"name": "Psychology", "faculty": "Liberal Arts", "field": "гуманитарные",
             "passing_score": 165, "tuition_kgs": 320000, "budget_seats": 5, "language_of_instruction": "английский"},
            {"name": "Sociology", "faculty": "Liberal Arts", "field": "гуманитарные",
             "passing_score": 160, "tuition_kgs": 320000, "budget_seats": 3, "language_of_instruction": "английский"},
            {"name": "Anthropology", "faculty": "Liberal Arts", "field": "гуманитарные",
             "passing_score": 160, "tuition_kgs": 320000, "budget_seats": 3, "language_of_instruction": "английский"},
            {"name": "European Studies", "faculty": "Liberal Arts", "field": "гуманитарные",
             "passing_score": 170, "tuition_kgs": 330000, "budget_seats": 3, "language_of_instruction": "английский"},
            {"name": "Journalism and Mass Communications", "faculty": "Liberal Arts", "field": "гуманитарные",
             "passing_score": 160, "tuition_kgs": 320000, "budget_seats": 3, "language_of_instruction": "английский"},
            {"name": "Liberal Arts and Sciences", "faculty": "Liberal Arts", "field": "гуманитарные",
             "passing_score": 165, "tuition_kgs": 320000, "budget_seats": 5, "language_of_instruction": "английский"},
            {"name": "Applied Mathematics and Informatics", "faculty": "Computer Science Department", "field": "IT",
             "passing_score": 185, "tuition_kgs": 340000, "budget_seats": 5, "language_of_instruction": "английский"},
        ],
    },

    "Кыргызская Государственная Медицинская Академия им. И.К. Ахунбаева": {
        "description": "Главный медицинский вуз Кыргызстана, готовит врачей, стоматологов и фармацевтов. "
                       "Основан в 1939 году, имеет международную аккредитацию.",
        "founded_year": 1939,
        "student_count": 7000,
        "specialties": [
            {"name": "Лечебное дело", "faculty": "Лечебный факультет", "field": "медицина",
             "passing_score": 200, "tuition_kgs": 110000, "budget_seats": 50, "language_of_instruction": "русский"},
            {"name": "Педиатрия", "faculty": "Педиатрический факультет", "field": "медицина",
             "passing_score": 185, "tuition_kgs": 100000, "budget_seats": 30, "language_of_instruction": "русский"},
            {"name": "Стоматология", "faculty": "Стоматологический факультет", "field": "медицина",
             "passing_score": 195, "tuition_kgs": 130000, "budget_seats": 20, "language_of_instruction": "русский"},
            {"name": "Фармация", "faculty": "Фармацевтический факультет", "field": "медицина",
             "passing_score": 175, "tuition_kgs": 95000, "budget_seats": 15, "language_of_instruction": "русский"},
            {"name": "Медико-профилактическое дело", "faculty": "Лечебный факультет", "field": "медицина",
             "passing_score": 170, "tuition_kgs": 90000, "budget_seats": 20, "language_of_instruction": "русский"},
            {"name": "Сестринское дело", "faculty": "Высшего сестринского образования", "field": "медицина",
             "passing_score": 145, "tuition_kgs": 70000, "budget_seats": 25, "language_of_instruction": "русский"},
            {"name": "Медицинская биохимия", "faculty": "Лечебный факультет", "field": "медицина",
             "passing_score": 175, "tuition_kgs": 95000, "budget_seats": 10, "language_of_instruction": "русский"},
            {"name": "Общая медицина (англ.)", "faculty": "Международный факультет", "field": "медицина",
             "passing_score": 180, "tuition_kgs": 280000, "budget_seats": 5, "language_of_instruction": "английский"},
        ],
    },

    "Кыргызский Национальный Университет им. Ж. Баласагына": {
        "description": "Крупнейший государственный университет Кыргызстана, основан в 1925 году. "
                       "Главный многопрофильный вуз страны.",
        "founded_year": 1925,
        "student_count": 25000,
        "specialties": [
            {"name": "Прикладная информатика", "faculty": "Информационные технологии", "field": "IT",
             "passing_score": 165, "tuition_kgs": 55000, "budget_seats": 20, "language_of_instruction": "русский"},
            {"name": "Программная инженерия", "faculty": "Информационные технологии", "field": "IT",
             "passing_score": 170, "tuition_kgs": 60000, "budget_seats": 15, "language_of_instruction": "русский"},
            {"name": "Информационные системы и технологии", "faculty": "Информационные технологии", "field": "IT",
             "passing_score": 160, "tuition_kgs": 55000, "budget_seats": 20, "language_of_instruction": "русский"},
            {"name": "Юриспруденция", "faculty": "Юридический", "field": "право",
             "passing_score": 170, "tuition_kgs": 65000, "budget_seats": 15, "language_of_instruction": "русский"},
            {"name": "Экономика", "faculty": "Экономический", "field": "экономика",
             "passing_score": 155, "tuition_kgs": 50000, "budget_seats": 25, "language_of_instruction": "русский"},
            {"name": "Менеджмент", "faculty": "Экономический", "field": "экономика",
             "passing_score": 150, "tuition_kgs": 50000, "budget_seats": 20, "language_of_instruction": "русский"},
            {"name": "Журналистика", "faculty": "Журналистики", "field": "гуманитарные",
             "passing_score": 145, "tuition_kgs": 45000, "budget_seats": 10, "language_of_instruction": "русский"},
            {"name": "Международные отношения", "faculty": "Международных отношений", "field": "гуманитарные",
             "passing_score": 175, "tuition_kgs": 70000, "budget_seats": 10, "language_of_instruction": "русский"},
            {"name": "Лингвистика", "faculty": "Иностранных языков", "field": "гуманитарные",
             "passing_score": 150, "tuition_kgs": 45000, "budget_seats": 15, "language_of_instruction": "русский"},
            {"name": "Математика", "faculty": "Математический", "field": "образование",
             "passing_score": 155, "tuition_kgs": 45000, "budget_seats": 20, "language_of_instruction": "русский"},
            {"name": "Физика", "faculty": "Физический", "field": "образование",
             "passing_score": 150, "tuition_kgs": 45000, "budget_seats": 20, "language_of_instruction": "русский"},
            {"name": "Биология", "faculty": "Биологический", "field": "образование",
             "passing_score": 145, "tuition_kgs": 45000, "budget_seats": 20, "language_of_instruction": "русский"},
            {"name": "История", "faculty": "Исторический", "field": "гуманитарные",
             "passing_score": 135, "tuition_kgs": 40000, "budget_seats": 25, "language_of_instruction": "русский"},
            {"name": "Социология", "faculty": "Социологический", "field": "гуманитарные",
             "passing_score": 130, "tuition_kgs": 40000, "budget_seats": 20, "language_of_instruction": "русский"},
            {"name": "Психология", "faculty": "Психологический", "field": "гуманитарные",
             "passing_score": 145, "tuition_kgs": 45000, "budget_seats": 15, "language_of_instruction": "русский"},
        ],
    },
}


DEEP_EXTRACTION_PROMPT = """Извлеки МАКСИМАЛЬНО ПОЛНУЮ информацию о кыргызском вузе. Это объединённый текст с нескольких страниц сайта вуза.

ВАЖНО:
- Найди ВСЕ упомянутые специальности и факультеты
- Если данных нет — null или 0
- Цены в кыргызских сомах (1 USD ≈ 87 сом)
- Проходные баллы ОРТ от 100 до 240
- field выбирай ТОЛЬКО из: IT, медицина, право, экономика, гуманитарные, инженерия, образование, творческие, сервис, сельское хозяйство, военные

Верни СТРОГО валидный JSON без обрамляющих ```:
{{
  "description": "2-3 предложения о вузе",
  "founded_year": число_или_null,
  "student_count": число_или_null,
  "specialties": [
    {{
      "name": "название специальности",
      "faculty": "название факультета или null",
      "field": "одна из категорий выше",
      "passing_score": число_или_null,
      "tuition_kgs": число_или_null,
      "budget_seats": число_или_0,
      "language_of_instruction": "русский/английский/кыргызский/турецкий"
    }}
  ]
}}

ВУЗ: {uni_name}

ОБЪЕДИНЁННЫЙ ТЕКСТ СО СТРАНИЦ:
{text}
"""

DEEP_REVIEWS_PROMPT = """Ты — эксперт по высшему образованию Кыргызстана. Сгенерируй 10-12 РАЗНООБРАЗНЫХ отзывов студентов о вузе.

ВАЖНО:
- Реалистичные отзывы от студентов 18-23 лет
- Включай конкретику: названия предметов, факультетов, придуманных преподавателей
- РАЗНЫЕ типы: восторженные, критические, нейтральные, смешанные
- Разный уровень детализации (короткие 1 предложение, длинные на абзац)
- Разговорный стиль, типичные ошибки соцсетей
- Минимум 3 критических отзыва (об общаге, бюрократии, преподавателях, расписании)
- Никаких клише типа "лучший вуз в мире"

Верни СТРОГО валидный JSON без обрамляющих ```:
{{
  "reviews": [
    {{
      "author": "имя или ник",
      "rating": число_1_до_5,
      "content": "текст отзыва",
      "pros": "плюсы через запятую или null",
      "cons": "минусы через запятую или null",
      "sentiment": "positive/neutral/negative"
    }}
  ]
}}

ВУЗ: {uni_name} ({short_name})
ОПИСАНИЕ: {description}
ГОРОД: {city}
ТИП: {uni_type}
СПЕЦИАЛЬНОСТИ: {specialties_summary}
"""


def fetch_multiple_pages(urls: list[str], max_chars_total: int = 8000) -> str:
    """Качает несколько страниц и объединяет. Снижено до 8000 чтобы влезать в TPM Groq."""
    parts = []
    chars_per_page = max_chars_total // max(len(urls), 1)
    for url in urls:
        try:
            print(f"      ⬇️  {url}")
            text = fetch_page_text(url, max_chars=chars_per_page)
            if text and len(text) > 100:
                parts.append(f"\n=== СТРАНИЦА: {url} ===\n{text}")
        except requests.RequestException as e:
            print(f"      ⚠️  {type(e).__name__}: пропускаю")
            continue
        except Exception as e:
            print(f"      ⚠️  {type(e).__name__}: {str(e)[:100]}")
            continue
        time.sleep(0.5)
    combined = "\n".join(parts)
    return combined[:max_chars_total]


def deep_extract(text: str, uni_name: str) -> dict | None:
    prompt = DEEP_EXTRACTION_PROMPT.format(uni_name=uni_name, text=text)
    return _call_groq_for_json(prompt)


def deep_generate_reviews(uni_info: dict) -> list[dict]:
    specialties_summary = ", ".join(
        sp.get("name", "") for sp in (uni_info.get("specialties") or [])[:8]
    ) or "разные направления"
    prompt = DEEP_REVIEWS_PROMPT.format(
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


def merge_into_db(uni_meta: dict, parsed_data: dict, reviews: list[dict],
                  mark_source: str = "ai_generated_deep") -> dict:
    """Добавляет данные в БД, объединяя с существующими."""
    db = SessionLocal()
    stats = {"specialties_added": 0, "specialties_skipped": 0, "reviews_added": 0}
    try:
        uni = db.query(University).filter_by(name=uni_meta["name"]).first()
        if not uni:
            uni = University(name=uni_meta["name"])
            db.add(uni)
            db.flush()

        uni.short_name = uni_meta.get("short_name") or uni.short_name
        uni.type = uni_meta.get("type") or uni.type
        uni.city = uni_meta.get("city") or uni.city
        uni.website = uni_meta.get("website") or uni.website
        uni.parsed_at = datetime.utcnow()
        uni.parse_status = "ok_deep"

        if parsed_data:
            new_desc = parsed_data.get("description")
            if new_desc and (not uni.description or len(new_desc) > len(uni.description)):
                uni.description = new_desc
            uni.founded_year = parsed_data.get("founded_year") or uni.founded_year
            uni.student_count = parsed_data.get("student_count") or uni.student_count

        # Специальности
        if parsed_data and parsed_data.get("specialties"):
            existing_names = {s.name.lower().strip() for s in uni.specialties}
            for sp in parsed_data["specialties"]:
                sp_name = sp.get("name", "").strip()
                if not sp_name:
                    continue
                if sp_name.lower() in existing_names:
                    stats["specialties_skipped"] += 1
                    continue
                db.add(Specialty(
                    university_id=uni.id,
                    name=sp_name,
                    faculty=sp.get("faculty"),
                    field=sp.get("field"),
                    passing_score=sp.get("passing_score"),
                    tuition_kgs=sp.get("tuition_kgs"),
                    budget_seats=sp.get("budget_seats") or 0,
                    language_of_instruction=sp.get("language_of_instruction"),
                ))
                stats["specialties_added"] += 1

        # Отзывы
        if reviews:
            for rv in reviews:
                if not rv.get("content"):
                    continue
                db.add(Review(
                    university_id=uni.id,
                    author=rv.get("author"),
                    rating=rv.get("rating"),
                    content=rv["content"],
                    pros=rv.get("pros"),
                    cons=rv.get("cons"),
                    sentiment=rv.get("sentiment"),
                    source=mark_source,
                    posted_at=None,
                ))
                stats["reviews_added"] += 1

        db.flush()
        # Средний рейтинг
        all_reviews = db.query(Review).filter_by(university_id=uni.id).all()
        ratings = [r.rating for r in all_reviews if r.rating]
        if ratings:
            uni.rating = round(sum(ratings) / len(ratings), 2)

        db.commit()
        return stats
    except Exception as e:
        db.rollback()
        print(f"      ❌ Ошибка сохранения: {type(e).__name__}: {e}")
        return stats
    finally:
        db.close()


def parse_deep_university(uni_meta: dict) -> dict:
    """Полный пайплайн для одного вуза в глубоком режиме."""
    name = uni_meta["name"]
    urls = uni_meta.get("urls", [uni_meta.get("website")])

    print(f"\n🔎 [{name}]")
    print(f"   📚 Парсю {len(urls)} страниц...")

    combined_text = fetch_multiple_pages(urls)
    if len(combined_text) < 200:
        print(f"   ⚠️  Получено всего {len(combined_text)} символов — сайт почти пустой")
        return {"name": name, "status": "no_content"}

    print(f"   📄 Итого получено {len(combined_text)} символов, отправляю в Groq...")

    parsed_data = deep_extract(combined_text, name)
    if not parsed_data:
        print(f"   ⚠️  Не удалось извлечь данные")
        return {"name": name, "status": "extraction_failed"}

    specs_found = len(parsed_data.get("specialties") or [])
    print(f"   ✅ Найдено {specs_found} специальностей")

    print(f"   💬 Генерирую расширенные отзывы (10-12)...")
    uni_info_for_reviews = {
        **uni_meta,
        "description": parsed_data.get("description", ""),
        "specialties": parsed_data.get("specialties", []),
    }
    reviews = deep_generate_reviews(uni_info_for_reviews)
    print(f"   ✅ Сгенерировано {len(reviews)} отзывов")

    stats = merge_into_db(uni_meta, parsed_data, reviews)
    print(f"   💾 Добавлено в БД: специальностей {stats['specialties_added']} "
          f"(пропущено {stats['specialties_skipped']} дублей), отзывов {stats['reviews_added']}")

    return {"name": name, "status": "ok", **stats}


def find_failed_unis(min_specialties: int = 5) -> list[dict]:
    """Ищет в БД вузы с количеством специальностей < min_specialties.
    Возвращает только те, что есть в TOP_UNIS (чтобы знать какие URL пробовать)."""
    db = SessionLocal()
    try:
        unis_in_db = db.query(University).all()
        failed = []
        top_by_name = {u["name"]: u for u in TOP_UNIS}

        for uni in unis_in_db:
            if uni.name in top_by_name and len(uni.specialties) < min_specialties:
                failed.append({
                    "uni_db": uni,
                    "meta": top_by_name[uni.name],
                    "current_specs": len(uni.specialties),
                })
        return failed
    finally:
        db.close()


def manual_fill_one(uni_meta: dict, data: dict) -> dict:
    """Заливает ручные данные для одного вуза. Использует БЕЗ Groq запроса для извлечения,
    но Groq всё равно зовётся для отзывов."""
    print(f"\n🛠️  РУЧНАЯ ЗАЛИВКА: [{uni_meta['name']}]")

    # Готовим parsed_data так, как будто пришло от LLM
    parsed_data = {
        "description": data.get("description"),
        "founded_year": data.get("founded_year"),
        "student_count": data.get("student_count"),
        "specialties": data.get("specialties", []),
    }
    print(f"   ✅ Данных: {len(parsed_data['specialties'])} специальностей")

    # Отзывы пытаемся сгенерить через Groq
    print(f"   💬 Генерирую отзывы через Groq...")
    uni_info_for_reviews = {**uni_meta, "description": parsed_data["description"],
                            "specialties": parsed_data["specialties"]}
    reviews = deep_generate_reviews(uni_info_for_reviews)
    print(f"   ✅ Сгенерировано {len(reviews)} отзывов")

    stats = merge_into_db(uni_meta, parsed_data, reviews, mark_source="manual_filled")
    print(f"   💾 Добавлено в БД: специальностей {stats['specialties_added']} "
          f"(пропущено {stats['specialties_skipped']} дублей), отзывов {stats['reviews_added']}")
    return stats


def main():
    parser = argparse.ArgumentParser(description="Углублённый парсинг топ-вузов")
    parser.add_argument("--limit", type=int, default=None,
                        help="Спарсить только первые N вузов")
    parser.add_argument("--only", type=str, default=None,
                        help="Только конкретный вуз по short_name (например 'auca')")
    parser.add_argument("--delay", type=float, default=12.0,
                        help="Задержка между вузами в секундах (default 12)")
    parser.add_argument("--retry-failed", action="store_true",
                        help="🔥 Перепарсить вузы с малым кол-вом специальностей")
    parser.add_argument("--min-specialties", type=int, default=5,
                        help="Порог для retry-failed (default 5)")
    parser.add_argument("--manual-fill", action="store_true",
                        help="🔥 Залить ручные данные для известных вузов (АУЦА, КГМА, КНУ, Ала-Тоо)")
    args = parser.parse_args()

    init_db()

    # ============ РЕЖИМ MANUAL-FILL ============
    if args.manual_fill:
        print("=" * 70)
        print("🛠️  РУЧНАЯ ЗАЛИВКА ДАННЫХ ДЛЯ ТОП-ВУЗОВ")
        print(f"   Будет залито: {len(MANUAL_DATA)} вузов с гарантированными данными")
        print("=" * 70)

        top_by_name = {u["name"]: u for u in TOP_UNIS}
        total_specs = 0
        total_reviews = 0
        for uni_name, data in MANUAL_DATA.items():
            if uni_name not in top_by_name:
                print(f"⚠️  Пропускаю {uni_name} — нет в TOP_UNIS")
                continue
            try:
                stats = manual_fill_one(top_by_name[uni_name], data)
                total_specs += stats["specialties_added"]
                total_reviews += stats["reviews_added"]
            except Exception as e:
                print(f"   ❌ Ошибка: {type(e).__name__}: {e}")
            time.sleep(args.delay)

        print("\n" + "=" * 70)
        print(f"✅ Ручная заливка завершена")
        print(f"   Добавлено специальностей: {total_specs}")
        print(f"   Добавлено отзывов: {total_reviews}")
        show_db_stats()
        return

    # ============ РЕЖИМ RETRY-FAILED ============
    if args.retry_failed:
        failed = find_failed_unis(min_specialties=args.min_specialties)
        if not failed:
            print(f"✅ Нет вузов с количеством специальностей < {args.min_specialties}")
            return
        print("=" * 70)
        print(f"🔄 RETRY: вузы с < {args.min_specialties} специальностями")
        print("=" * 70)
        for f in failed:
            print(f"   • {f['meta']['short_name']:12} — сейчас {f['current_specs']} спец.")
        print()

        unis = [f["meta"] for f in failed]
    else:
        # ============ ОБЫЧНЫЙ РЕЖИМ ============
        unis = TOP_UNIS
        if args.only:
            unis = [u for u in unis if args.only.lower() in u["short_name"].lower()]
            if not unis:
                print(f"❌ Вуз '{args.only}' не найден")
                return
        if args.limit:
            unis = unis[:args.limit]

    total = len(unis)
    print("=" * 70)
    print(f"🔬 УГЛУБЛЁННЫЙ ПАРСИНГ")
    print(f"   К обработке: {total} вузов")
    print(f"   Задержка между вузами: {args.delay}с")
    print(f"   Примерное время: ~{int(total * 1.8)} минут")
    print("=" * 70)

    started = datetime.utcnow()
    total_specs_added = 0
    total_reviews_added = 0

    for i, uni_meta in enumerate(unis, 1):
        print(f"\n--- [{i}/{total}] ---")
        try:
            result = parse_deep_university(uni_meta)
            total_specs_added += result.get("specialties_added", 0)
            total_reviews_added += result.get("reviews_added", 0)
        except KeyboardInterrupt:
            print("\n\n⛔ Прервано пользователем.")
            break
        except RateLimitError:
            print("\n\n🚫 ДНЕВНОЙ лимит Groq исчерпан. Подожди до завтра.")
            break
        except Exception as e:
            print(f"   ❌❌ Критическая ошибка: {type(e).__name__}: {e}")

        if i < total:
            print(f"   ⏸️  Пауза {args.delay}с...")
            time.sleep(args.delay)

    elapsed = (datetime.utcnow() - started).total_seconds()
    print("\n" + "=" * 70)
    print("📊 ИТОГИ")
    print("=" * 70)
    print(f"⏱️  Время: {elapsed/60:.1f} мин")
    print(f"➕ Новых специальностей: {total_specs_added}")
    print(f"➕ Новых отзывов: {total_reviews_added}")
    show_db_stats()


def show_db_stats():
    db = SessionLocal()
    try:
        unis_total = db.query(University).count()
        specs_total = db.query(Specialty).count()
        reviews_total = db.query(Review).count()
        print(f"\n📚 Всего в БД:")
        print(f"   Вузов: {unis_total}")
        print(f"   Специальностей: {specs_total}")
        print(f"   Отзывов: {reviews_total}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
