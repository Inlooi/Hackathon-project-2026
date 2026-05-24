// US-03: расширенные фильтры  US-09: статистика на главной
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  GraduationCap,
  Target,
  Trophy,
  ArrowRight,
  Loader2,
  BookOpen,
  Star,
  Users2,
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
import { useAuthContext } from "../contexts/AuthContext";

export function Home() {
  const { t } = useLanguage();
  const { isSaved, toggle } = useSaved();
  const { user } = useAuthContext();

  const [universities, setUniversities] = useState<UniversityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // US-09: platform stats
  const [stats, setStats] = useState<PlatformStats | null>(null);

  // US-03: расширенные фильтры
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeLocations, setActiveLocations] = useState<string[]>([]);
  const [maxBudget, setMaxBudget] = useState<number>(200000);
  const [ortThreshold, setOrtThreshold] = useState<number | "">("");
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [fieldFilter, setFieldFilter] = useState<string>("");

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
    setMaxBudget(200000);
    setOrtThreshold("");
    setLanguageFilter("");
    setFieldFilter("");
  };

  const hasActiveFilters =
    activeTypes.length > 0 ||
    activeLocations.length > 0 ||
    searchQuery ||
    languageFilter ||
    fieldFilter ||
    ortThreshold !== "";

  const filteredUniversities = universities.filter((uni) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !uni.name.toLowerCase().includes(q) &&
        !(uni.city ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    if (activeTypes.length > 0 && !activeTypes.includes(uni.type)) return false;
    if (activeLocations.length > 0 && !activeLocations.includes(uni.city))
      return false;
    return true;
  });

  const topRanked = useMemo(
    () =>
      [...universities]
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 3),
    [universities],
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Hero ── */}
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

      {/* ── US-09: Statistics block ── */}
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
          {/* ── US-03: Filter sidebar ── */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <SlidersHorizontal size={20} className="text-indigo-600" />
                  <h3>{t("filters")}</h3>
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
                {/* ORT threshold */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Target size={15} className="text-gray-400" /> Порог ОРТ
                  </h4>
                  <input
                    type="number"
                    min="0"
                    max="245"
                    placeholder="Мой балл ОРТ"
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
                      Показаны вузы с проходным ≤ {ortThreshold}
                    </p>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* Max budget */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3">
                    Макс. бюджет (сом/год)
                  </h4>
                  <input
                    type="range"
                    min="10000"
                    max="200000"
                    step="5000"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>10 000</span>
                    <span className="font-semibold text-indigo-600">
                      {maxBudget.toLocaleString()} сом
                    </span>
                    <span>200 000</span>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Specialty/field filter */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen size={15} className="text-gray-400" />{" "}
                    Специальность
                  </h4>
                  <input
                    type="text"
                    placeholder="Поиск по направлению..."
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={fieldFilter}
                    onChange={(e) => setFieldFilter(e.target.value)}
                  />
                </div>

                <hr className="border-gray-100" />

                {/* City */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin size={15} className="text-gray-400" />{" "}
                    {t("locations")}
                  </h4>
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
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

                {/* Type */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap size={15} className="text-gray-400" /> Тип
                    вуза
                  </h4>
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
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
