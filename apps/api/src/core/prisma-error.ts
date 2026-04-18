import { Prisma } from "@prisma/client";
import { HttpError } from "./http-error";

export function rethrowPrismaError(error: unknown, fallbackMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new HttpError(409, "Ja existe um registro com estes dados.");
    }

    if (error.code === "P2025") {
      throw new HttpError(404, "Registro nao encontrado.");
    }
  }

  throw error instanceof Error ? error : new HttpError(500, fallbackMessage);
}

