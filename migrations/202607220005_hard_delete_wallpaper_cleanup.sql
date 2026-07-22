delete from publish_jobs
where wallpaper_id in (
  select id
  from wallpapers
  where status = 'deleted'
);

update active_wallpaper_state
set wallpaper_id = null,
    schedule_id = null,
    updated_at = now()
where wallpaper_id in (
  select id
  from wallpapers
  where status = 'deleted'
);

delete from schedules
where wallpaper_id in (
  select id
  from wallpapers
  where status = 'deleted'
);

update system_config
set value_json = 'null'::jsonb,
    updated_at = now()
where key = 'fallbackWallpaperId'
  and value_json in (
    select to_jsonb(id::text)
    from wallpapers
    where status = 'deleted'
  );

delete from wallpapers
where status = 'deleted';

alter table wallpapers
  drop constraint if exists wallpapers_status_check;

alter table wallpapers
  add constraint wallpapers_status_check
  check (status in ('active', 'archived'));
