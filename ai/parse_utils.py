"""Утилиты для управления результатами парсинга.

ИСПОЛЬЗОВАНИЕ:
    python parse_utils.py status      — показать что в БД
    python parse_utils.py clean       — удалить вузы без специальностей
    python parse_utils.py reset       — стереть ВСЁ и начать заново
"""
import sys
from app.database import SessionLocal, init_db
from app.models.models import University, Specialty, Review, ParseLog


def show_status():
    """Показывает что сейчас в БД."""
    db = SessionLocal()
    try:
        unis = db.query(University).all()
        total_specs = db.query(Specialty).count()
        total_reviews = db.query(Review).count()

        print(f"\n📊 СТАТУС БД")
        print(f"   Вузов всего: {len(unis)}")
        print(f"   Специальностей: {total_specs}")
        print(f"   Отзывов: {total_reviews}")
        print()

        ok_unis = [u for u in unis if len(u.specialties) > 0]
        empty_unis = [u for u in unis if len(u.specialties) == 0]

        print(f"✅ Спарсены полноценно ({len(ok_unis)}):")
        for u in ok_unis:
            print(f"   • {(u.short_name or u.name[:40]):40} — {len(u.specialties)} спец., {len(u.reviews)} отзывов")

        if empty_unis:
            print(f"\n⚠️  Пустые (нет специальностей) ({len(empty_unis)}):")
            for u in empty_unis:
                print(f"   • {(u.short_name or u.name[:40]):40} — {len(u.reviews)} отзывов")
    finally:
        db.close()


def clean_empty():
    """Удаляет вузы у которых нет специальностей."""
    db = SessionLocal()
    try:
        empty = [u for u in db.query(University).all() if len(u.specialties) == 0]

        if not empty:
            print("Нет пустых вузов для удаления.")
            return

        print(f"Удалить {len(empty)} пустых вузов? Их можно будет перепарсить заново.")
        for u in empty:
            print(f"   • {u.name}")

        answer = input("\nУдалить? (yes/no): ").strip().lower()
        if answer != "yes":
            print("Отмена.")
            return

        for u in empty:
            db.delete(u)
        db.commit()
        print(f"✅ Удалено {len(empty)} вузов. Запусти parse_all.py --skip-existing чтобы добить их.")
    finally:
        db.close()


def reset_all():
    """Полная очистка БД от данных парсинга (юзеры остаются)."""
    db = SessionLocal()
    try:
        answer = input("⚠️  Удалить ВСЕ вузы, специальности, отзывы и логи? (yes/no): ").strip().lower()
        if answer != "yes":
            print("Отмена.")
            return
        db.query(Specialty).delete()
        db.query(Review).delete()
        db.query(University).delete()
        db.query(ParseLog).delete()
        db.commit()
        print("✅ База очищена. Запусти seed.py или parse_all.py.")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)
    cmd = sys.argv[1].lower()
    if cmd == "status":
        show_status()
    elif cmd == "clean":
        clean_empty()
    elif cmd == "reset":
        reset_all()
    else:
        print(f"Неизвестная команда: {cmd}")
        print(__doc__)


