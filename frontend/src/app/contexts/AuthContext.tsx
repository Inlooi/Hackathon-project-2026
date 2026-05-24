import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService, tokenStorage } from "../services/authService";
import type { RegisterPayload, LoginPayload } from "../services/authService";

// Бэкенд возвращает: { user_id: number, name: string, email: string, access_token: string }
// Мы храним в удобном виде:
export interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Восстанавливаем сессию при загрузке страницы
  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored && tokenStorage.get()) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
  }, []);

  // Хелпер: маппим ответ бэкенда → User и сохраняем
  const saveSession = (data: {
    access_token: string;
    user_id: number;
    name: string;
    email: string;
  }) => {
    const user: User = {
      id: data.user_id, // бэкенд: user_id
      name: data.name, // бэкенд: name (не full_name!)
      email: data.email,
    };
    tokenStorage.set(data.access_token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    setUser(user);
  };

  const register = async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(payload);
      saveSession(data); // ← правильный маппинг
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(payload);
      saveSession(data); // ← правильный маппинг
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Invalid email or password";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    tokenStorage.remove();
    localStorage.removeItem("auth_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        setError,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}
