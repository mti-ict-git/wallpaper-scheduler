alter table publish_jobs
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists last_error_at timestamptz;

create index if not exists idx_publish_jobs_retry_window
  on publish_jobs (status, next_attempt_at, created_at);

create table if not exists runtime_status (
  key text primary key,
  value_json jsonb not null,
  updated_at timestamptz not null default now()
);
