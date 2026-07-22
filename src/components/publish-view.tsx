import type { AuditLogRecord, PublishJobRecord } from '@shared/contracts'
import { useAppStore } from '@/store/app-store'

type PublishViewProps = {
  publishJobs: PublishJobRecord[]
  auditLogs: AuditLogRecord[]
}

export function PublishView({ publishJobs, auditLogs }: PublishViewProps) {
  const { validateShareAccess } = useAppStore()

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Publish Jobs</h2>
          <button
            type="button"
            onClick={() => void validateShareAccess()}
            className="rounded-2xl border border-cyan-400/20 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/10"
          >
            Validate Share Access
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {publishJobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{job.wallpaperName}</p>
                  <p className="text-sm text-slate-400">{job.triggerType}</p>
                </div>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-cyan-200">{job.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Created: {job.createdAt}
                <br />
                Attempts: {job.attemptCount}
                <br />
                Next Attempt: {job.nextAttemptAt ?? 'none'}
                <br />
                Error: {job.errorMessage ?? 'none'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Audit Logs</h2>
        <div className="mt-4 space-y-3">
          {auditLogs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-white">{log.action}</p>
                <span className="text-xs uppercase tracking-[0.25em] text-slate-500">{log.entityType}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Actor: {log.actorLabel}
                <br />
                Time: {log.createdAt}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
