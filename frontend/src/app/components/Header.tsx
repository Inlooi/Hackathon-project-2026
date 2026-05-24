// ============================================================
// src/app/components/Header.tsx
// ============================================================
import { Link, useLocation, useNavigate } from "react-router";
import {
  GraduationCap,
  User,
  Menu,
  Globe,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuthContext } from "../contexts/AuthContext";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuthContext();

  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Закрываем дропдауны при клике снаружи
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(e.target as Node)
      ) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { key: "discover", path: "/" },
    { key: "rankings", path: "/rankings" },
    { key: "saved", path: "/profile?tab=saved" },
    { key: "quiz", path: "/quiz" },
  ];

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  // Первая буква имени для аватара
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GraduationCap size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Abi2KG
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-indigo-600 ${
                  location.pathname === item.path ||
                  (item.path !== "/" &&
                    location.pathname.startsWith(item.path.split("?")[0]))
                    ? "text-indigo-600"
                    : "text-gray-600"
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language switcher */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <Globe size={16} />
                <span className="uppercase">{language}</span>
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-28 rounded-lg shadow-lg bg-white ring-1 ring-gray-200 py-1 z-50">
                  {(["en", "ru"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setLangMenuOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        language === lang
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {{ en: "English", ru: "Русский", ky: "Кыргызча" }[lang]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Авторизован ── */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white pl-1 pr-3 py-1 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:border-indigo-300"
                >
                  {/* Аватар с инициалами */}
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {initials}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.name}</span>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-lg shadow-lg bg-white ring-1 ring-gray-200 py-1 z-50">
                    {/* Инфо о пользователе */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    >
                      <User size={15} />
                      {t("myProfile")}
                    </Link>
                    <Link
                      to="/profile?tab=saved"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      {t("saved")}
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} />
                        {t("logout") ?? "Log out"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Не авторизован ── */
              <div className="flex items-center gap-2">
                <Link
                  to="/signup"
                  className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  <User size={14} />
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <User size={14} />
                  Log In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: lang toggle + burger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setLanguage(language === "en" ? "ru" : "en")}
              className="flex items-center gap-1 text-xs font-bold uppercase text-gray-600"
            >
              <Globe size={16} />
              {language}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white py-2">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-md px-3 py-2 text-base font-medium ${
                  location.pathname === item.path
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                }`}
              >
                {t(item.key)}
              </Link>
            ))}

            <div className="border-t border-gray-100 pt-3 mt-3">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t("myProfile")}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    {t("logout") ?? "Log out"}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-3">
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white"
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700"
                  >
                    Log In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
