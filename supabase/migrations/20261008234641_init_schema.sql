-- Initial schema: users, curated templates ("Popular flows"), generated catalog sessions
-- ("Community flows") and each user's session history.
--
-- The app reads and writes these tables from the server through lib/db.ts, which connects as the
-- postgres role and bypasses row level security. RLS is still enabled everywhere so the publishable
-- key can't reach them through the Data API; add policies only when a table is meant for direct
-- client access.

-- Users ---------------------------------------------------------------------------------------------

create table public.users (
  id uuid primary key default gen_random_uuid(),
  -- Stored trimmed and lowercase (lib/data/user.ts). The format check is a loose sanity check; the
  -- confirmation email (once added) is what proves the address is real.
  email text not null unique check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  -- Set once the person confirms their address. Null until email confirmation exists.
  email_verified_at timestamptz,
  -- scrypt$<salt>$<hash> (lib/data/password.ts). 
  password_hash text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- Catalog sessions ----------------------------------------------------------------------------------

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  -- The id the generation pipeline gives the session, used in its Blob paths.
  slug text not null unique,
  -- Private: Community flows show only the title, never who made it or what they asked for.
  created_by uuid references public.users (id) on delete set null,
  prompt text not null,
  title text not null,
  minutes integer not null check (minutes > 0),
  level text not null check (level in ('Beginner', 'Intermediate', 'Advanced', 'All levels')),
  vibe text not null check (vibe in ('tide', 'haze', 'sunrise', 'moss')),
  -- The instructor's ElevenLabs voice (lib/instructors.ts).
  voice_id text not null,
  -- The music loop; null when generation skipped music.
  audio_url text,
  instructor_audio_url text not null,
  transcript_url text not null,
  -- The manifest the player loads: transcript, timeline and track URLs.
  manifest_url text not null,
  -- Length of the voice track in seconds.
  duration real not null check (duration > 0),
  created_at timestamptz not null default now()
);

create index sessions_created_at_idx on public.sessions (created_at desc);
create index sessions_created_by_idx on public.sessions (created_by);

alter table public.sessions enable row level security;

-- User sessions -------------------------------------------------------------------------------------

-- One row per user and session: the latest time they started it and whether they finished.
create table public.user_sessions (
  user_id uuid not null references public.users (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  status text not null default 'started' check (status in ('started', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, session_id)
);

create index user_sessions_user_started_idx on public.user_sessions (user_id, started_at desc);

alter table public.user_sessions enable row level security;
