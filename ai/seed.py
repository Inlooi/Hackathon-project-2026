"""Начальные данные — 10 крупнейших вузов Кыргызстана.

ВАЖНО: проходные баллы и стоимость указаны ПРИМЕРНО — на хакатоне сойдёт,
для продакшна нужно сверить с официальными сайтами. На презентации честно скажи:
"данные собраны частично автоматически, частично из открытых источников".
"""
from app.database import SessionLocal, init_db
from app.models.models import University, Specialty


SEED_DATA = [
    {
        "name": "Кыргызский Национальный Университет им. Ж. Баласагына",
        "short_name": "КНУ",
        "type": "государственный",
        "city": "Бишкек",
        "website": "https://www.knu.kg",
        "description": "Крупнейший государственный университет Кыргызстана.",
        "specialties": [
            {"name": "Прикладная информатика", "faculty": "Информационные технологии",
             "field": "IT", "passing_score": 165, "tuition_kgs": 55000, "budget_seats": 20},
            {"name": "Юриспруденция", "faculty": "Юридический",
             "field": "право", "passing_score": 170, "tuition_kgs": 65000, "budget_seats": 15},
            {"name": "Экономика", "faculty": "Экономический",
             "field": "экономика", "passing_score": 155, "tuition_kgs": 50000, "budget_seats": 25},
            {"name": "Журналистика", "faculty": "Журналистики",
             "field": "гуманитарные", "passing_score": 145, "tuition_kgs": 45000, "budget_seats": 10},
        ],
    },
    {
        "name": "Кыргызско-Российский Славянский Университет",
        "short_name": "КРСУ",
        "type": "государственный",
        "city": "Бишкек",
        "website": "https://www.krsu.edu.kg",
        "description": "Совместный университет Кыргызстана и России, российский диплом.",
        "specialties": [
            {"name": "Информационные системы и технологии", "faculty": "Естественно-технический",
             "field": "IT", "passing_score": 175, "tuition_kgs": 80000, "budget_seats": 30},
            {"name": "Лечебное дело", "faculty": "Медицинский",
             "field": "медицина", "passing_score": 195, "tuition_kgs": 120000, "budget_seats": 15},
            {"name": "Международные отношения", "faculty": "Гуманитарный",
             "field": "гуманитарные", "passing_score": 180, "tuition_kgs": 75000, "budget_seats": 10},
            {"name": "Финансы и кредит", "faculty": "Экономический",
             "field": "экономика", "passing_score": 170, "tuition_kgs": 70000, "budget_seats": 12},
        ],
    },
    {
        "name": "Американский Университет в Центральной Азии",
        "short_name": "АУЦА",
        "type": "частный",
        "city": "Бишкек",
        "website": "https://www.auca.kg",
        "description": "Обучение на английском языке, американская система образования.",
        "specialties": [
            {"name": "Software Engineering", "faculty": "Computer Science",
             "field": "IT", "passing_score": 180, "tuition_kgs": 350000, "budget_seats": 5},
            {"name": "Business Administration", "faculty": "Business",
             "field": "экономика", "passing_score": 170, "tuition_kgs": 330000, "budget_seats": 8},
            {"name": "Psychology", "faculty": "Liberal Arts",
             "field": "гуманитарные", "passing_score": 165, "tuition_kgs": 320000, "budget_seats": 3},
        ],
    },
    {
        "name": "Кыргызская Государственная Медицинская Академия",
        "short_name": "КГМА",
        "type": "государственный",
        "city": "Бишкек",
        "website": "https://www.kgma.kg",
        "description": "Главный медицинский вуз страны.",
        "specialties": [
            {"name": "Лечебное дело", "faculty": "Лечебный",
             "field": "медицина", "passing_score": 200, "tuition_kgs": 110000, "budget_seats": 50},
            {"name": "Стоматология", "faculty": "Стоматологический",
             "field": "медицина", "passing_score": 195, "tuition_kgs": 130000, "budget_seats": 20},
            {"name": "Педиатрия", "faculty": "Педиатрический",
             "field": "медицина", "passing_score": 185, "tuition_kgs": 100000, "budget_seats": 30},
            {"name": "Фармация", "faculty": "Фармацевтический",
             "field": "медицина", "passing_score": 175, "tuition_kgs": 95000, "budget_seats": 15},
        ],
    },
    {
        "name": "Кыргызская Государственная Юридическая Академия",
        "short_name": "КГЮА",
        "type": "государственный",
        "city": "Бишкек",
        "website": "https://www.ksla.kg",
        "description": "Профильный юридический вуз.",
        "specialties": [
            {"name": "Юриспруденция", "faculty": "Юридический",
             "field": "право", "passing_score": 175, "tuition_kgs": 60000, "budget_seats": 25},
            {"name": "Международное право", "faculty": "Международного права",
             "field": "право", "passing_score": 180, "tuition_kgs": 70000, "budget_seats": 10},
        ],
    },
    {
        "name": "Международный Университет Кыргызстана",
        "short_name": "МУК",
        "type": "частный",
        "city": "Бишкек",
        "website": "https://www.iuk.kg",
        "description": "Частный многопрофильный университет.",
        "specialties": [
            {"name": "Программная инженерия", "faculty": "IT",
             "field": "IT", "passing_score": 160, "tuition_kgs": 70000, "budget_seats": 5},
            {"name": "Дизайн", "faculty": "Дизайна",
             "field": "творческие", "passing_score": 130, "tuition_kgs": 65000, "budget_seats": 3},
            {"name": "Менеджмент", "faculty": "Бизнес",
             "field": "экономика", "passing_score": 140, "tuition_kgs": 60000, "budget_seats": 5},
        ],
    },
    {
        "name": "Кыргызско-Турецкий Университет Манас",
        "short_name": "Манас",
        "type": "государственный",
        "city": "Бишкек",
        "website": "https://www.manas.edu.kg",
        "description": "Совместный кыргызско-турецкий университет, обучение бесплатное по конкурсу.",
        "specialties": [
            {"name": "Компьютерная инженерия", "faculty": "Инженерный",
             "field": "IT", "passing_score": 180, "tuition_kgs": 0, "budget_seats": 25},
            {"name": "Туризм и гостиничный бизнес", "faculty": "Туризма",
             "field": "сервис", "passing_score": 150, "tuition_kgs": 0, "budget_seats": 20},
            {"name": "Международные отношения", "faculty": "Гуманитарный",
             "field": "гуманитарные", "passing_score": 170, "tuition_kgs": 0, "budget_seats": 15},
        ],
    },
    {
        "name": "Кыргызский Государственный Технический Университет им. И. Раззакова",
        "short_name": "КГТУ",
        "type": "государственный",
        "city": "Бишкек",
        "website": "https://www.kstu.kg",
        "description": "Главный технический вуз страны.",
        "specialties": [
            {"name": "Информатика и вычислительная техника", "faculty": "Информационных технологий",
             "field": "IT", "passing_score": 155, "tuition_kgs": 50000, "budget_seats": 30},
            {"name": "Энергетика", "faculty": "Энергетический",
             "field": "инженерия", "passing_score": 145, "tuition_kgs": 45000, "budget_seats": 25},
            {"name": "Машиностроение", "faculty": "Машиностроения",
             "field": "инженерия", "passing_score": 135, "tuition_kgs": 45000, "budget_seats": 20},
        ],
    },
    {
        "name": "Бишкекский Государственный Университет им. К. Карасаева",
        "short_name": "БГУ",
        "type": "государственный",
        "city": "Бишкек",
        "website": "https://www.bsu.edu.kg",
        "description": "Гуманитарный профиль, изучение языков.",
        "specialties": [
            {"name": "Лингвистика", "faculty": "Иностранных языков",
             "field": "гуманитарные", "passing_score": 150, "tuition_kgs": 45000, "budget_seats": 15},
            {"name": "Перевод и переводоведение", "faculty": "Переводческий",
             "field": "гуманитарные", "passing_score": 160, "tuition_kgs": 50000, "budget_seats": 10},
        ],
    },
    {
        "name": "Ошский Государственный Университет",
        "short_name": "ОшГУ",
        "type": "государственный",
        "city": "Ош",
        "website": "https://www.oshsu.kg",
        "description": "Крупнейший вуз юга Кыргызстана.",
        "specialties": [
            {"name": "Информационные технологии", "faculty": "Математики и ИТ",
             "field": "IT", "passing_score": 145, "tuition_kgs": 40000, "budget_seats": 20},
            {"name": "Лечебное дело", "faculty": "Медицинский",
             "field": "медицина", "passing_score": 185, "tuition_kgs": 95000, "budget_seats": 30},
            {"name": "Педагогика", "faculty": "Педагогический",
             "field": "образование", "passing_score": 125, "tuition_kgs": 35000, "budget_seats": 40},
        ],
    },
]



def seed_database():
    init_db()
    db = SessionLocal()
    try:
        if db.query(University).count() > 0:
            print("В базе уже есть вузы, пропускаю заливку. Удали data/univer.db чтобы перезалить.")
            return
        for uni_data in SEED_DATA:
            specialties_data = uni_data.pop("specialties")
            uni = University(**uni_data)
            db.add(uni)
            db.flush()
            for sp_data in specialties_data:
                db.add(Specialty(university_id=uni.id, **sp_data))
        db.commit()
        print(f"Залито {len(SEED_DATA)} вузов с их специальностями.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
