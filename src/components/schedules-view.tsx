import { useState } from 'react'
import type { ScheduleRecord, WallpaperRecord } from '@shared/contracts'
import { useAppStore } from '@/store/app-store'

type SchedulesViewProps = {
  schedules: ScheduleRecord[]
  wallpapers: WallpaperRecord[]
  timezone: string
}

export function SchedulesView({ schedules, wallpapers, timezone }: SchedulesViewProps) {
  const { saveSchedule, deleteSchedule } = useAppStore()
  const [form, setForm] = useState({
    wallpaperId: wallpapers[0]?.id ?? '',
    name: '',
    startAt: '',
    endAt: '',
    timezone,
    priority: 100,
    enabled: true,
  })

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Create Schedule</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
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
          <select
            value={form.wallpaperId}
            onChange={(event) => setForm((current) => ({ ...current, wallpaperId: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
          >
            {wallpapers.map((wallpaper) => (
              <option key={wallpaper.id} value={wallpaper.id}>
                {wallpaper.name}
              </option>
            ))}
          </select>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Nama schedule"
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            />
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.timezone}
              onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            />
            <input
              type="number"
              value={form.priority}
              onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value) }))}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
            />
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
            />
            Schedule enabled
          </label>
          <button type="submit" className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
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
