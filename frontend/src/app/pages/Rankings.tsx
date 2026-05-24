import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  universityService,
  type UniversityListItem,
} from "../services/authService";
import { Trophy, Star, Users, MapPin, BookOpen, Loader2 } from "lucide-react";

export function Rankings() {
  const [universities, setUniversities] = useState<UniversityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    universityService
      .getAll()
      .then(setUniversities)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const ranked = useMemo(
    () => [...universities].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
    [universities],
  );

  const rankColor = (i: number) =>
    i === 0
      ? "text-yellow-500"
      : i === 1
        ? "text-gray-400"
        : i === 2
          ? "text-amber-600"
          : "text-gray-300";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-indigo-900 py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-yellow-400/20 rounded-full">
              <Trophy className="text-yellow-400" size={48} />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            University Rankings
          </h1>
          <p className="mt-4 text-xl text-indigo-100 max-w-2xl mx-auto">
            Top-rated institutions based on student satisfaction and academic
            excellence.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-5xl">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-600 font-medium">
              Failed to load universities
            </p>
            <p className="text-sm text-red-400 mt-1">{error}</p>
          </div>
        )}

        {/* Rankings list */}
        {!loading && !error && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-gray-100">
              {ranked.map((uni, index) => (
                <div
                  key={uni.id}
                  className="p-6 hover:bg-gray-50 transition-colors sm:flex items-center gap-6"
                >
                  {/* Rank */}
                  <div className="hidden sm:flex shrink-0 w-14 flex-col items-center justify-center">
                    <span className={`text-3xl font-black ${rankColor(index)}`}>
                      #{index + 1}
                    </span>
                  </div>

                  {/* Mobile rank + icon */}
                  <div className="flex items-center gap-4 mb-4 sm:mb-0 shrink-0">
                    <span
                      className={`sm:hidden text-2xl font-black ${rankColor(index)}`}
                    >
                      #{index + 1}
                    </span>
                    {/* Icon placeholder */}
                    <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <Trophy size={28} className={`${rankColor(index)}`} />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-0.5 truncate">
                      {uni.name}
                    </h3>
                    {uni.short_name && uni.short_name !== uni.name && (
                      <p className="text-sm text-gray-400 mb-1">
                        {uni.short_name}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                      <MapPin size={13} /> {uni.city}
                      {uni.type && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                          {uni.type}
                        </span>
                      )}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Star className="text-yellow-400" size={16} />
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {uni.rating?.toFixed(1) ?? "—"}
                          </div>
                          <div className="text-xs text-gray-500">Rating</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="text-indigo-400" size={16} />
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {uni.student_count
                              ? uni.student_count.toLocaleString()
                              : "—"}
                          </div>
                          <div className="text-xs text-gray-500">Students</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="text-green-500" size={16} />
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {uni.specialties_count ?? "—"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Specialties
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-6 sm:mt-0 shrink-0">
                    <Link
                      to={`/university/${uni.id}`}
                      className="block w-full sm:w-auto text-center px-6 py-2.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
