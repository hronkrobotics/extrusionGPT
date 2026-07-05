import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Lazily-initialized DB client. Returns null when DATABASE_URL is not set, so
 * the app runs fully without persistence (the engine is DB-agnostic).
 */

let db: PostgresJsDatabase<typeof schema> | null = null;
let initialized = false;

export function getDb(): PostgresJsDatabase<typeof schema> | null {
  if (!initialized) {
    initialized = true;
    const url = process.env.DATABASE_URL;
    if (url) {
      const client = postgres(url, { prepare: false });
      db = drizzle(client, { schema });
    }
  }
  return db;
}

export { schema };
