import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env";

type AccessTokenPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
};

type RefreshTokenPayload = {
  sub: string;
  sessionId: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
  const expiresIn = env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"];

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function signRefreshToken(payload: RefreshTokenPayload) {
  const expiresIn = env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"];

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn,
  });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createRandomToken(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}
