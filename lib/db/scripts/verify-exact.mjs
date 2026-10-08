import pg from "pg";

const EXACT = "postgresql://neondb_owner:npg_dXi7Z0Vxjqpy@ep-holy-bread-b5sty2m4-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const u = new URL(EXACT);
const pool = new pg.Pool({
  host: u.hostname, port: Number(u.port || 5432),
  user: decodeURIComponent(u.username), password: decodeURIComponent(u.password),
  database: decodeURIComponent(u.pathname.replace(/^\//, "")),
  ssl: { rejectUnauthorized: false },
});

console.log("\n🎯  Verifying ONLY ep-holy-bread-b5sty2m4-pooler.c-7.us-east-2 host:");
console.log("    ", u.hostname, "\n");

const client = await pool.connect();
try {
  const id = await client.query("SELECT inet_server_addr() as ip, pg_backend_pid() as pid");
  console.log("Connection IP / PID:", id.rows[0]);

  const r = await client.query("SELECT id, first_name, email, whatsapp_number, created_at FROM public.early_access_signups ORDER BY id DESC");
  console.log("\n📋  Rows in public.early_access_signups (THIS exact Neon DB):\n");
  if (r.rows.length) console.table(r.rows);
  else console.log("  (0 rows — empty table, try submitting the form now)\n");

  const t = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log("🗂️   public schema tables in THIS Neon instance:", t.rows.map(r => r.table_name).join(", ") || "(none)");
} finally {
  client.release();
  await pool.end();
}
