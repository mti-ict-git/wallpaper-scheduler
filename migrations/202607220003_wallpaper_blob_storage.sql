alter table wallpapers
  add column if not exists image_blob bytea,
  add column if not exists stored_mime_type text,
  add column if not exists stored_file_size_bytes bigint;

alter table wallpapers
  alter column storage_path drop not null;

update wallpapers
set
  stored_mime_type = coalesce(stored_mime_type, mime_type),
  stored_file_size_bytes = coalesce(stored_file_size_bytes, file_size_bytes)
where stored_mime_type is null
   or stored_file_size_bytes is null;

alter table wallpapers
  alter column stored_mime_type set not null,
  alter column stored_file_size_bytes set not null;

alter table wallpapers
  alter column original_filename set default 'Wallpaper.jpg';

alter table publish_jobs
  alter column source_storage_path drop not null;

alter table wallpapers
  drop constraint if exists wallpapers_status_check;

alter table wallpapers
  add constraint wallpapers_status_check
  check (status in ('active', 'archived', 'deleted'));
