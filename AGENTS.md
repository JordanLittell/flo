<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Local development

Cloud Agent boot starts PostgreSQL and `npm run dev`, and writes gitignored `.env.local`:

- `POSTGRES_URL=postgresql://flo:flo@127.0.0.1:5432/flo` (local role and database `flo`)
- `NEXTAUTH_URL=http://localhost:3000`
- `NEXTAUTH_SECRET` set to a local development value

Open the app at http://localhost:3000. Next.js blocks dev resources when the host is `127.0.0.1`.

`supabase/migrations` is applied to that database on boot. Checks: `npm run lint`, `npm test`, `npm run build`. `npm test` does not run the paid `*.test.e2e.ts` generation test.

Sign-up and the home screen do not need external API keys. Generating a class needs `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, and `BLOB_READ_WRITE_TOKEN`.
