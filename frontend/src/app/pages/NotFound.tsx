import { Link } from "react-router";
import { GraduationCap } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="p-5 bg-indigo-100 rounded-full mb-6">
        <GraduationCap className="text-indigo-600" size={48} />
      </div>
      <h1 className="text-8xl font-black text-indigo-600 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Страница не найдена</h2>
      <p className="text-gray-500 max-w-sm mb-8">
        Такой страницы не существует. Возможно, она была удалена или ты ввёл неверный адрес.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-3 font-bold text-white hover:bg-indigo-700 hover:-translate-y-0.5 transition-all shadow-lg shadow-indigo-600/20"
      >
        На главную
      </Link>
    </div>
  );
}
