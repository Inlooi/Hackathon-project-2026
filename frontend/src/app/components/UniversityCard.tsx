import { Link } from "react-router";
import { Star, MapPin, GraduationCap, BookOpen } from "lucide-react";
import type { UniversityListItem } from "../services/authService";

interface Props {
  university: UniversityListItem;
  isSaved?: boolean;
  onToggleSave?: (id: number, e: React.MouseEvent) => void;
  userOrtScore?: number;
}

export function UniversityCard({
  university,
  isSaved = false,
  onToggleSave,
  userOrtScore,
}: Props) {
  const tuitionFormatted = university.student_count
    ? `${university.student_count.toLocaleString()} students`
    : null;

  const typeColor: Record<string, string> = {
    государственный: "bg-blue-50 text-blue-700",
    частный: "bg-purple-50 text-purple-700",
    международный: "bg-green-50 text-green-700",
  };
  const badgeClass =
    typeColor[university.type?.toLowerCase() ?? ""] ??
    "bg-gray-100 text-gray-600";

  return (
    <Link
      to={`/university/${university.id}`}
      className="group flex flex-col h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-indigo-200"
    >
      {/* Top color bar */}
      <div className="relative h-3 w-full bg-gradient-to-r from-indigo-500 to-indigo-700 shrink-0" />

      <div className="flex flex-1 flex-col p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 line-clamp-2 leading-snug">
            {university.name}
          </h3>

          {/* Save button */}
          {onToggleSave && (
            <button
              onClick={(e) => onToggleSave(university.id, e)}
              className="shrink-0 rounded-full p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isSaved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                className={isSaved ? "text-red-500" : ""}
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
          )}
        </div>

        {/* City */}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <MapPin className="mr-1.5 h-4 w-4 shrink-0" />
          <span className="truncate">{university.city}</span>
        </div>

        {/* Type badge */}
        {university.type && (
          <span
            className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${badgeClass}`}
          >
            {university.type}
          </span>
        )}

        {/* Stats */}
        <div className="mt-auto grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-gray-50 px-3 py-2 border border-gray-100">
            <div className="text-xs text-gray-400 mb-0.5">Specialties</div>
            <div className="font-bold text-gray-900 flex items-center gap-1">
              <BookOpen size={13} className="text-indigo-400" />
              {university.specialties_count ?? "—"}
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2 border border-gray-100">
            <div className="text-xs text-gray-400 mb-0.5">Students</div>
            <div className="font-bold text-gray-900 flex items-center gap-1">
              <GraduationCap size={13} className="text-indigo-400" />
              {university.student_count
                ? university.student_count.toLocaleString()
                : "—"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-500">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-gray-900 font-bold">
              {university.rating?.toFixed(1) ?? "—"}
            </span>
            <span>({university.reviews_count} reviews)</span>
          </div>
          {university.founded_year && (
            <span>Est. {university.founded_year}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
