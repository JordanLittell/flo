-- Where the user stopped in a started session, in seconds into the voice track, so they can resume.
alter table public.user_sessions add column position real not null default 0 check (position >= 0);
