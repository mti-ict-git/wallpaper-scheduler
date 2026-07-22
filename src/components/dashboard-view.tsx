import type { DashboardOverview } from '@shared/contracts'

type DashboardViewProps = {
  overview: DashboardOverview | null
}

export function DashboardView({ overview }: DashboardViewProps) {
  const shareAccessState = overview?.shareAccess?.isWritable
  const shareAccessDetail = overview?.shareAccess?.detail ?? '-'

  const cards = [
    ['Active wallpaper', overview?.activeWallpaper.wallpaperName ?? 'Belum ada'],
    ['Active schedule', overview?.activeWallpaper.scheduleName ?? 'Belum aktif'],
    ['Last publish', overview?.lastPublish?.status ?? 'Belum ada'],
    ['Worker heartbeat', overview?.workerLastHeartbeatAt ?? 'Belum ada'],
    ['Scheduler status', overview?.schedulerStatus ?? 'idle'],
    ['Failed jobs', String(overview?.failedJobCount ?? 0)],
    ['Pending jobs', String(overview?.pendingJobCount ?? 0)],
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        {cards.map(([title, value]) => (
          <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</p>
            <p className="mt-3 text-lg font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold text-white">Next Schedules</h2>
          <div className="mt-4 space-y-3">
            {overview?.nextSchedules.length ? (
              overview.nextSchedules.map((schedule) => (
                <div key={schedule.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{schedule.name}</p>
                      <p className="text-sm text-slate-400">{schedule.wallpaperName}</p>
                    </div>
                    <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-amber-200">
                      P{schedule.priority}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    Start: {schedule.startAt}
                    <br />
                    Timezone: {schedule.timezone}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-sm text-slate-400">Belum ada schedule mendatang.</div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold text-white">Publish Target</h2>
          <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-500/5 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Mounted Path</p>
            <p className="mt-2 break-all text-sm text-white">{overview?.targetPath ?? '-'}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Share Access</p>
            <p className="mt-2 text-sm text-slate-200">
              {shareAccessState === null || shareAccessState === undefined
                ? 'Belum dicek'
                : shareAccessState
                  ? 'Writable'
                  : 'Not writable'}
            </p>
            <p className="mt-1 text-xs text-slate-400">{shareAccessDetail}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Last Publish Error</p>
            <p className="mt-2 text-sm text-slate-200">{overview?.lastPublish?.errorMessage ?? 'Tidak ada error aktif.'}</p>
          </div>
        </section>
      </div>
    </div>
  )
}
