// src/app/pages/UniversityDetail.tsx
import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import {
  Star,
  MapPin,
  Users,
  ChevronLeft,
  Heart,
  BookOpen,
  Loader2,
  ExternalLink,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  universityService,
  type UniversityDetail as UniDetail,
  type Specialty,
} from "../services/authService";
import { useAuthContext } from "../contexts/AuthContext";
import { useSaved } from "../contexts/SavedContext";

export function UniversityDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const { isSaved, toggle } = useSaved();

  const [university, setUniversity] = useState<UniDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"specialties" | "reviews">(
    "specialties",
  );

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    universityService
      .getById(Number(id))
      .then((data) => {
        setUniversity(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 className="animate-spin" size={40} />
        <p>Loading university...</p>
      </div>
    );
  }

  if (error || !university) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">
          University not found
        </h2>
        <p className="text-gray-500">{error}</p>
        <Link
          to="/"
          className="mt-2 text-indigo-600 hover:underline flex items-center gap-1"
        >
          <ChevronLeft size={16} /> Return to search
        </Link>
      </div>
    );
  }

  const saved = isSaved(university.id);

  const sentimentColor = (s: string) => {
    if (s === "positive") return "text-green-600";
    if (s === "negative") return "text-red-500";
    return "text-gray-500";
  };

  const avgRating =
    university.reviews.length > 0
      ? (
          university.reviews.reduce((s, r) => s + r.rating, 0) /
          university.reviews.length
        ).toFixed(1)
      : (university.rating?.toFixed(1) ?? "—");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero */}
      <div className="relative bg-indigo-900 py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link
            to="/"
            className="inline-flex items-center mb-8 text-sm font-medium text-indigo-200 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} className="mr-1" /> Back to Search
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              {university.type && (
                <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white mb-3">
                  {university.type}
                </span>
              )}
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {university.name}
              </h1>
              {university.short_name &&
                university.short_name !== university.name && (
                  <p className="text-indigo-200 mt-1 text-lg">
                    {university.short_name}
                  </p>
                )}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-indigo-200">
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="opacity-70" />
                  <span>{university.city}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
                  <Star size={15} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-white">{avgRating}</span>
                  <span className="text-indigo-200">
                    ({university.reviews_count} reviews)
                  </span>
                </div>
                {university.website && (
                  <a
                    href={university.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-indigo-200 hover:text-white transition-colors"
                  >
                    <ExternalLink size={14} /> Website
                  </a>
                )}
              </div>
            </div>

            {/* Кнопка Save — теперь реально сохраняет */}
            <button
              onClick={() => toggle(university.id)}
              className={`flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-colors whitespace-nowrap ${
                saved
                  ? "bg-white text-gray-900 hover:bg-gray-100"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              <Heart
                size={20}
                className={saved ? "fill-red-500 text-red-500" : ""}
              />
              {saved ? "Saved ✓" : "Save University"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pt-10 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left */}
          <div className="lg:col-span-2 space-y-8">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Overview
              </h2>
              {university.description ? (
                <p className="text-gray-600 leading-relaxed">
                  {university.description}
                </p>
              ) : (
                <p className="text-gray-400 italic">
                  No description available.
                </p>
              )}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {university.student_count > 0 && (
                  <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                    <Users className="h-5 w-5 text-indigo-600 mb-2" />
                    <div className="text-xs text-gray-500">Students</div>
                    <div className="font-semibold text-gray-900">
                      {university.student_count.toLocaleString()}
                    </div>
                  </div>
                )}
                {university.founded_year && (
                  <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                    <GraduationCap className="h-5 w-5 text-indigo-600 mb-2" />
                    <div className="text-xs text-gray-500">Founded</div>
                    <div className="font-semibold text-gray-900">
                      {university.founded_year}
                    </div>
                  </div>
                )}
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <BookOpen className="h-5 w-5 text-indigo-600 mb-2" />
                  <div className="text-xs text-gray-500">Specialties</div>
                  <div className="font-semibold text-gray-900">
                    {university.specialties.length}
                  </div>
                </div>
              </div>
            </section>

            {/* Tabs */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100">
                {(["specialties", "reviews"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors capitalize ${
                      activeTab === tab
                        ? "text-indigo-600 border-b-2 border-indigo-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab} (
                    {tab === "specialties"
                      ? university.specialties.length
                      : university.reviews.length}
                    )
                  </button>
                ))}
              </div>

              <div className="p-6 sm:p-8">
                {activeTab === "specialties" &&
                  (university.specialties.length > 0 ? (
                    <div className="space-y-4">
                      {university.specialties.map((sp: Specialty) => (
                        <div
                          key={sp.id}
                          className="rounded-xl border border-gray-100 bg-gray-50 p-4 hover:border-indigo-200 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {sp.name}
                            </h3>
                            <span className="shrink-0 text-sm font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-indigo-100">
                              {sp.tuition_kgs
                                ? `${sp.tuition_kgs.toLocaleString()} сом`
                                : "—"}
                            </span>
                          </div>
                          {sp.faculty && (
                            <p className="text-sm text-gray-500 mb-3">
                              {sp.faculty}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs">
                            {sp.passing_score > 0 && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <CheckCircle2
                                  size={13}
                                  className="text-green-500"
                                />
                                ORT: {sp.passing_score}+
                              </span>
                            )}
                            {sp.budget_seats > 0 && (
                              <span className="flex items-center gap-1 text-gray-600">
                                <GraduationCap
                                  size={13}
                                  className="text-indigo-500"
                                />
                                {sp.budget_seats} budget seats
                              </span>
                            )}
                            {sp.language_of_instruction && (
                              <span className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                                {sp.language_of_instruction}
                              </span>
                            )}
                            {sp.field && (
                              <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full px-2 py-0.5">
                                {sp.field}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8">
                      No specialties available yet.
                    </p>
                  ))}

                {activeTab === "reviews" &&
                  (university.reviews.length > 0 ? (
                    <div className="space-y-6">
                      {university.reviews.map((review) => (
                        <div
                          key={review.id}
                          className="border-b border-gray-100 last:border-0 pb-6 last:pb-0"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-gray-900">
                              {review.author || "Anonymous"}
                            </div>
                            <div className="flex items-center gap-2">
                              {review.sentiment && (
                                <span
                                  className={`text-xs font-medium ${sentimentColor(review.sentiment)}`}
                                >
                                  {review.sentiment}
                                </span>
                              )}
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={14}
                                    className={
                                      i < review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-200"
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          {review.content && (
                            <p className="text-gray-600 text-sm">
                              {review.content}
                            </p>
                          )}
                          {(review.pros || review.cons) && (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {review.pros && (
                                <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-2">
                                  <CheckCircle2
                                    size={13}
                                    className="shrink-0 mt-0.5"
                                  />
                                  <span>{review.pros}</span>
                                </div>
                              )}
                              {review.cons && (
                                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                                  <AlertCircle
                                    size={13}
                                    className="shrink-0 mt-0.5"
                                  />
                                  <span>{review.cons}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {review.source && (
                            <p className="mt-2 text-xs text-gray-400">
                              Source: {review.source}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-8">
                      No reviews yet.
                    </p>
                  ))}
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sticky top-24 space-y-5">
              <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">
                Quick Info
              </h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">City</span>
                  <span className="font-medium text-gray-900">
                    {university.city}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900">
                    {university.type ?? "—"}
                  </span>
                </div>
                {university.founded_year && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Founded</span>
                    <span className="font-medium text-gray-900">
                      {university.founded_year}
                    </span>
                  </div>
                )}
                {university.student_count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Students</span>
                    <span className="font-medium text-gray-900">
                      {university.student_count.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Rating</span>
                  <span className="font-bold text-indigo-600 flex items-center gap-1">
                    <Star
                      size={14}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    {avgRating}
                  </span>
                </div>
              </div>

              {user && (
                <div className="pt-4 border-t border-gray-100">
                  <Link
                    to={`/recommendations/${user.id}`}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    <GraduationCap size={16} />
                    View My Recommendations
                  </Link>
                </div>
              )}

              {university.website && (
                <a
                  href={university.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink size={16} />
                  Official Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
