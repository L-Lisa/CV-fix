-- AI request log — used by lib/ai/rate-limit.ts to enforce per-user hourly
-- caps on calls to /api/ai/*. The helper inserts one row per allowed call
-- and counts rows in the last hour to decide.
--
-- Fail-open semantics live in the application code: if this table doesn't
-- exist or the query errors, the rate-limit helper logs a warning and
-- allows the request. So the app keeps working before this migration is
-- applied; protection activates the moment it is.

create table if not exists ai_request_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  route text not null check (route in ('profile', 'description', 'skills', 'keywords')),
  created_at timestamptz not null default now()
);

-- The helper queries with `where user_id = $1 and created_at > now() - interval '1 hour'`,
-- so this composite index covers the read path. Ordering on created_at desc
-- isn't necessary since count(*) doesn't sort.
create index if not exists idx_ai_request_log_user_created
  on ai_request_log (user_id, created_at);

alter table ai_request_log enable row level security;

-- Users can read and insert their own log rows. No update / delete from clients
-- (cleanup is a server-side concern; see comment below on retention).
create policy "Users can read own AI request log"
  on ai_request_log for select
  using (auth.uid() = user_id);

create policy "Users can insert own AI request log"
  on ai_request_log for insert
  with check (auth.uid() = user_id);

-- Retention note: rows older than 1 hour are no longer needed for rate-limit
-- enforcement, but we keep them for short-term observability. A scheduled
-- cleanup job (e.g. pg_cron `delete from ai_request_log where created_at <
-- now() - interval '7 days'`) is a follow-up — the table will not grow to
-- problematic size at the user counts we expect for V1.
