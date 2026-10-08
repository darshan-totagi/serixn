import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const u = new URL(dbUrl);
const poolConfig: pg.PoolConfig = {
  host: u.hostname,
  port: Number(u.port || 5432),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: decodeURIComponent(u.pathname.replace(/^\//, "")),
  max: 10,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 15000,
  statement_timeout: 30000,
};

console.log(`[db] connecting to host=${poolConfig.host} db=${poolConfig.database} user=${poolConfig.user}`);

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

export * from "./schema";
