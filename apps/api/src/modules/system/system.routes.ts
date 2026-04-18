import { Router } from "express";

export const systemRouter = Router();

systemRouter.get("/health", (_request, response) => {
  return response.status(200).json({
    status: "ok",
    service: "imobiliaria-api",
    timestamp: new Date().toISOString(),
  });
});

