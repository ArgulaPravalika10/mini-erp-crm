import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import API from "../services/api";
import type { User } from "../types";
import { AuthContext } from "./authState";
import type { AuthContextValue } from "./authState";

interface LoginResponse {
  token: string;
  user: User;
}

const readStoredUser = (): User | null => {
  const stored = localStorage.getItem("miniErpUser");

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as User;
  } catch {
    localStorage.removeItem("miniErpUser");
    localStorage.removeItem("miniErpToken");
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("miniErpToken"),
  );
  const [user, setUser] = useState<User | null>(() => readStoredUser());

  const login = async (email: string, password: string) => {
    const response = await API.post<LoginResponse>("/api/auth/login", {
      email,
      password,
    });

    localStorage.setItem("miniErpToken", response.data.token);
    localStorage.setItem("miniErpUser", JSON.stringify(response.data.user));
    setToken(response.data.token);
    setUser(response.data.user);
  };

  const logout = () => {
    localStorage.removeItem("miniErpToken");
    localStorage.removeItem("miniErpUser");
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      login,
      logout,
      can: (roles) => Boolean(user && roles.includes(user.role)),
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
