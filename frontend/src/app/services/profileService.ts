// ============================================================
// profileService.ts — GET и PUT профиля пользователя
// ============================================================
import { tokenStorage } from "./authService";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface ProfileData {
  ort_score: number | null;
  gpa: number | null;
  budget_kgs: number | null;
  city: string | null;
  target_field: string | null;
  interests: string[] | null;
  languages: string[] | null;
}

export interface ProfileOut extends ProfileData {
  user_id: number;
  updated_at: string;
}

function authHeaders() {
  const token = tokenStorage.get();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Ошибка сервера" }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const profileService = {
  get: (userId: string | number): Promise<ProfileOut> =>
    fetch(`${BASE_URL}/users/${userId}/profile`, {
      headers: authHeaders(),
    }).then(handleResponse<ProfileOut>),

  save: (userId: string | number, data: ProfileData): Promise<ProfileOut> =>
    fetch(`${BASE_URL}/users/${userId}/profile`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<ProfileOut>),
};
