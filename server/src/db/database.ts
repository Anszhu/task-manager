import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import type { EnvConfig } from "../types/domain.js";

const workspaceRoot =
  basename(process.cwd()) === "server" ? process.cwd() : resolve(process.cwd(), "server");
const schemaPath = resolve(workspaceRoot, "src", "db", "schema.sql");

export const createDatabase = (env: EnvConfig) => {
  const dbDir = dirname(env.DB_FILE);

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(env.DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(readFileSync(schemaPath, "utf8"));

  return db;
};
