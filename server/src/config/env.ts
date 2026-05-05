import "dotenv/config";
import { basename, resolve } from "node:path";
import type { EnvConfig } from "../types/domain.js";

const workspaceRoot =
  basename(process.cwd()) === "server" ? process.cwd() : resolve(process.cwd(), "server");
const defaultDbPath = resolve(workspaceRoot, "data", "team-task-manager.sqlite");

export const loadEnv = (overrides: Partial<EnvConfig> = {}): EnvConfig => {
  const NODE_ENV = overrides.NODE_ENV ?? process.env.NODE_ENV ?? "development";
  const PORT = Number(overrides.PORT ?? process.env.PORT ?? 4300);
  const JWT_SECRET =
    overrides.JWT_SECRET ??
    process.env.JWT_SECRET ??
    (NODE_ENV === "production" ? "" : "development-only-secret-change-me");
  const JWT_EXPIRES_IN = overrides.JWT_EXPIRES_IN ?? process.env.JWT_EXPIRES_IN ?? "12h";
  const CLIENT_ORIGINS = (
    overrides.CLIENT_ORIGINS ??
    process.env.CLIENT_ORIGINS?.split(",").map((item) => item.trim()).filter(Boolean) ?? [
      "http://127.0.0.1:4301",
      "http://localhost:4301"
    ]
  ) as string[];
  const DB_FILE = overrides.DB_FILE ?? process.env.DB_FILE ?? defaultDbPath;

  if (!Number.isFinite(PORT) || PORT < 0) {
    throw new Error("PORT must be a valid non-negative number.");
  }

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured in production.");
  }

  return {
    NODE_ENV,
    PORT,
    CLIENT_ORIGINS,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    DB_FILE
  };
};
