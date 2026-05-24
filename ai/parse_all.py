import argparse
import time
from datetime import datetime

from app.database import init_db, SessionLocal
from app.models.models import University
from app.parsers.universities_list import get_universities_list
from app.parsers.universal_parser import parse_one_university, RateLimitError


def main():
    parser = argparse.ArgumentParser(description="Массовый парсинг вузов КР")
    parser.add_argument("--limit", type=int, default=None,
                        help="Спарсить только N первых вузов (для теста)")
    parser.add_argument("--no-reviews", action="store_true",
                        help="Не генерировать отзывы")
    parser.add_argument("--skip-existing", action="store_true",
                        help="Пропустить уже спарсенные вузы")
    parser.add_argument("--start-from", type=int, default=0,
                        help="Начать с N-го вуза (если предыдущий запуск прервался)")
    parser.add_argument("--delay", type=float, default=5.0,
                        help="Задержка между вузами в секундах. По умолчанию 5 — надёжно соблюдает TPM лимит Groq")
    args = parser.parse_args()

    init_db()

    universities = get_universities_list()
    if args.limit:
        universities = universities[args.start_from:args.start_from + args.limit]
    else:
        universities = universities[args.start_from:]

    if args.skip_existing:
        db = SessionLocal()
        existing_names = {u.name for u in db.query(University).filter(University.parse_status == "ok").all()}
        db.close()
        universities = [u for u in universities if u["name"] not in existing_names]
        print(f"Пропускаю {len(existing_names)} уже спарсенных вузов")

    total = len(universities)
    print("=" * 70)
    print(f"   МАССОВЫЙ ПАРСИНГ ВУЗОВ КЫРГЫЗСТАНА (Groq)")
    print(f"   Всего к обработке: {total}")
    print(f"   Отзывы: {'НЕТ' if args.no_reviews else 'ДА'}")
    print(f"   Задержка между вузами: {args.delay}с")
    print(f"   Примерное время: {int(total * (5 if args.no_reviews else 8) / 60)} минут")
    print("=" * 70)

    if total == 0:
        print("Нечего парсить. Выход.")
        return

    started = datetime.utcnow()
    results = []
    success = 0
    partial = 0
    failed = 0

    for i, uni_meta in enumerate(universities, 1):
        print(f"\n--- [{i}/{total}] ---")
        try:
            report = parse_one_university(uni_meta, generate_reviews_flag=not args.no_reviews)
            results.append(report)
            if report["status"] == "ok":
                success += 1
            elif report["status"] == "partial":
                partial += 1
            else:
                failed += 1
        except KeyboardInterrupt:
            print("\n\n⛔ Прервано пользователем. Прогресс сохранён в БД.")
            break
        except RateLimitError:
            print("\n\n🚫 ДНЕВНОЙ лимит Groq исчерпан.")
            print("   Это очень редкая ситуация — лимит 14,400 запросов/день.")
            print("   Подожди до завтра (Pacific Time midnight) и запусти:")
            print("      python parse_all.py --skip-existing")
            break
        except Exception as e:
            print(f"   ❌❌ Критическая ошибка: {type(e).__name__}: {e}")
            failed += 1

        if i < total:
            time.sleep(args.delay)

    elapsed = (datetime.utcnow() - started).total_seconds()
    print("\n" + "=" * 70)
    print("📊 ИТОГИ ПАРСИНГА")
    print("=" * 70)
    print(f"⏱️  Время: {elapsed/60:.1f} мин")
    print(f"✅ Успешно (вуз + специальности):    {success}")
    print(f"⚠️  Частично (только базовая инфа):   {partial}")
    print(f"❌ Не удалось:                        {failed}")
    print(f"📚 Всего в БД сейчас: ", end="")

    db = SessionLocal()
    try:
        unis_in_db = db.query(University).count()
        from app.models.models import Specialty, Review
        specs_in_db = db.query(Specialty).count()
        revs_in_db = db.query(Review).count()
        print(f"{unis_in_db} вузов, {specs_in_db} специальностей, {revs_in_db} отзывов")
    finally:
        db.close()

    failed_list = [r for r in results if r["status"] == "failed"]
    if failed_list:
        print("\n❌ Не удалось спарсить:")
        for r in failed_list:
            print(f"   • {r['name']}: {r.get('error', '—')}")
        print("\nЭто нормально - у некоторых вузов сайты лежат или защищены от ботов.")


if __name__ == "__main__":
    main()
