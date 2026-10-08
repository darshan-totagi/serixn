import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const { rows } = await pool.query(
  "SELECT id, first_name, email, whatsapp_number, created_at FROM early_access_signups ORDER BY id DESC LIMIT 10"
);
console.log("\n📋  Latest signups in Neon:\n");
console.table(rows);
await pool.end();
