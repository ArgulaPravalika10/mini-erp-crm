import { AppError } from "./AppError";

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export const getString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(400, `${field} is required`);
  }

  return value.trim();
};

export const getOptionalString = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return String(value).trim();
};

export const getNumber = (value: unknown, field: string): number => {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new AppError(400, `${field} must be a valid number`);
  }

  return numberValue;
};

export const getPositiveInteger = (value: unknown, field: string): number => {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new AppError(400, `${field} must be a positive integer`);
  }

  return numberValue;
};

export const getNonNegativeInteger = (
  value: unknown,
  field: string,
): number => {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new AppError(400, `${field} must be a non-negative integer`);
  }

  return numberValue;
};

export const getDateOrNull = (value: unknown, field: string): string | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `${field} must be a valid date`);
  }

  return date.toISOString().slice(0, 10);
};

export const assertOneOf = <T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string,
): T[number] => {
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new AppError(400, `${field} must be one of: ${allowed.join(", ")}`);
  }

  return value as T[number];
};

export const parsePagination = (query: {
  page?: unknown;
  limit?: unknown;
}): Pagination => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};
