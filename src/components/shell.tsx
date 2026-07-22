import type { ReactNode } from 'react'
import { LayoutDashboard, LogOut, Paintbrush, Send, Settings2, TimerReset } from 'lucide-react'
import type { AuthUser } from '@shared/contracts'

type ShellProps = {
  user: AuthUser
  activeTab: string
  onSelectTab: (tab: string) => void
  onLogout: () => void
  children: ReactNode
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'wallpapers', label: 'Wallpapers', icon: Paintbrush },
  { id: 'schedules', label: 'Schedules', icon: TimerReset },
  { id: 'publish', label: 'Publish & Audit', icon: Send },
  { id: 'settings', label: 'Settings', icon: Settings2 },
]

export function Shell({ user, activeTab, onSelectTab, onLogout, children }: ShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.12),_transparent_26%),#020617] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-6 py-6 lg:grid-cols-[250px_1fr]">
        <aside className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/30 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Wallpaper Scheduler</p>
            <h1 className="mt-3 font-serif text-2xl text-white">Operations Console</h1>
            <p className="mt-2 text-sm text-slate-400">Local auth, TypeScript stack, Ubuntu Docker, CIFS publish path.</p>
          </div>

          <div className="mt-8 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = tab.id === activeTab

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                    active
                      ? 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-900/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Signed in</p>
            <p className="mt-2 text-sm font-semibold text-white">{user.displayName}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
            <p className="mt-1 inline-flex rounded-full bg-cyan-400/10 px-2 py-1 text-[11px] uppercase tracking-[0.25em] text-cyan-200">{user.role}</p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm text-slate-200 transition hover:border-rose-300/30 hover:bg-rose-500/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <main className="overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/55 p-6 shadow-xl shadow-black/30 backdrop-blur">{children}</main>
      </div>
    </div>
  )
}
