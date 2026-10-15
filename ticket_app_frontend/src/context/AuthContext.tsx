import { useCallback, useMemo, useState, type ReactNode } from "react";
import { login as loginRequest } from "@/features/auth/services/authService";
import type { User } from "@/types";
import { AuthContext, SESSION_KEY } from "./auth-context";

function readSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readSession());
  const [loading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    const loggedUser = await loginRequest({ email, password });
    setUser(loggedUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(loggedUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("ticketapp.token");
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
