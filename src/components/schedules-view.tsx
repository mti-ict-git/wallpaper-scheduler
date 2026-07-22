import { useEffect, useMemo, useState } from 'react'
import type { ScheduleRecord, WallpaperRecord } from '@shared/contracts'
import { useAppStore } from '@/store/app-store'

const COMMON_TIMEZONES = [
  'UTC',
  'Asia/Jakarta',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
]

function formatTimezoneOption(timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date())
    const rawOffset = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'UTC'
    const offsetLabel = rawOffset.replace('GMT', 'UTC')
    return `${timeZone} (${offsetLabel})`
  } catch {
    return timeZone
  }
}

function getWallpaperLabel(wallpaper: WallpaperRecord) {
  const trimmedName = wallpaper.name.trim()
  if (trimmedName) {
    return trimmedName
  }

  const trimmedFileName = wallpaper.originalFilename.trim()
  if (trimmedFileName) {
    return trimmedFileName
  }

  return `Wallpaper ${wallpaper.id.slice(0, 8)}`
}

type SchedulesViewProps = {
  schedules: ScheduleRecord[]
  wallpapers: WallpaperRecord[]
  timezone: string
}

export function SchedulesView({ schedules, wallpapers, timezone }: SchedulesViewProps) {
  const { saveSchedule, deleteSchedule } = useAppStore()
  const timezoneOptions = useMemo(() => {
    const values = new Set(COMMON_TIMEZONES)
    if (timezone) {
      values.add(timezone)
    }

    return Array.from(values).map((value) => ({
      value,
      label: formatTimezoneOption(value),
    }))
  }, [timezone])
  const [form, setForm] = useState({
    wallpaperId: wallpapers[0]?.id ?? '',
    name: '',
    startAt: '',
    endAt: '',
    timezone,
    priority: 100,
    enabled: true,
  })

  useEffect(() => {
    setForm((current) => {
      const wallpaperId = wallpapers.some((wallpaper) => wallpaper.id === current.wallpaperId)
        ? current.wallpaperId
        : wallpapers[0]?.id ?? ''
      const nextTimezone = timezoneOptions.some((option) => option.value === current.timezone)
        ? current.timezone
        : timezoneOptions[0]?.value ?? timezone

      if (wallpaperId === current.wallpaperId && nextTimezone === current.timezone) {
        return current
      }

      return {
        ...current,
        wallpaperId,
        timezone: nextTimezone,
      }
    })
  }, [timezone, timezoneOptions, wallpapers])

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Create Schedule</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!form.wallpaperId) {
              return
            }

            void saveSchedule({
              wallpaperId: form.wallpaperId,
              name: form.name,
              startAt: new Date(form.startAt).toISOString(),
              endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
              timezone: form.timezone,
              priority: Number(form.priority),
              enabled: form.enabled,
            })
          }}
        >
          {wallpapers.length === 0 ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Belum ada wallpaper aktif untuk dipilih. Upload wallpaper dulu di tab `Wallpapers`.
            </div>
          ) : null}
          <select
            value={form.wallpaperId}
            onChange={(event) => setForm((current) => ({ ...current, wallpaperId: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            disabled={wallpapers.length === 0}
          >
            {wallpapers.length === 0 ? (
              <option value="">Upload wallpaper dulu</option>
            ) : (
              wallpapers.map((wallpaper) => (
                <option key={wallpaper.id} value={wallpaper.id} className="bg-slate-950 text-white">
                  {getWallpaperLabel(wallpaper)}
                </option>
              ))
            )}
          </select>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Nama schedule"
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            required
          />
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
              required
            />
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.timezone}
              onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            >
              {timezoneOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-950 text-white">
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={form.priority}
              onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value) }))}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            />
          </div>
          <p className="text-xs leading-5 text-slate-400">
            Priority lebih besar akan menang saat ada schedule yang overlap. End date boleh kosong kalau schedule mau tetap aktif tanpa batas.
          </p>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
            />
            Schedule enabled
          </label>
          <button
            type="submit"
            disabled={wallpapers.length === 0}
            className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            Simpan Schedule
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Schedule List</h2>
        <div className="mt-4 space-y-3">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{schedule.name}</p>
                  <p className="text-sm text-slate-400">{schedule.wallpaperName}</p>
                </div>
                <div className="flex gap-2">
                  {schedule.hasConflict ? <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-rose-200">Conflict</span> : null}
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-amber-200">P{schedule.priority}</span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Start: {schedule.startAt}
                <br />
                End: {schedule.endAt ?? 'No end'}
                <br />
                Timezone: {schedule.timezone}
              </p>
              <button
                type="button"
                onClick={() => void deleteSchedule(schedule.id)}
                className="mt-4 rounded-2xl border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
