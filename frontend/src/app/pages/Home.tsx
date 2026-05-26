import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  GraduationCap,
  Trophy,
  ArrowRight,
  Loader2,
  BookOpen,
  Star,
  Users2,
  Target,
} from "lucide-react";
import {
  universityService,
  type UniversityListItem,
  type PlatformStats,
} from "../services/authService";
import { UniversityCard } from "../components/UniversityCard";
import { Link } from "react-router";
import { useLanguage } from "../contexts/LanguageContext";
import { useSaved } from "../contexts/SavedContext";

export function Home() {
  const { t } = useLanguage();
  const { isSaved, toggle } = useSaved();

  const [universities, setUniversities] = useState<UniversityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  // Фильтры
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeLocations, setActiveLocations] = useState<string[]>([]);
  const [ortThreshold, setOrtThreshold] = useState<number | "">("");
  const [minRating, setMinRating] = useState<number>(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      universityService.getAll(),
      universityService.getStats().catch(() => null),
    ])
      .then(([unis, s]) => {
        setUniversities(unis);
        if (s) setStats(s);
        setFetchError(null);
      })
      .catch((err) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const allLocations = useMemo(() => {
    const s = new Set<string>();
    universities.forEach((u) => {
      if (u.city) s.add(u.city);
    });
    return Array.from(s).sort();
  }, [universities]);

  const allTypes = useMemo(() => {
    const s = new Set<string>();
    universities.forEach((u) => {
      if (u.type) s.add(u.type);
    });
    return Array.from(s).sort();
  }, [universities]);

  const toggleType = (v: string) =>
    setActiveTypes((p) =>
      p.includes(v) ? p.filter((x) => x !== v) : [...p, v],
    );

  const toggleLocation = (v: string) =>
    setActiveLocations((p) =>
      p.includes(v) ? p.filter((x) => x !== v) : [...p, v],
    );

  const handleToggleSave = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    toggle(id);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setActiveTypes([]);
    setActiveLocations([]);
    setOrtThreshold("");
    setMinRating(0);
  };

  const hasActiveFilters =
    activeTypes.length > 0 ||
    activeLocations.length > 0 ||
    searchQuery ||
    languageFilter ||
    fieldFilter ||
    ortThreshold !== "";

  const filteredUniversities = universities.filter((uni) => {
    // Жесткое условие: если балл введен и он меньше 110, скрываем вообще всё
    if (ortScoreFilter !== "" && Number(ortScoreFilter) < 110) {
      return false;
    }

    // Твой старый, проверенный и 100% рабочий код:
    const matchesSearch =
      uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (uni.city ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      activeFields.length === 0 || activeFields.includes(uni.type);
    const matchesLocation =
      activeLocations.length === 0 || activeLocations.includes(uni.city);
      
    return matchesSearch && matchesType && matchesLocation;
  });

  const topRanked = useMemo(
    () =>
      [...universities]
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 3),
    [universities],
  );

  const activeCount = [
    searchQuery ? 1 : 0,
    activeTypes.length,
    activeLocations.length,
    ortThreshold !== "" ? 1 : 0,
    minRating > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero */}
      <div className="bg-indigo-900 py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("findPerfectFit")}
          </h1>
          <p className="mt-6 text-xl text-indigo-100 max-w-2xl mx-auto leading-relaxed">
            {t("heroDesc")}
          </p>
          <div className="relative max-w-2xl mx-auto mt-10">
            <div className="flex items-center overflow-hidden rounded-full bg-white p-1.5 shadow-xl">
              <div className="pointer-events-none pl-5 text-gray-400">
                <Search size={22} />
              </div>
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="w-full border-0 bg-transparent px-5 py-4 text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="hidden sm:block rounded-full bg-indigo-600 px-8 py-3.5 font-bold text-white hover:bg-indigo-700">
                {t("searchButton")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                {
                  icon: GraduationCap,
                  value: stats.total_universities,
                  label: "Universities",
                  color: "text-indigo-600",
                  bg: "bg-indigo-50",
                },
                {
                  icon: BookOpen,
                  value: stats.total_specialties,
                  label: "Specialties",
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
                {
                  icon: Star,
                  value: stats.total_reviews,
                  label: "Reviews",
                  color: "text-yellow-500",
                  bg: "bg-yellow-50",
                },
                {
                  icon: Users2,
                  value: Object.keys(stats.by_city).length,
                  label: "Cities",
                  color: "text-green-600",
                  bg: "bg-green-50",
                },
              ].map(({ icon: Icon, value, label, color, bg }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50"
                >
                  <div className={`p-3 rounded-xl ${bg}`}>
                    <Icon className={color} size={22} />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900">
                      {value.toLocaleString()}+
                    </div>
                    <div className="text-sm text-gray-500">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Top-3 */}
        {!loading && topRanked.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={20} className="text-yellow-500" />
              <h2 className="text-lg font-bold text-gray-900">Top Rated</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topRanked.map((uni, i) => (
                <Link
                  key={uni.id}
                  to={`/university/${uni.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  <span
                    className={`text-2xl font-black shrink-0 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-amber-600"}`}
                  >
                    #{i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {uni.short_name || uni.name}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={11} /> {uni.city}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="ml-auto shrink-0 text-gray-300"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <SlidersHorizontal size={20} className="text-indigo-600" />
                  <h3>{t("filters")}</h3>
                  {activeCount > 0 && (
                    <span className="ml-1 text-xs font-bold bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      {activeCount}
                    </span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {t("clearAll")}
                  </button>
                )}
              </div>

              <div className="space-y-7">
                {/* ОРТ */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Target size={15} className="text-gray-400" /> Мой балл ОРТ
                  </h4>
                  <input
                    type="number"
                    min="0"
                    max="245"
                    placeholder="например 150"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={ortThreshold}
                    onChange={(e) => {
                      let v = e.target.value;
                      if (v && parseInt(v) > 245) v = "245";
                      setOrtThreshold(v === "" ? "" : parseInt(v));
                    }}
                  />
                  {ortThreshold !== "" && (
                    <p className="mt-1 text-xs text-gray-400">
                      Скрываем вузы с проходным выше твоего балла
                    </p>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* Минимальный рейтинг */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Star size={15} className="text-gray-400" /> Минимальный
                    рейтинг
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 3, 3.5, 4, 4.5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(r)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          minRating === r
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                        }`}
                      >
                        {r === 0 ? "Любой" : `${r}+`}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Город */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin size={15} className="text-gray-400" />{" "}
                    {t("locations")}
                  </h4>
                  <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                    {allLocations.map((loc) => (
                      <label
                        key={loc}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                          checked={activeLocations.includes(loc)}
                          onChange={() => toggleLocation(loc)}
                        />
                        <span className="text-sm text-gray-700 truncate">
                          {loc}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Тип */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap size={15} className="text-gray-400" /> Тип
                    вуза
                  </h4>
                  <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                    {allTypes.map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                          checked={activeTypes.includes(type)}
                          onChange={() => toggleType(type)}
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {loading ? (
                  <span className="text-gray-400">Загрузка...</span>
                ) : (
                  <>
                    {filteredUniversities.length}{" "}
                    {filteredUniversities.length === 1
                      ? t("uniFound")
                      : t("unisFound")}
                  </>
                )}
              </h2>
              {hasActiveFilters && (
                <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full">
                  Фильтры активны
                </span>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
              </div>
            )}

            {!loading && fetchError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                <p className="text-red-600 font-medium">
                  Не удалось загрузить вузы
                </p>
                <p className="text-sm text-red-400 mt-1">{fetchError}</p>
              </div>
            )}

            {!loading && !fetchError && filteredUniversities.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredUniversities.map((uni) => (
                  <UniversityCard
                    key={uni.id}
                    university={uni}
                    isSaved={isSaved(uni.id)}
                    onToggleSave={handleToggleSave}
                    userOrtScore={
                      typeof ortThreshold === "number"
                        ? ortThreshold
                        : undefined
                    }
                  />
                ))}
              </div>
            )}

            {!loading && !fetchError && filteredUniversities.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                  <Filter size={32} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  {t("noUnis")}
                </h3>
                <p className="mt-2 text-gray-400 text-sm">
                  Попробуй изменить фильтры
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-8 inline-flex rounded-lg bg-indigo-50 px-6 py-2.5 font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  {t("clearAll")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
