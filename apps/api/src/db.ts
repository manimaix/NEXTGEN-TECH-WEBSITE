import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export type Query = <T = Record<string, unknown>>(
  sql: string,
  params?: unknown[],
) => Promise<{ rows: T[] }>;
export interface Database {
  query: Query;
  transaction: <T>(fn: (query: Query) => Promise<T>) => Promise<T>;
  close: () => Promise<void>;
}
export async function openDatabase(location?: string): Promise<Database> {
  const sql = (
    await Promise.all(
      [
        "001-foundation.sql",
        "002-site-images.sql",
        "003-training-courses.sql",
      ].map((name) =>
        readFile(
          new URL(`../../../database/migrations/${name}`, import.meta.url),
          "utf8",
        ),
      ),
    )
  ).join("\n");
  if (location?.startsWith("postgres")) {
    const pool = new Pool({ connectionString: location, max: 5 });
    await pool.query(sql);
    return {
      query: async <T>(s: string, p?: unknown[]) => ({
        rows: (await pool.query(s, p)).rows as T[],
      }),
      transaction: async (fn) => {
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          const result = await fn(async <T>(s: string, p?: unknown[]) => ({
            rows: (await c.query(s, p)).rows as T[],
          }));
          await c.query("COMMIT");
          return result;
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      },
      close: () => pool.end(),
    };
  }
  const dataPath =
    location ??
    fileURLToPath(new URL("../../../.data/postgres", import.meta.url));
  if (!dataPath.startsWith("memory://"))
    await mkdir(dirname(dataPath), { recursive: true });
  const db = new PGlite(dataPath);
  await db.exec(sql);
  return {
    query: async <T>(s: string, p?: unknown[]) => ({
      rows: (await db.query(s, p)).rows as T[],
    }),
    transaction: (fn) =>
      db.transaction((tx) =>
        fn(async <T>(s: string, p?: unknown[]) => ({
          rows: (await tx.query(s, p)).rows as T[],
        })),
      ),
    close: () => db.close(),
  };
}
