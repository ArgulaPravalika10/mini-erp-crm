import { createContext } from "react";
import type { Role, User } from "../types";

export interface AuthContextValue {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (roles: Role[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
