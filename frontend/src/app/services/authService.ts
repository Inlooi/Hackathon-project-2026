/// <reference types="vite/client" />

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  name: string;
  email: string;
}

export interface UserProfile {
  user_id: number;
  ort_score: number | null;
  gpa: number | null;
  budget_kgs: number | null;
  city: string | null;
  target_field: string | null;
  interests: string[] | null;
  languages: string[] | null;
  updated_at: string;
}

export interface UniversityListItem {
  id: number;
  name: string;
  short_name: string;
  type: string;
  city: string;
  website: string;
  founded_year: number;
  student_count: number;
  rating: number;
  specialties_count: number;
  reviews_count: number;
  parse_status: string;
}

export interface Specialty {
  id: number;
  name: string;
  faculty: string;
  field: string;
  passing_score: number;
  tuition_kgs: number;
  budget_seats: number;
  language_of_instruction: string;
}

export interface UniReview {
  id: number;
  author: string;
  rating: number;
  content: string;
  pros: string;
  cons: string;
  sentiment: string;
  source: string;
  created_at: string;
}

export interface UniversityDetail extends UniversityListItem {
  description: string;
  specialties: Specialty[];
  reviews: UniReview[];
  parsed_at: string;
}

export interface Recommendation {
  specialty_id: number;
  specialty_name: string;
  university_name: string;
  field: string;
  chance_percent: number;
  passing_score: number;
  tuition_kgs: number;
  budget_seats: number;
  reasoning: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

function authHeaders(): Record<string, string> {
  const token = tokenStorage.get();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const authService = {
  register: (payload: RegisterPayload): Promise<AuthResponse> =>
    fetch(`${BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handleResponse<AuthResponse>),

  login: (payload: LoginPayload): Promise<AuthResponse> =>
    fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handleResponse<AuthResponse>),

  // ИСПРАВЛЕНО: добавлен дженерик
  getMe: (): Promise<{ id: number; name: string; email: string }> =>
    fetch(`${BASE_URL}/users/me`, { headers: authHeaders() }).then(
      handleResponse<{ id: number; name: string; email: string }>,
    ),

  getProfile: (userId: number): Promise<UserProfile> =>
    fetch(`${BASE_URL}/users/${userId}/profile`, {
      headers: authHeaders(),
    }).then(handleResponse<UserProfile>),

  updateProfile: (
    userId: number,
    data: Partial<UserProfile>,
  ): Promise<UserProfile> =>
    fetch(`${BASE_URL}/users/${userId}/profile`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse<UserProfile>),
};

export const universityService = {
  getAll: (params?: {
    city?: string;
    type?: string;
  }): Promise<UniversityListItem[]> => {
    const query = new URLSearchParams();
    if (params?.city) query.set("city", params.city);
    if (params?.type) query.set("type", params.type);
    return fetch(`${BASE_URL}/universities?${query}`, {
      headers: authHeaders(),
    }).then(handleResponse<UniversityListItem[]>);
  },

  getById: (id: number): Promise<UniversityDetail> =>
    fetch(`${BASE_URL}/universities/${id}`, { headers: authHeaders() }).then(
      handleResponse<UniversityDetail>,
    ),

  getRecommendations: (
    userId: number,
  ): Promise<{ recommendations: Recommendation[] }> =>
    fetch(`${BASE_URL}/recommendations/${userId}`, {
      headers: authHeaders(),
    }).then(handleResponse<{ recommendations: Recommendation[] }>),
};

export const chatService = {
  // ИСПРАВЛЕНО: добавлен дженерик
  sendMessage: (
    userId: number,
    message: string,
  ): Promise<{ reply: string; message_id: number }> =>
    fetch(`${BASE_URL}/chat/message`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ user_id: userId, message }),
    }).then(handleResponse<{ reply: string; message_id: number }>),

  getHistory: (userId: number): Promise<unknown> =>
    fetch(`${BASE_URL}/chat/history/${userId}`, {
      headers: authHeaders(),
    }).then(handleResponse<unknown>),

  clearHistory: (userId: number): Promise<unknown> =>
    fetch(`${BASE_URL}/chat/history/${userId}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(handleResponse<unknown>),
};

export const tokenStorage = {
  set: (token: string) => localStorage.setItem("access_token", token),
  get: () => localStorage.getItem("access_token"),
  remove: () => localStorage.removeItem("access_token"),
};
