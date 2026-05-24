// src/app/pages/Profile.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useAuthContext } from "../contexts/AuthContext";
import { useSaved } from "../contexts/SavedContext";
import {
  universityService,
  authService,
  type UniversityListItem,
} from "../services/authService";
import { UniversityCard } from "../components/UniversityCard";
import {
  Settings,
  Bookmark,
  GraduationCap,
  MapPin,
  Target,
  Heart,
  Languages,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const DEFAULT_BUDGET = 30000;

export function Profile() {
  const { user, isAuthenticated } = useAuthContext();
  const { savedIds, isSaved, toggle } = useSaved();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "preferences";

  // Форма профиля
  const [fields, setFields] = useState({
    ortScore: "",
    gpa: "",
    budget: DEFAULT_BUDGET,
    city: "",
    targetField: "",
    interests: "",
    languages: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ text: string; ok: boolean } | null>(
    null,
  );

  // Сохранённые вузы
  const [allUniversities, setAllUniversities] = useState<UniversityListItem[]>(
    [],
  );
  const [unisLoading, setUnisLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  // Загружаем профиль
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    authService
      .getProfile(user.id)
      .then((data) => {
        setFields({
          ortScore: data.ort_score?.toString() ?? "",
          gpa: data.gpa?.toString() ?? "",
          budget: data.budget_kgs ?? DEFAULT_BUDGET,
          city: data.city ?? "",
          targetField: data.target_field ?? "",
          interests: data.interests?.join(", ") ?? "",
          languages: data.languages?.join(", ") ?? "",
        });
      })
      .catch(() => {
        /* профиль ещё не создан — ok */
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Загружаем все вузы когда открывается вкладка "saved"
  useEffect(() => {
    if (activeTab !== "saved") return;
    if (allUniversities.length > 0) return; // уже загружены
    setUnisLoading(true);
    universityService
      .getAll()
      .then(setAllUniversities)
      .catch(console.error)
      .finally(() => setUnisLoading(false));
  }, [activeTab]);

  // Фильтруем только сохранённые
  const savedUniversities = allUniversities.filter((u) => isSaved(u.id));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await authService.updateProfile(user.id, {
        ort_score: fields.ortScore ? parseInt(fields.ortScore) : null,
        gpa: fields.gpa ? parseFloat(fields.gpa) : null,
        budget_kgs: fields.budget,
        city: fields.city || null,
        target_field: fields.targetField || null,
        interests: fields.interests
          ? fields.interests
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        languages: fields.languages
          ? fields.languages
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      });
      setSaveMsg({ text: "Профиль сохранён!", ok: true });
    } catch {
      setSaveMsg({ text: "Ошибка сохранения. Попробуй ещё раз.", ok: false });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  if (!isAuthenticated) return null;

  const tabs = [
    { id: "preferences", name: "Мои данные", icon: Settings },
    {
      id: "saved",
      name: "Сохранённые вузы",
      icon: Bookmark,
      count: savedIds.size,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Profile header */}
      <div className="bg-white border-b border-gray-200 pt-10 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center shadow-md border-4 border-white">
              <span className="text-3xl font-black text-white">
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-lg text-gray-500 mt-1">{user?.email}</p>
            </div>
            <div className="sm:ml-auto flex gap-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 text-center">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  ОРТ
                </div>
                <div className="text-xl font-black text-indigo-700">
                  {fields.ortScore || "—"}
                  <span className="text-sm font-medium text-indigo-400">
                    /245
                  </span>
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 text-center">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  GPA
                </div>
                <div className="text-xl font-black text-indigo-700">
                  {fields.gpa ? parseFloat(fields.gpa).toFixed(1) : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 -mt-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar nav */}
          <div className="w-full md:w-64 shrink-0">
            <nav className="flex flex-col space-y-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
              {tabs.map(({ id, name, icon: Icon, count }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSearchParams({ tab: id })}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? "text-indigo-700" : "text-gray-400"}
                    />
                    <span className="flex-1 text-left">{name}</span>
                    {count !== undefined && count > 0 && (
                      <span className="rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {/* ── Preferences tab ── */}
            {activeTab === "preferences" && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-6 sm:px-8 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Мои данные
                  </h2>
                  <p className="mt-1 text-gray-500">
                    Заполни — ИИ подберёт подходящие вузы.
                  </p>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2
                      className="animate-spin text-indigo-600"
                      size={32}
                    />
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-10">
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <GraduationCap className="text-indigo-600" size={20} />{" "}
                        Академический профиль
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Балл ОРТ (макс. 245)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="245"
                            placeholder="например 180"
                            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={fields.ortScore}
                            onChange={(e) => {
                              let v = e.target.value;
                              if (v && parseInt(v) > 245) v = "245";
                              setFields({ ...fields, ortScore: v });
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            GPA{" "}
                            <span className="text-gray-400 font-normal">
                              (необязательно)
                            </span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="4"
                            step="0.01"
                            placeholder="например 3.8"
                            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={fields.gpa}
                            onChange={(e) => {
                              let v = e.target.value;
                              if (v && parseFloat(v) > 4) v = "4";
                              setFields({ ...fields, gpa: v });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Target className="text-indigo-600" size={20} />{" "}
                        Предпочтения
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Желаемая специальность
                          </label>
                          <input
                            type="text"
                            placeholder="например Информатика"
                            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={fields.targetField}
                            onChange={(e) =>
                              setFields({
                                ...fields,
                                targetField: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                            <MapPin size={16} className="text-gray-400" /> Город
                          </label>
                          <input
                            type="text"
                            placeholder="например Бишкек"
                            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={fields.city}
                            onChange={(e) =>
                              setFields({ ...fields, city: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Максимальный годовой бюджет (сом)
                        </label>
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <input
                            type="range"
                            min="10000"
                            max="200000"
                            step="5000"
                            value={fields.budget}
                            onChange={(e) =>
                              setFields({
                                ...fields,
                                budget: parseInt(e.target.value),
                              })
                            }
                            className="w-full accent-indigo-600"
                          />
                          <span className="font-bold text-gray-900 bg-white px-3 py-1 rounded shadow-sm border border-gray-200 whitespace-nowrap">
                            {fields.budget.toLocaleString()} сом
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Heart className="text-indigo-600" size={20} /> О себе
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Интересы (через запятую)
                        </label>
                        <input
                          type="text"
                          placeholder="например Технологии, Медицина"
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={fields.interests}
                          onChange={(e) =>
                            setFields({ ...fields, interests: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                          <Languages size={16} className="text-gray-400" />{" "}
                          Языки (через запятую)
                        </label>
                        <input
                          type="text"
                          placeholder="например Русский, Кыргызский"
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={fields.languages}
                          onChange={(e) =>
                            setFields({ ...fields, languages: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex items-center gap-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center gap-2"
                      >
                        {saving && (
                          <Loader2 className="animate-spin" size={16} />
                        )}
                        Сохранить
                      </button>
                      {saveMsg && (
                        <span
                          className={`flex items-center gap-1.5 text-sm font-medium ${saveMsg.ok ? "text-green-600" : "text-red-600"}`}
                        >
                          {saveMsg.ok ? (
                            <CheckCircle size={15} />
                          ) : (
                            <AlertCircle size={15} />
                          )}
                          {saveMsg.text}
                        </span>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ── Saved tab ── */}
            {activeTab === "saved" && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="mb-6 border-b border-gray-100 pb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Сохранённые вузы
                    </h2>
                    <p className="mt-1 text-gray-500">
                      Вузы, которые тебя заинтересовали.
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                    {savedIds.size} сохранено
                  </span>
                </div>

                {unisLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2
                      className="animate-spin text-indigo-600"
                      size={32}
                    />
                  </div>
                ) : savedUniversities.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {savedUniversities.map((uni) => (
                      <UniversityCard
                        key={uni.id}
                        university={uni}
                        isSaved={true}
                        onToggleSave={(id, e) => {
                          e.preventDefault();
                          toggle(id);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bookmark
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <h3 className="text-lg font-medium text-gray-900">
                      Нет сохранённых вузов
                    </h3>
                    <p className="mt-2 text-gray-500">
                      Нажми на сердечко{" "}
                      <Heart size={14} className="inline text-red-400" /> на
                      карточке вуза, чтобы сохранить его сюда.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
