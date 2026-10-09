import { spawnSync } from "node:child_process";

// Applies pending supabase/migrations to the hosted database. Extra arguments go to `supabase db push`
// (e.g. --dry-run). Uses the direct connection: the transaction pooler behind POSTGRES_URL can't run
// migrations reliably.
const url = process.env.POSTGRES_URL_NON_POOLING;
if (!url) {
  console.error("POSTGRES_URL_NON_POOLING is not set.");
  process.exit(1);
}

const { status } = spawnSync("supabase", ["db", "push", "--db-url", url, ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exit(status ?? 1);
