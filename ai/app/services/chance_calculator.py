import math
from typing import Optional

FIELD_SYNONYMS = {
    "it": "IT", "айти": "IT", "ит": "IT", "программирование": "IT",
    "информационные технологии": "IT", "computer science": "IT",
    "программист": "IT", "разработка": "IT",

    "медицина": "медицина", "медик": "медицина", "врач": "медицина",
    "medical": "медицина", "лечебное дело": "медицина",

    "право": "право", "юриспруденция": "право", "юрист": "право",
    "law": "право",

    "экономика": "экономика", "экономист": "экономика",
    "финансы": "экономика", "бизнес": "экономика", "business": "экономика",
    "менеджмент": "экономика",

    "гуманитарные": "гуманитарные", "журналистика": "гуманитарные",
    "филология": "гуманитарные", "лингвистика": "гуманитарные",
    "перевод": "гуманитарные", "история": "гуманитарные",
    "международные отношения": "гуманитарные",

    "инженерия": "инженерия", "инженер": "инженерия",
    "машиностроение": "инженерия", "энергетика": "инженерия",

    "образование": "образование", "педагогика": "образование",
    "учитель": "образование",

    "творческие": "творческие", "дизайн": "творческие",
    "искусство": "творческие", "архитектура": "творческие",

    "сервис": "сервис", "туризм": "сервис", "гостиничный": "сервис",
}


def normalize_field(field: Optional[str]) -> Optional[str]:
    if not field:
        return None
    key = field.strip().lower()
    if key in FIELD_SYNONYMS:
        return FIELD_SYNONYMS[key]
    for synonym, canonical in FIELD_SYNONYMS.items():
        if synonym in key:
            return canonical
    return field


def calculate_admission_chance(
    ort_score: Optional[int],
    gpa: Optional[float],
    budget_kgs: Optional[int],
    target_field: Optional[str],
    passing_score: Optional[int],
    tuition_kgs: Optional[int],
    budget_seats: int,
    specialty_field: Optional[str],
) -> tuple[float, str]:
    reasons = []
    user_field = normalize_field(target_field)
    sp_field = (specialty_field or "").strip()

    # 1. Базовый шанс по ОРТ
    if ort_score is None or passing_score is None:
        base_chance = 0.5
        reasons.append("Точный ОРТ-балл не указан, оценка приблизительная")
    else:
        score_diff = ort_score - passing_score
        base_chance = 1 / (1 + math.exp(-score_diff / 15))
        if score_diff >= 20:
            reasons.append(f"Твой ОРТ ({ort_score}) уверенно выше проходного ({passing_score})")
        elif score_diff > 0:
            reasons.append(f"Твой ОРТ ({ort_score}) выше проходного на {score_diff} баллов")
        elif score_diff > -15:
            reasons.append(f"Твой ОРТ ({ort_score}) на {-score_diff} баллов ниже проходного — рискованно")
        else:
            reasons.append(f"Твой ОРТ ({ort_score}) сильно ниже проходного ({passing_score})")

    # 2. Аттестат
    if gpa is not None:
        gpa_factor = min(gpa / 5.0, 1.0)
        if gpa >= 4.5:
            reasons.append(f"Сильный аттестат ({gpa})")
    else:
        gpa_factor = 0.7

    # 3. Бюджет
    if budget_kgs is None or tuition_kgs is None:
        budget_factor = 0.7
        budget_note = ""
    elif tuition_kgs == 0:
        budget_factor = 1.0
        budget_note = "Обучение бесплатное"
    elif budget_kgs >= tuition_kgs:
        budget_factor = 1.0
        budget_note = f"Бюджет ({budget_kgs} сом) покрывает обучение ({tuition_kgs} сом)"
    elif budget_seats > 0:
        budget_factor = 0.65
        budget_note = (f"Контракт ({tuition_kgs} сом) выше твоего бюджета, "
                       f"но есть {budget_seats} бюджетных мест — попробуй пройти на грант")
    else:
        budget_factor = 0.2
        budget_note = f"Стоимость ({tuition_kgs} сом) превышает бюджет, бюджетных мест нет"
    if budget_note:
        reasons.append(budget_note)

    # 4. КЛЮЧЕВОЕ: совпадение с интересами
    interest_multiplier = 1.0
    if user_field:
        if user_field.lower() == sp_field.lower():
            interest_multiplier = 1.15
            reasons.append(f"✓ Совпадает с твоим направлением «{user_field}»")
        else:
            interest_multiplier = 0.55  # сильно режем непрофильные

    chance = base_chance * 0.70 + gpa_factor * 0.15 + budget_factor * 0.15
    chance *= interest_multiplier

    chance_percent = round(min(max(chance * 100, 1.0), 99.0), 1)
    reasoning = ". ".join(reasons) if reasons else "Оценка на основе доступных данных."
    return chance_percent, reasoning
