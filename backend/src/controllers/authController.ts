import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import pool from "../config/db";
import { isUserRole } from "../types/auth";
import type { AuthenticatedRequest } from "../types/auth";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { getString } from "../utils/validation";

interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
}

const signToken = (user: {
  id: number;
  email: string;
  role: string;
}): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"];

  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "change-this-secret",
    { expiresIn },
  );
};

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const email = getString(req.body.email, "Email").toLowerCase();
  const password = getString(req.body.password, "Password");

  const result = await pool.query<UserRow>(
    `SELECT id, name, email, password, role, is_active
     FROM users
     WHERE LOWER(email) = LOWER($1)`,
    [email],
  );

  if (result.rows.length === 0) {
    throw new AppError(401, "Invalid email or password");
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new AppError(403, "This user account is disabled");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = signToken(user);

  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const registerUser = asyncHandler<AuthenticatedRequest>(
  async (req, res) => {
    const name = getString(req.body.name, "Name");
    const email = getString(req.body.email, "Email").toLowerCase();
    const password = getString(req.body.password, "Password");
    const role = req.body.role || "Sales";

    if (!isUserRole(role)) {
      throw new AppError(400, "Role must be Admin, Sales, Warehouse, or Accounts");
    }

    if (password.length < 8) {
      throw new AppError(400, "Password must be at least 8 characters");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query<{
      id: number;
      name: string;
      email: string;
      role: string;
    }>(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role],
    );

    res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0],
    });
  },
);

export const getMe = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  res.json({ user: req.user });
});
