alter table wallpapers
  drop constraint if exists wallpapers_status_check;

alter table wallpapers
  add constraint wallpapers_status_check
  check (status in ('active', 'archived', 'deleted'));
