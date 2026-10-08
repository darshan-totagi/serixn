import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL must be set (e.g. node --env-file=lib/db/.env ...).");

function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 5432),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, "")),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
  };
}

async function main() {
  const cfg = parseDbUrl(DATABASE_URL);
  console.log("\n🔗  Connecting to HOST:", cfg.host);
  console.log("    Database:", cfg.database, "  User:", cfg.user);

  const pool = new pg.Pool(cfg);
  const client = await pool.connect();
  try {
    const r1 = await client.query("SELECT inet_server_addr() as ip, inet_server_port() as port, version()");
    console.log("\n🖥️   Server details:");
    console.table(r1.rows);

    const r2 = await client.query("SELECT current_database() as db, current_user as usr, current_schema() as sch, current_setting('search_path') as sp");
    console.log("\n🏷️   DB identity:");
    console.table(r2.rows);

    console.log("\n🗂️   Tables in public schema:");
    const r3 = await client.query(`
      SELECT table_schema, table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.table(r3.rows.length ? r3.rows : [{ note: "0 tables — empty public schema" }]);

    console.log("\n🛠️   Creating early_access_signups table IF NOT EXISTS...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.early_access_signups (
        id              SERIAL PRIMARY KEY,
        first_name      TEXT NOT NULL,
        email           TEXT NOT NULL,
        whatsapp_number TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅  Table ensured.");

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS early_access_signups_email_unique
        ON public.early_access_signups (email);
    `);
    console.log("✅  Unique index ensured.");

    const r4 = await client.query("SELECT id, first_name, email, whatsapp_number, created_at FROM public.early_access_signups ORDER BY id DESC LIMIT 10");
    console.log("\n📋  Signups now in THIS Neon instance (ep-holy-bread-b5sty2m4):");
    console.table(r4.rows.length ? r4.rows : [{ note: "0 rows — brand new table in ep-holy-bread" }]);

    const r5 = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    console.log("\n🗂️   public schema tables AFTER migration:", r5.rows.map(r => r.table_name).join(", ") || "(empty)");
    console.log("\n🎉  Done. ep-holy-bread-b5sty2m4 Neon DB is provisioned.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("❌  FATAL:", err.message);
  process.exit(1);
});
