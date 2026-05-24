// src/app/contexts/SavedContext.tsx
// Хранит сохранённые вузы в localStorage.
// Когда бэкенд будет готов — заменишь localStorage на API вызовы.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuthContext } from "./AuthContext";

interface SavedContextValue {
  savedIds: Set<number>;
  isSaved: (id: number) => boolean;
  toggle: (id: number) => void;
  savedCount: number;
}

const SavedContext = createContext<SavedContextValue | null>(null);

function storageKey(userId: number) {
  return `saved_unis_${userId}`;
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  // Загружаем сохранённые вузы при входе/смене пользователя
  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(user.id));
      const ids: number[] = raw ? JSON.parse(raw) : [];
      setSavedIds(new Set(ids));
    } catch {
      setSavedIds(new Set());
    }
  }, [user]);

  // Сохраняем в localStorage при каждом изменении
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(
      storageKey(user.id),
      JSON.stringify(Array.from(savedIds))
    );
  }, [savedIds, user]);

  const toggle = (id: number) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isSaved = (id: number) => savedIds.has(id);

  return (
    <SavedContext.Provider value={{ savedIds, isSaved, toggle, savedCount: savedIds.size }}>
      {children}
    </SavedContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used inside <SavedProvider>");
  return ctx;
}
