import bcrypt from "bcryptjs";

export async function hashPassword(value: string) {
  return bcrypt.hash(value, 12);
}

export async function comparePassword(value: string, hash: string) {
  return bcrypt.compare(value, hash);
}

