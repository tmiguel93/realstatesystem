export type SaveFileInput = {
  folder: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
};

export type StoredFile = {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export interface StorageAdapter {
  saveFile(input: SaveFileInput): Promise<StoredFile>;
  deleteFile(fileUrl: string): Promise<void>;
}
