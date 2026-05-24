import { useState, useEffect } from "react";
import {
  ArrowRight,
  Sparkles,
  RefreshCcw,
  GraduationCap,
  History,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  universityService,
  type UniversityListItem,
  type Recommendation,
} from "../services/authService";
import { UniversityCard } from "../components/UniversityCard";
import { useAuthContext } from "../contexts/AuthContext";
import { Link } from "react-router";

// ── Types ─────────────────────────────────────────────────────
interface QuizAnswers {
  ort: string;
  budget: string;
  city: string;
  specialty: string;
  language: string;
  format: string;
  level: string;
}

interface QuizAttempt {
  id: string;
  date: string;
  answers: QuizAnswers;
  topMatches: { uniId: number; uniName: string; score: number }[];
}

// ── LocalStorage helpers ──────────────────────────────────────
function loadHistory(userId: number): QuizAttempt[] {
  try {
    const raw = localStorage.getItem(`quiz_history_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(userId: number, attempts: QuizAttempt[]) {
  localStorage.setItem(
    `quiz_history_${userId}`,
    JSON.stringify(attempts.slice(0, 10)),
  );
}

// ── Questions config ──────────────────────────────────────────
type QuestionType = "number" | "choice" | "select";

interface Question {
  id: keyof QuizAnswers;
  question: string;
  type: QuestionType;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

const QUESTIONS: Question[] = [
  {
    id: "ort",
    question: "Какой у тебя балл ОРТ?",
    type: "number",
    placeholder: "от 0 до 245",
    min: 0,
    max: 245,
  },
  {
    id: "budget",
    question: "Какой у тебя ежемесячный бюджет на обучение?",
    type: "choice",
    options: [
      "до 15 000 сом",
      "15 000–30 000 сом",
      "30 000–50 000 сом",
      "выше 50 000 сом",
      "ищу бюджетное место",
    ],
  },
  {
    id: "city",
    question: "В каком городе хочешь учиться?",
    type: "choice",
    options: ["Бишкек", "Ош", "Джалал-Абад", "Не важно"],
  },
  {
    id: "specialty",
    question: "Какую специальность хочешь изучать?",
    type: "select",
    options: [
      "IT",
      "Медицина",
      "Право",
      "Экономика",
      "Инженерия",
      "Педагогика",
      "Архитектура",
      "Дизайн",
      "Психология",
      "Журналистика",
      "Другое",
    ],
  },
  {
    id: "language",
    question: "На каком языке хочешь учиться?",
    type: "choice",
    options: ["Русский", "Кыргызский", "Английский", "Турецкий", "Не важно"],
  },
  {
    id: "format",
    question: "Какой формат обучения предпочитаешь?",
    type: "choice",
    options: ["Очно", "Заочно", "Онлайн", "Не важно"],
  },
  {
    id: "level",
    question: "Какой академический уровень тебя интересует?",
    type: "choice",
    options: ["Бакалавриат", "Магистратура", "Специалитет"],
  },
];

// ── Match calculation ─────────────────────────────────────────
function calcMatch(uni: UniversityListItem, answers: QuizAnswers) {
  let score = 0;
  const breakdown = {
    ort: false,
    budget: false,
    location: false,
    specialty: false,
  };

  // ОРТ vs rating as proxy (25 pts)
  const ort = parseInt(answers.ort ?? "0");
  if (ort > 0) {
    // Если рейтинг ≥ 4 — вуз топовый, нужен ОРТ ≥ 130
    if ((uni.rating ?? 0) >= 4 && ort >= 130) {
      score += 25;
      breakdown.ort = true;
    } else if ((uni.rating ?? 0) < 4 && ort < 130) {
      score += 25;
      breakdown.ort = true;
    } else if ((uni.rating ?? 0) < 4) {
      score += 15;
      breakdown.ort = true;
    }
  } else {
    score += 15;
    breakdown.ort = true; // не указал — не штрафуем
  }

  // Бюджет (25 pts)
  const budgetOk =
    answers.budget === "ищу бюджетное место"
      ? true // у любого вуза могут быть бюджетные места
      : answers.budget === "выше 50 000 сом"
        ? true
        : answers.budget === "30 000–50 000 сом"
          ? (uni.student_count ?? 0) > 500 // крупные вузы дешевле
          : true;
  if (budgetOk) {
    score += 25;
    breakdown.budget = true;
  }

  // Город (25 pts)
  const cityAnswer = answers.city;
  if (cityAnswer === "Не важно" || !cityAnswer) {
    score += 25;
    breakdown.location = true;
  } else if (uni.city?.toLowerCase().includes(cityAnswer.toLowerCase())) {
    score += 25;
    breakdown.location = true;
  }

  // Специальность — по количеству специальностей как прокси (25 pts)
  if ((uni.specialties_count ?? 0) >= 5) {
    score += 25;
    breakdown.specialty = true;
  } else if ((uni.specialties_count ?? 0) > 0) {
    score += 10;
    breakdown.specialty = true;
  }

  return { score: Math.min(score, 100), breakdown };
}

// ── Component ─────────────────────────────────────────────────
export function Quiz() {
  const { user, isAuthenticated } = useAuthContext();

  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    ort: "",
    budget: "",
    city: "",
    specialty: "",
    language: "",
    format: "",
    level: "",
  });
  const [inputValue, setInputValue] = useState("");
  const [showResults, setShowResults] = useState(false);

  const [universities, setUniversities] = useState<UniversityListItem[]>([]);
  const [uniLoading, setUniLoading] = useState(false);

  const [aiRecs, setAiRecs] = useState<Recommendation[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedAttempt, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (user) setHistory(loadHistory(user.id));
  }, [user]);

  const currentQ = QUESTIONS[currentStep];

  const submitAnswer = (value: string) => {
    if (!value.trim()) return;
    const newAnswers = { ...answers, [currentQ.id]: value };
    setAnswers(newAnswers);
    setInputValue("");

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };

  const handleNumberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAnswer(inputValue || "0");
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((p) => p - 1);
    else {
      setHasStarted(false);
      setCurrentStep(0);
    }
  };

  const finishQuiz = (finalAnswers: QuizAnswers) => {
    setShowResults(true);
    setUniLoading(true);
    universityService
      .getAll()
      .then((unis) => {
        setUniversities(unis);

        if (user) {
          const sorted = unis
            .map((u) => ({ ...u, ...calcMatch(u, finalAnswers) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

          const attempt: QuizAttempt = {
            id: Date.now().toString(),
            date: new Date().toLocaleString("ru-RU"),
            answers: finalAnswers,
            topMatches: sorted.map((u) => ({
              uniId: u.id,
              uniName: u.name,
              score: u.score,
            })),
          };
          const updated = [attempt, ...loadHistory(user.id)];
          saveHistory(user.id, updated);
          setHistory(updated);
        }

        if (user) {
          setAiLoading(true);
          universityService
            .getRecommendations(user.id)
            .then((data) => setAiRecs(data.recommendations))
            .catch(() => setAiRecs(null))
            .finally(() => setAiLoading(false));
        }
      })
      .catch(console.error)
      .finally(() => setUniLoading(false));
  };

  const restartQuiz = () => {
    setHasStarted(false);
    setCurrentStep(0);
    setAnswers({
      ort: "",
      budget: "",
      city: "",
      specialty: "",
      language: "",
      format: "",
      level: "",
    });
    setInputValue("");
    setShowResults(false);
    setAiRecs(null);
    setUniversities([]);
  };

  const bestMatches = showResults
    ? universities
        .map((u) => ({ ...u, ...calcMatch(u, answers) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
    : [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col pt-12 pb-24">
      <div className="container mx-auto px-4 max-w-4xl flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {/* ── Start screen ── */}
          {!hasStarted && !showHistory && (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center text-center pb-20"
            >
              <div className="inline-flex items-center justify-center p-5 bg-indigo-100 rounded-full mb-8 text-indigo-600">
                <GraduationCap size={48} />
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
                Найди свой вуз
              </h1>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                Ответь на {QUESTIONS.length} вопросов и получи персональные
                рекомендации.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => setHasStarted(true)}
                  className="inline-flex items-center gap-3 rounded-full bg-indigo-600 px-10 py-4 text-xl font-bold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                >
                  Начать квиз <ArrowRight size={24} />
                </button>
                {isAuthenticated && history.length > 0 && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <History size={20} /> История ({history.length})
                  </button>
                )}
              </div>
              {!isAuthenticated && (
                <p className="mt-6 text-sm text-gray-400 flex items-center gap-1.5">
                  <Lock size={14} />
                  <Link to="/login" className="text-indigo-500 hover:underline">
                    Войдите
                  </Link>
                  , чтобы получить AI-рекомендации и сохранить историю
                </p>
              )}
            </motion.div>
          )}

          {/* ── History screen ── */}
          {showHistory && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full mt-4"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <History className="text-indigo-600" size={28} /> История
                  квизов
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  ← Назад
                </button>
              </div>
              <div className="space-y-4">
                {history.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        setExpanded(
                          expandedAttempt === attempt.id ? null : attempt.id,
                        )
                      }
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {attempt.answers.specialty || "Квиз"}
                        </p>
                        <p className="text-sm text-gray-400">{attempt.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            restartQuiz();
                          }}
                          className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <RefreshCcw size={14} /> Пройти заново
                        </button>
                        {expandedAttempt === attempt.id ? (
                          <ChevronUp size={18} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                    {expandedAttempt === attempt.id && (
                      <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {Object.entries(attempt.answers)
                            .filter(([, v]) => v)
                            .map(([k, v]) => (
                              <span
                                key={k}
                                className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full"
                              >
                                {k}: <strong>{v}</strong>
                              </span>
                            ))}
                        </div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">
                          Топ совпадений:
                        </p>
                        <div className="space-y-2">
                          {attempt.topMatches.map((m, i) => (
                            <div
                              key={m.uniId}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-gray-700">
                                #{i + 1} {m.uniName}
                              </span>
                              <span
                                className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                                  m.score >= 80
                                    ? "bg-green-100 text-green-700"
                                    : m.score >= 50
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-50 text-red-500"
                                }`}
                              >
                                {m.score}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Questions ── */}
          {hasStarted && !showResults && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center pb-20"
            >
              {/* Progress */}
              <div className="mb-12">
                <div className="flex justify-between text-sm font-semibold text-gray-400 mb-3 px-1">
                  <span>
                    Вопрос {currentStep + 1} из {QUESTIONS.length}
                  </span>
                  <span className="text-indigo-600">
                    {Math.round((currentStep / QUESTIONS.length) * 100)}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                    style={{
                      width: `${(currentStep / QUESTIONS.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
                    {currentQ.question}
                  </h2>

                  {/* NUMBER input */}
                  {currentQ.type === "number" && (
                    <form onSubmit={handleNumberSubmit} className="relative">
                      <div className="flex items-center overflow-hidden rounded-full bg-white p-2.5 shadow-2xl ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-indigo-600 transition-all">
                        <input
                          type="number"
                          autoFocus
                          min={currentQ.min}
                          max={currentQ.max}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder={currentQ.placeholder}
                          className="w-full border-0 bg-transparent px-6 py-4 text-xl text-gray-900 placeholder:text-gray-400 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 transition-all shrink-0"
                        >
                          <ArrowRight size={24} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => submitAnswer("0")}
                        className="mt-3 text-sm text-gray-400 hover:text-gray-600 w-full text-center"
                      >
                        Пропустить →
                      </button>
                    </form>
                  )}

                  {/* CHOICE buttons */}
                  {currentQ.type === "choice" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentQ.options!.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => submitAnswer(opt)}
                          className="w-full text-left px-6 py-4 rounded-2xl bg-white border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 font-semibold text-gray-800 transition-all hover:shadow-md"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* SELECT dropdown */}
                  {currentQ.type === "select" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {currentQ.options!.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => submitAnswer(opt)}
                            className="w-full text-center px-4 py-3 rounded-2xl bg-white border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 font-semibold text-gray-800 transition-all hover:shadow-md text-sm"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Back button */}
              <button
                onClick={handleBack}
                className="mt-10 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mx-auto transition-colors"
              >
                <ChevronLeft size={16} /> Назад
              </button>
            </motion.div>
          )}

          {/* ── Results ── */}
          {showResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mt-8"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Твои лучшие совпадения
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {answers.specialty && (
                      <span>
                        Специальность: <strong>{answers.specialty}</strong>{" "}
                        ·{" "}
                      </span>
                    )}
                    {answers.city && answers.city !== "Не важно" && (
                      <span>
                        Город: <strong>{answers.city}</strong>
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={restartQuiz}
                  className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-5 py-2.5 rounded-xl transition-colors"
                >
                  <RefreshCcw size={16} /> Пройти заново
                </button>
              </div>

              {uniLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-indigo-600" size={40} />
                </div>
              ) : (
                <>
                  {/* AI recommendations */}
                  {isAuthenticated && (
                    <div className="mb-10 rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="text-indigo-600" size={20} />
                        <h3 className="font-bold text-indigo-900">
                          AI-рекомендации для тебя
                        </h3>
                      </div>
                      {aiLoading ? (
                        <div className="flex items-center gap-2 text-indigo-500 text-sm">
                          <Loader2 className="animate-spin" size={16} />{" "}
                          Генерирую персональные рекомендации...
                        </div>
                      ) : aiRecs && aiRecs.length > 0 ? (
                        <div className="space-y-3">
                          {aiRecs.slice(0, 3).map((rec, i) => (
                            <div
                              key={rec.specialty_id}
                              className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-indigo-100"
                            >
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  #{i + 1} {rec.specialty_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {rec.university_name} · {rec.field}
                                </p>
                              </div>
                              <span
                                className={`font-bold text-sm px-2.5 py-1 rounded-full ${
                                  rec.chance_percent >= 80
                                    ? "bg-green-100 text-green-700"
                                    : rec.chance_percent >= 50
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-50 text-red-500"
                                }`}
                              >
                                {rec.chance_percent}%
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-indigo-600">
                          Заполни{" "}
                          <Link
                            to="/profile"
                            className="underline font-semibold"
                          >
                            профиль с баллом ОРТ
                          </Link>
                          , чтобы получить AI-рекомендации.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Local match results */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {bestMatches.map((uni, idx) => (
                      <div key={uni.id} className="relative group">
                        {idx === 0 && (
                          <div className="absolute -top-4 -left-4 z-10 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 rotate-[-2deg] group-hover:scale-110 transition-transform">
                            <Sparkles size={16} /> #1 Совпадение
                          </div>
                        )}
                        <UniversityCard
                          university={uni}
                          matchPercent={uni.score}
                          matchBreakdown={uni.breakdown}
                        />
                        <div className="mt-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-sm">
                          <span className="font-bold block mb-1 text-indigo-800">
                            Почему подходит:
                          </span>
                          <p className="text-indigo-700/80">
                            Совпадение {uni.score}% по городу, бюджету и
                            специальности.
                            {uni.score >= 80
                              ? " Отличный выбор!"
                              : uni.score >= 50
                                ? " Хороший вариант."
                                : " Рассмотри другие опции."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
