import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentUser, login as loginRequest } from "@/features/auth/services/authService";
import { getStoredToken } from "@/services/api";
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

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      getCurrentUser()
        .then((freshUser) => {
          setUser(freshUser);
          localStorage.setItem(SESSION_KEY, JSON.stringify(freshUser));
        })
        .catch(() => {
          // Token expired or invalid
        });
    }
  }, []);

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

  const updateUserSession = useCallback((updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, updateUserSession }),
    [user, loading, login, logout, updateUserSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
