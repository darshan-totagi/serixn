/**
 * Direct SQL migration — creates the early_access_signups table on Neon.
 * Run: node --env-file=../../lib/db/.env scripts/migrate.mjs
 * (from project root: node --env-file=lib/db/.env lib/db/scripts/migrate.mjs)
 */
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set. Check lib/db/.env");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("🔌  Connected to Neon database.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS early_access_signups (
        id           SERIAL PRIMARY KEY,
        first_name   TEXT NOT NULL,
        email        TEXT NOT NULL,
        whatsapp_number TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅  Table 'early_access_signups' is ready.");

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS early_access_signups_email_unique
        ON early_access_signups (email);
    `);
    console.log("✅  Unique index on 'email' is ready.");

    console.log("\n🎉  Migration complete — your Neon database is set up!");
  } catch (err) {
    console.error("❌  Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
