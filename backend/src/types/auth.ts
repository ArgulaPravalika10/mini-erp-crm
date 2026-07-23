import type { Request } from "express";

export const ROLES = ["Admin", "Sales", "Warehouse", "Accounts"] as const;

export type UserRole = (typeof ROLES)[number];

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && ROLES.includes(value as UserRole);
