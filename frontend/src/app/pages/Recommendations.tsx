import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  Sparkles,
  GraduationCap,
  Loader2,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import {
  universityService,
  type Recommendation,
} from "../services/authService";
import { useAuthContext } from "../contexts/AuthContext";

export function Recommendations() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuthContext();

  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    universityService
      .getRecommendations(Number(userId))
      .then((data) => {
        setRecs(data.recommendations);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const chanceColor = (pct: number) =>
    pct >= 75
      ? "bg-green-100 text-green-700 border-green-200"
      : pct >= 50
        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
        : "bg-red-50 text-red-500 border-red-200";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-indigo-900 py-14 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center mb-6 text-sm font-medium text-indigo-200 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} className="mr-1" /> Назад
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Sparkles className="text-yellow-400" size={32} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                Мои рекомендации
              </h1>
              <p className="text-indigo-200 mt-1">
                {user?.name
                  ? `Персональные рекомендации для ${user.name.split(" ")[0]}`
                  : "Персональные рекомендации на основе твоего профиля"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <AlertCircle className="mx-auto text-red-400 mb-3" size={36} />
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-sm text-red-400 mt-2">
              Заполни{" "}
              <Link to="/profile" className="underline font-semibold">
                профиль с баллом ОРТ
              </Link>{" "}
              — тогда ИИ сможет подобрать специальности.
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && recs.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <GraduationCap className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Рекомендаций пока нет
            </h3>
            <p className="text-gray-500 mb-6">
              Заполни профиль с баллом ОРТ, бюджетом и желаемой специальностью —
              и ИИ подберёт подходящие варианты.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
            >
              <GraduationCap size={16} /> Заполнить профиль
            </Link>
          </div>
        )}

        {/* Results */}
        {!loading && !error && recs.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-6">
              Найдено <strong>{recs.length}</strong> специальностей,
              отсортированных по шансу поступления
            </p>
            <div className="space-y-4">
              {recs.map((rec, i) => (
                <div
                  key={rec.specialty_id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Rank */}
                      <span
                        className={`shrink-0 text-lg font-black ${
                          i === 0
                            ? "text-yellow-500"
                            : i === 1
                              ? "text-gray-400"
                              : i === 2
                                ? "text-amber-600"
                                : "text-gray-300"
                        }`}
                      >
                        #{i + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {rec.specialty_name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {rec.university_name}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {rec.field && (
                            <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full px-2 py-0.5">
                              {rec.field}
                            </span>
                          )}
                          {rec.passing_score > 0 && (
                            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                              ОРТ {rec.passing_score}+
                            </span>
                          )}
                          {rec.tuition_kgs > 0 && (
                            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                              {rec.tuition_kgs.toLocaleString()} сом/год
                            </span>
                          )}
                          {rec.budget_seats > 0 && (
                            <span className="text-xs bg-green-50 text-green-700 rounded-full px-2 py-0.5">
                              {rec.budget_seats} бюдж. мест
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Chance */}
                    <div
                      className={`shrink-0 text-center px-4 py-2 rounded-xl border font-bold ${chanceColor(rec.chance_percent)}`}
                    >
                      <div className="text-2xl">{rec.chance_percent}%</div>
                      <div className="text-xs font-medium opacity-70">шанс</div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  {rec.reasoning && (
                    <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                      <span className="font-semibold text-gray-700">
                        Почему:{" "}
                      </span>
                      {rec.reasoning}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
