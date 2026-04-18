import multer from "multer";
import { HttpError } from "../../core/http-error";

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 12,
  },
});

export function assertFilesPresent(
  files: Express.Multer.File[] | undefined,
  message: string,
) {
  if (!files?.length) {
    throw new HttpError(422, message);
  }
}

export function validateImageFiles(
  files: Express.Multer.File[],
  message = "Envie arquivos de imagem válidos.",
) {
  const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ]);

  const invalidFile = files.find((file) => !allowedMimeTypes.has(file.mimetype));

  if (invalidFile) {
    throw new HttpError(422, message);
  }
}
