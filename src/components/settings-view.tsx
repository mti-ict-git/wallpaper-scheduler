import type { AppConfig } from '@shared/contracts'
import { useAppStore } from '@/store/app-store'

type SettingsViewProps = {
  config: AppConfig | null
}

export function SettingsView({ config }: SettingsViewProps) {
  const {
    updateConfig,
    operations,
    createMetadataBackup,
    createPublishTargetBackup,
    generateValidationReport,
    restoreMetadataBackup,
    restorePublishTargetBackup,
    runPublishProbe,
    runRestoreDrill,
    pruneRetention,
  } = useAppStore()

  if (!config) {
    return <div className="rounded-3xl border border-dashed border-white/10 p-8 text-sm text-slate-400">Config belum tersedia.</div>
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold text-white">Runtime Settings</h2>
      <form
        className="mt-5 grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          void updateConfig({
            defaultTimezone: String(formData.get('defaultTimezone')),
            pollIntervalSeconds: Number(formData.get('pollIntervalSeconds')),
            publishRetryCount: Number(formData.get('publishRetryCount')),
            publishRetryDelaySeconds: Number(formData.get('publishRetryDelaySeconds')),
            auditRetentionDays: Number(formData.get('auditRetentionDays')),
            publishJobRetentionDays: Number(formData.get('publishJobRetentionDays')),
            backupRetentionDays: Number(formData.get('backupRetentionDays')),
            fallbackWallpaperId: (formData.get('fallbackWallpaperId') as string) || null,
            sharedFolderPath: String(formData.get('sharedFolderPath')),
            cifsSharePath: String(formData.get('cifsSharePath')),
          })
        }}
      >
        {[
          ['defaultTimezone', 'Default timezone', config.defaultTimezone],
          ['pollIntervalSeconds', 'Poll interval', String(config.pollIntervalSeconds)],
          ['publishRetryCount', 'Retry count', String(config.publishRetryCount)],
          ['publishRetryDelaySeconds', 'Retry delay', String(config.publishRetryDelaySeconds)],
          ['auditRetentionDays', 'Audit retention (days)', String(config.auditRetentionDays)],
          ['publishJobRetentionDays', 'Publish job retention (days)', String(config.publishJobRetentionDays)],
          ['backupRetentionDays', 'Backup retention (days)', String(config.backupRetentionDays)],
          ['fallbackWallpaperId', 'Fallback wallpaper ID', config.fallbackWallpaperId ?? ''],
          ['sharedFolderPath', 'Shared folder path', config.sharedFolderPath],
          ['cifsSharePath', 'CIFS share path', config.cifsSharePath],
        ].map(([name, label, value]) => (
          <label key={name} className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">{label}</span>
            <input name={name} defaultValue={value} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" />
          </label>
        ))}
        <button type="submit" className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
          Simpan Konfigurasi
        </button>
      </form>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <h3 className="text-base font-semibold text-white">Secret Health</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>JWT: {operations?.secretHealth.jwtSecretSource ?? '-'}</p>
            <p>Postgres password: {operations?.secretHealth.postgresPasswordSource ?? '-'}</p>
            <p>Domain password: {operations?.secretHealth.domainPasswordSource ?? '-'}</p>
            <div className="rounded-2xl border border-amber-300/15 bg-amber-400/5 p-3 text-xs text-amber-100">
              {(operations?.secretHealth.warnings ?? ['No warnings']).join(' ')}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
          <h3 className="text-base font-semibold text-white">Validation & Recovery</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => void generateValidationReport()} className="rounded-2xl border border-cyan-400/20 px-4 py-2 text-sm text-cyan-100">
              Refresh Validation Report
            </button>
            <button type="button" onClick={() => void runPublishProbe()} className="rounded-2xl border border-emerald-400/20 px-4 py-2 text-sm text-emerald-100">
              Run Publish Probe
            </button>
            <button type="button" onClick={() => void createMetadataBackup()} className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">
              Backup Metadata
            </button>
            <button type="button" onClick={() => void createPublishTargetBackup()} className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white">
              Backup Publish Target
            </button>
            <button type="button" onClick={() => void pruneRetention()} className="rounded-2xl border border-amber-300/20 px-4 py-2 text-sm text-amber-100">
              Run Retention Prune
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Validation Report</p>
            <p className="mt-2">Target path: {operations?.validationReport?.targetPath ?? '-'}</p>
            <p>Share writable: {String(operations?.validationReport?.shareAccess.isWritable ?? false)}</p>
            <p>Target exists: {String(operations?.validationReport?.publishTarget.exists ?? false)}</p>
            <p>Target checksum: {operations?.validationReport?.publishTarget.checksumSha256 ?? '-'}</p>
            <p>Latest backup: {operations?.validationReport?.runtime.latestBackupAt ?? '-'}</p>
            <p className="mt-2 text-xs text-amber-100">
              {(operations?.validationReport?.runtime.warnings ?? ['No validation warnings']).join(' ')}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {(operations?.backups.backups ?? []).slice(0, 8).map((backup) => (
              <div key={backup.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-medium text-white">{backup.fileName}</p>
                <p className="text-xs text-slate-400">
                  {backup.type} · {backup.sizeBytes} bytes · {backup.createdAt}
                </p>
                <div className="mt-2 flex gap-2">
                  {backup.type === 'metadata' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void restoreMetadataBackup(backup.fileName)}
                        className="rounded-xl border border-rose-300/20 px-3 py-1 text-xs text-rose-100"
                      >
                        Restore Metadata
                      </button>
                      <button
                        type="button"
                        onClick={() => void runRestoreDrill({ fileName: backup.fileName, backupType: 'metadata' })}
                        className="rounded-xl border border-cyan-300/20 px-3 py-1 text-xs text-cyan-100"
                      >
                        Restore Drill
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void restorePublishTargetBackup(backup.fileName)}
                      className="rounded-xl border border-rose-300/20 px-3 py-1 text-xs text-rose-100"
                    >
                      Restore Publish Target
                    </button>
                  )}
                  {backup.type === 'publish-target' ? (
                    <button
                      type="button"
                      onClick={() => void runRestoreDrill({ fileName: backup.fileName, backupType: 'publish-target' })}
                      className="rounded-xl border border-cyan-300/20 px-3 py-1 text-xs text-cyan-100"
                    >
                      Restore Drill
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
