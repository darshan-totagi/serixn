import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  console.log("\n📡  Connection host:");
  console.log("   ", new URL(process.env.DATABASE_URL).host);

  console.log("\n🏷️   current_database(), current_user, current_schema:");
  const r1 = await client.query("SELECT current_database() as db, current_user as usr, current_schema() as sch, current_setting('search_path') as sp");
  console.table(r1.rows);

  console.log("\n📚  All schemas visible:");
  const r2 = await client.query("SELECT schema_name, schema_owner FROM information_schema.schemata ORDER BY schema_name");
  console.table(r2.rows);

  console.log("\n🗂️  All tables across all schemas:");
  const r3 = await client.query(`
    SELECT table_schema, table_name, table_type
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name
  `);
  console.table(r3.rows);

  for (const row of r3.rows) {
    const q = `SELECT * FROM "${row.table_schema}"."${row.table_name}" ORDER BY 1 DESC LIMIT 5`;
    try {
      const d = await client.query(q);
      console.log(`\n✅  Rows in ${row.table_schema}.${row.table_name} (first 5):`);
      console.table(d.rows);
    } catch (e) {
      console.log(`\n⚠️   Can't read ${row.table_schema}.${row.table_name}: ${e.message}`);
    }
  }

  console.log("\n🔀  Current branches (via neon_list_branches if available):");
  try {
    const r4 = await client.query("SELECT * FROM neon_list_branches()");
    console.table(r4.rows);
  } catch (e) {
    console.log("   (extension not available — ok)");
  }
} finally {
  client.release();
  await pool.end();
}
