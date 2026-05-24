// src/app/pages/Home.tsx
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
} from "lucide-react";
import {
  universityService,
  type UniversityListItem,
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

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFields, setActiveFields] = useState<string[]>([]);
  const [activeLocations, setActiveLocations] = useState<string[]>([]);
  const [ortScoreFilter, setOrtScoreFilter] = useState<number | "">("");

  useEffect(() => {
    setLoading(true);
    universityService
      .getAll()
      .then((data) => {
        setUniversities(data);
        setFetchError(null);
      })
      .catch((err) => setFetchError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    universities.forEach((u) => {
      if (u.city) locs.add(u.city);
    });
    return Array.from(locs).sort();
  }, [universities]);

  const allTypes = useMemo(() => {
    const types = new Set<string>();
    universities.forEach((u) => {
      if (u.type) types.add(u.type);
    });
    return Array.from(types).sort();
  }, [universities]);

  const toggleField = (f: string) =>
    setActiveFields((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );

  const toggleLocation = (l: string) =>
    setActiveLocations((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
    );

  // onToggleSave принимает (id: number, e: MouseEvent)
  const handleToggleSave = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    toggle(id);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setActiveFields([]);
    setActiveLocations([]);
    setOrtScoreFilter("");
  };

  const filteredUniversities = universities.filter((uni) => {
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

      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Топ-3 */}
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
          {/* Filters */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <SlidersHorizontal size={20} className="text-indigo-600" />
                  <h3>{t("filters")}</h3>
                </div>
                {(activeFields.length > 0 ||
                  activeLocations.length > 0 ||
                  searchQuery) && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {t("clearAll")}
                  </button>
                )}
              </div>
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Target size={16} className="text-gray-400" />{" "}
                    {t("myOrtScore")}
                  </h4>
                  <input
                    type="number"
                    min="0"
                    max="245"
                    placeholder="Out of 245"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={ortScoreFilter}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val !== "" && parseInt(val) > 245) val = "245";
                      setOrtScoreFilter(val === "" ? "" : parseInt(val));
                    }}
                  />
                </div>
                <hr className="border-gray-100" />
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400" />{" "}
                    {t("locations")}
                  </h4>
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-2">
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
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap size={16} className="text-gray-400" /> Type
                  </h4>
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-2">
                    {allTypes.map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                          checked={activeFields.includes(type)}
                          onChange={() => toggleField(type)}
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
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {loading ? (
                  <span className="text-gray-400">Loading...</span>
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
                  Failed to load universities
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
                    isSaved={isSaved(uni.id)} // ← из контекста
                    onToggleSave={handleToggleSave} // ← сохраняет в localStorage
                    userOrtScore={
                      typeof ortScoreFilter === "number"
                        ? ortScoreFilter
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
