import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env";
import type { SaveFileInput, StorageAdapter, StoredFile } from "./storage-adapter";

function sanitizeFileSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function resolveUploadRoot() {
  return path.resolve(process.cwd(), env.UPLOADS_DIR);
}

export class LocalStorageAdapter implements StorageAdapter {
  async saveFile(input: SaveFileInput): Promise<StoredFile> {
    const uploadsRoot = resolveUploadRoot();
    const targetFolder = path.join(uploadsRoot, input.folder);
    const extension = path.extname(input.originalName) || ".bin";
    const fileName = `${randomUUID()}-${sanitizeFileSegment(
      path.basename(input.originalName, extension),
    )}${extension.toLowerCase()}`;
    const absolutePath = path.join(targetFolder, fileName);

    await mkdir(targetFolder, { recursive: true });
    await writeFile(absolutePath, input.buffer);

    return {
      fileUrl: `/uploads/${input.folder}/${fileName}`.replace(/\\/g, "/"),
      fileName,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.byteLength,
    };
  }

  async deleteFile(fileUrl: string) {
    if (!fileUrl.startsWith("/uploads/")) {
      return;
    }

    const relativePath = fileUrl.replace("/uploads/", "");
    const absolutePath = path.join(resolveUploadRoot(), relativePath);
    await rm(absolutePath, { force: true });
  }
}

export const storageAdapter = new LocalStorageAdapter();
