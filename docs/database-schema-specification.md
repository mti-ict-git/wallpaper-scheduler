# Database Schema Specification

## Design Goals

- Menyimpan metadata wallpaper dan file source terpisah dari artefak publish.
- Mendukung schedule berbasis waktu, priority, dan enabled flag.
- Menyimpan publish history dan audit trail.

## Tables

## `users`

Purpose:
- Menyimpan akun yang dapat mengakses sistem.

Fields:
- `id` UUID PK
- `email` text unique not null
- `display_name` text not null
- `password_hash` text not null
- `role` text not null
- `is_active` boolean not null default true
- `created_at` timestamptz not null
- `updated_at` timestamptz not null

## `wallpapers`

Purpose:
- Menyimpan metadata wallpaper yang diupload.

Fields:
- `id` UUID PK
- `name` text not null
- `description` text null
- `storage_path` text not null
- `original_filename` text not null
- `mime_type` text not null
- `file_size_bytes` bigint not null
- `checksum_sha256` text not null
- `width_px` integer null
- `height_px` integer null
- `status` text not null default `active`
- `created_by` UUID FK `users.id`
- `created_at` timestamptz not null
- `updated_at` timestamptz not null

## `schedules`

Purpose:
- Mendefinisikan kapan wallpaper tertentu aktif.

Fields:
- `id` UUID PK
- `wallpaper_id` UUID FK `wallpapers.id`
- `name` text not null
- `start_at_utc` timestamptz not null
- `end_at_utc` timestamptz null
- `timezone` text not null
- `priority` integer not null default 100
- `enabled` boolean not null default true
- `created_by` UUID FK `users.id`
- `created_at` timestamptz not null
- `updated_at` timestamptz not null

Indexes:
- index on `enabled`
- index on `start_at_utc`
- index on `end_at_utc`
- composite index on `enabled, start_at_utc, end_at_utc, priority`

## `system_config`

Purpose:
- Menyimpan konfigurasi aplikasi yang berubah jarang.

Fields:
- `key` text PK
- `value_json` jsonb not null
- `updated_by` UUID FK `users.id` null
- `updated_at` timestamptz not null

Key examples:
- `default_timezone`
- `publish_target_path`
- `fallback_wallpaper_id`
- `scheduler_poll_interval_seconds`
- `publish_retry_policy`

## `publish_jobs`

Purpose:
- Mencatat setiap percobaan publish.

Fields:
- `id` UUID PK
- `trigger_type` text not null
- `triggered_by` UUID FK `users.id` null
- `wallpaper_id` UUID FK `wallpapers.id` not null
- `schedule_id` UUID FK `schedules.id` null
- `status` text not null
- `source_storage_path` text not null
- `staging_target_path` text null
- `final_target_path` text not null
- `attempt_count` integer not null default 0
- `checksum_sha256` text null
- `started_at` timestamptz null
- `finished_at` timestamptz null
- `error_code` text null
- `error_message` text null
- `created_at` timestamptz not null

Indexes:
- index on `status`
- index on `created_at desc`

## `active_wallpaper_state`

Purpose:
- Menyimpan snapshot wallpaper aktif terakhir dan publish terakhir yang sukses.

Fields:
- `id` integer PK fixed value `1`
- `wallpaper_id` UUID FK `wallpapers.id` null
- `schedule_id` UUID FK `schedules.id` null
- `publish_job_id` UUID FK `publish_jobs.id` null
- `effective_at_utc` timestamptz null
- `updated_at` timestamptz not null

## `audit_logs`

Purpose:
- Menyimpan jejak aksi user dan sistem.

Fields:
- `id` UUID PK
- `actor_type` text not null
- `actor_user_id` UUID FK `users.id` null
- `action` text not null
- `entity_type` text not null
- `entity_id` text not null
- `payload_json` jsonb not null
- `created_at` timestamptz not null

## Constraints

- `end_at_utc` harus lebih besar dari `start_at_utc` jika diisi.
- `priority` harus berada pada rentang yang ditentukan aplikasi.
- `status` field sebaiknya memakai enum di level aplikasi atau database.

## Migration Notes

- Simpan semua timestamp di UTC.
- Pertimbangkan extension `pgcrypto` atau `uuid-ossp` untuk UUID generation.
