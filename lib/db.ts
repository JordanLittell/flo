import postgres from "postgres";

/**
 * Shared Postgres client for server code. Queries are tagged templates, so interpolated values are
 * always sent as parameters:
 *
 *   const [user] = await sql<User[]>`select * from users where id = ${id}`;
 *
 * Use sql.begin(async (tx) => { ... }) for transactions.
 */
function createClient() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error("POSTGRES_URL is not set.");

  return postgres(url, {
    // Supabase's pooler runs in transaction mode, which doesn't support prepared statements.
    prepare: false,
    // Fluid Compute shares one instance across concurrent requests, so keep a small pool per
    // instance and let idle connections go rather than hold pooler slots.
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

// Reuse one client across dev hot reloads instead of opening a new pool on every edit.
const globalForDb = globalThis as unknown as { sql?: ReturnType<typeof createClient> };

export const sql = globalForDb.sql ?? createClient();

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

/** Either the shared client or the tx inside sql.begin; both run queries the same way. */
export type Db = postgres.Sql | postgres.TransactionSql;
