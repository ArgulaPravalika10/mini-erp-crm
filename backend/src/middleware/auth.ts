import type { NextFunction, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/db";
import type { AuthenticatedRequest, AuthUser, UserRole } from "../types/auth";
import { AppError } from "../utils/AppError";

interface TokenPayload {
  id: number;
  email: string;
  role: UserRole;
}

export const authenticate: RequestHandler = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(401, "Authentication token is required");
    }

    const token = authHeader.slice("Bearer ".length);
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "change-this-secret",
    ) as TokenPayload;

    const result = await pool.query<AuthUser>(
      `SELECT id, name, email, role
       FROM users
       WHERE id = $1 AND is_active = true`,
      [payload.id],
    );

    if (result.rows.length === 0) {
      throw new AppError(401, "User no longer has access");
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, "Invalid token"));
  }
};

export const authorize =
  (allowedRoles: UserRole[]): RequestHandler =>
  (req: AuthenticatedRequest, _res, next) => {
    if (!req.user) {
      next(new AppError(401, "Authentication token is required"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, "You do not have permission for this action"));
      return;
    }

    next();
  };
