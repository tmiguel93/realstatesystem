import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "req.headers.referer",
    "req.headers.referrer",
    "req.headers.x-tenant-link-token",
  ],
});
