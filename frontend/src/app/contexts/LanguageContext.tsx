import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ru';

interface Translations {
  [key: string]: {
    en: string;
    ru: string;
  };
}

export const translations: Translations = {
  discover: { en: "Discover", ru: "Главная" },
  rankings: { en: "Rankings", ru: "Рейтинги" },
  saved: { en: "Saved", ru: "Сохраненные" },
  quiz: { en: "Quiz", ru: "Тест" },
  myProfile: { en: "My Profile", ru: "Мой профиль" },
  findPerfectFit: { en: "Find Your Perfect Fit", ru: "Найди свой идеальный ВУЗ" },
  heroDesc: { en: "Discover top-rated schools, compare personalized match scores, and find the right university for your future.", ru: "Откройте для себя лучшие учебные заведения, сравните персональные баллы совпадения и найдите подходящий университет для своего будущего." },
  searchPlaceholder: { en: "Search by university name or location...", ru: "Поиск по названию университета или городу..." },
  searchButton: { en: "Search", ru: "Найти" },
  filters: { en: "Filters", ru: "Фильтры" },
  clearAll: { en: "Clear all", ru: "Очистить все" },
  myOrtScore: { en: "My ORT Score", ru: "Мой балл ОРТ" },
  maxBudget: { en: "Max Budget", ru: "Макс. Бюджет" },
  locations: { en: "Locations", ru: "Локации" },
  majors: { en: "Majors", ru: "Специальности" },
  unisFound: { en: "Universities Found", ru: "Университетов найдено" },
  uniFound: { en: "University Found", ru: "Университет найден" },
  noUnis: { en: "No universities found", ru: "Университеты не найдены" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}