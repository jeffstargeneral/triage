import { Pool } from "pg";

// Standard Postgres driver, standard TCP connection — the same thing
// every backend engineer already knows, instead of Neon's special
// HTTP-only serverless driver. Point DATABASE_URL at the single
// connection string you copy directly from Neon's own dashboard
// (Connection Details → pooled connection, the one with "-pooler" in
// the hostname) — not whatever Vercel's integration auto-generated,
// to remove any ambiguity about which of several similarly-named
// variables is actually correct.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
});

// A tiny tagged-template helper so query call sites read like
// `sql\`SELECT * FROM accounts WHERE id = ${id}\`` instead of manually
// building parameterized queries with pg's normal $1, $2 syntax.
// Returns rows directly, matching the convention already used
// throughout this codebase.
export async function sql(strings, ...values) {
  const text = strings.reduce(
    (acc, str, i) => acc + (i > 0 ? `$${i}` : "") + str,
    ""
  );
  const { rows } = await pool.query(text, values);
  return rows;
}
