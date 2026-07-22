create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'operator')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wallpapers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  checksum_sha256 text not null,
  width_px integer,
  height_px integer,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  wallpaper_id uuid not null references wallpapers(id),
  name text not null,
  start_at_utc timestamptz not null,
  end_at_utc timestamptz,
  timezone text not null,
  priority integer not null default 100,
  enabled boolean not null default true,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_end_after_start check (end_at_utc is null or end_at_utc > start_at_utc)
);

create table if not exists system_config (
  key text primary key,
  value_json jsonb not null,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

create table if not exists publish_jobs (
  id uuid primary key default gen_random_uuid(),
  trigger_type text not null check (trigger_type in ('schedule', 'manual')),
  triggered_by uuid references users(id),
  wallpaper_id uuid not null references wallpapers(id),
  schedule_id uuid references schedules(id),
  status text not null check (status in ('pending', 'running', 'success', 'failed')),
  source_storage_path text not null,
  staging_target_path text,
  final_target_path text not null,
  attempt_count integer not null default 0,
  checksum_sha256 text,
  started_at timestamptz,
  finished_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists active_wallpaper_state (
  id integer primary key,
  wallpaper_id uuid references wallpapers(id),
  schedule_id uuid references schedules(id),
  publish_job_id uuid references publish_jobs(id),
  effective_at_utc timestamptz,
  updated_at timestamptz not null default now()
);

insert into active_wallpaper_state (id, updated_at)
values (1, now())
on conflict (id) do nothing;

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null,
  actor_user_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  payload_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_schedules_active_window on schedules (enabled, start_at_utc, end_at_utc, priority);
create index if not exists idx_publish_jobs_created_at on publish_jobs (created_at desc);
create index if not exists idx_audit_logs_created_at on audit_logs (created_at desc);
