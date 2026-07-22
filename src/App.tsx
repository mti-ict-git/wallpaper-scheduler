import { useEffect } from 'react'
import { useState } from 'react'
import { AuthPanel } from '@/components/auth-panel'
import { DashboardView } from '@/components/dashboard-view'
import { PublishView } from '@/components/publish-view'
import { SchedulesView } from '@/components/schedules-view'
import { SettingsView } from '@/components/settings-view'
import { Shell } from '@/components/shell'
import { WallpapersView } from '@/components/wallpapers-view'
import { useAppStore } from '@/store/app-store'

function AppShell() {
  const {
    bootstrapStatus,
    user,
    overview,
    wallpapers,
    schedules,
    publishJobs,
    auditLogs,
    config,
    loading,
    error,
    fetchBootstrapStatus,
    loadAll,
    logout,
  } = useAppStore()
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)

  useEffect(() => {
    void fetchBootstrapStatus()
  }, [fetchBootstrapStatus])

  useEffect(() => {
    if (user) {
      void loadAll()
    }
  }, [user, loadAll])

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname)

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (!user) {
    return <AuthPanel />
  }

  const pathToTab = currentPath === '/login' ? 'dashboard' : currentPath === '/' ? 'dashboard' : currentPath.slice(1)

  return (
    <Shell
      user={user}
      activeTab={pathToTab}
      onSelectTab={(tab) => {
        const nextPath = tab === 'dashboard' ? '/' : `/${tab}`
        window.history.pushState({}, '', nextPath)
        setCurrentPath(nextPath)
      }}
      onLogout={logout}
    >
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
            {bootstrapStatus?.needsSetup ? 'Bootstrap pending' : 'Phase 1 Foundation'}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">TypeScript Full-Stack Console</h2>
              <p className="text-sm text-slate-400">Frontend React, API Express, worker scheduler, PostgreSQL, dan mounted SYSVOL path.</p>
            </div>
            {loading ? <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-300">Refreshing...</span> : null}
          </div>
          {error ? <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
        </div>

        {pathToTab === 'dashboard' ? <DashboardView overview={overview} /> : null}
        {pathToTab === 'wallpapers' ? <WallpapersView wallpapers={wallpapers} /> : null}
        {pathToTab === 'schedules' ? <SchedulesView schedules={schedules} wallpapers={wallpapers} timezone={config?.defaultTimezone ?? 'Asia/Jakarta'} /> : null}
        {pathToTab === 'publish' ? <PublishView publishJobs={publishJobs} auditLogs={auditLogs} /> : null}
        {pathToTab === 'settings' ? <SettingsView config={config} /> : null}
      </div>
    </Shell>
  )
}

export default function App() {
  return <AppShell />
}
