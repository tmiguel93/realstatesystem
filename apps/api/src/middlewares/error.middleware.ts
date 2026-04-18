import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../core/http-error";
import { logger } from "../core/logger";

export function notFoundHandler(
  _request: Request,
  _response: Response,
  next: NextFunction,
) {
  next(new HttpError(404, "Recurso nao encontrado."));
}

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return response.status(422).json({
      message: "Falha de validacao.",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  logger.error(error);

  return response.status(500).json({
    message: "Erro interno do servidor.",
  });
}

