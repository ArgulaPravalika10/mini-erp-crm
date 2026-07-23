import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRoute<TRequest extends Request = Request> = (
  req: TRequest,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncHandler =
  <TRequest extends Request = Request>(
    handler: AsyncRoute<TRequest>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req as TRequest, res, next)).catch(next);
  };
