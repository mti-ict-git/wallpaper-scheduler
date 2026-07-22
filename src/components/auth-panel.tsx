import { useState } from 'react'
import { ShieldCheck, UserCog } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

export function AuthPanel() {
  const { bootstrapStatus, loading, error, bootstrapAdmin, login } = useAppStore()
  const [email, setEmail] = useState('admin@mbma.com')
  const [displayName, setDisplayName] = useState('MTI Sysadmin')
  const [password, setPassword] = useState('changeme123')

  const needsSetup = bootstrapStatus?.needsSetup ?? false

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-10 lg:grid-cols-[1.25fr_0.9fr]">
        <section className="rounded-[32px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="mb-8 flex items-center gap-3 text-cyan-300">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-sm uppercase tracking-[0.3em]">Wallpaper Scheduler</span>
          </div>
          <h1 className="max-w-2xl font-serif text-4xl text-white md:text-5xl">
            Control room untuk wallpaper domain yang terjadwal, terukur, dan siap publish ke `SYSVOL`.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            Phase 1 sudah difokuskan ke TypeScript end-to-end, local auth, scheduler worker, dan CIFS-mounted publish path.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['Realtime status', 'Lihat active wallpaper, publish state, dan heartbeat worker.'],
              ['Scheduled activation', 'Atur jadwal berdasarkan tanggal, jam, timezone, dan priority.'],
              ['Safe publish path', 'Worker menulis staging file sebelum replace wallpaper final.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-xs leading-6 text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-cyan-400/20 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur">
          <div className="mb-6 flex items-center gap-3 text-cyan-200">
            <UserCog className="h-5 w-5" />
            <span className="text-sm font-medium">{needsSetup ? 'Bootstrap Admin' : 'Login Lokal'}</span>
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (needsSetup) {
                void bootstrapAdmin({ email, displayName, password })
              } else {
                void login({ email, password })
              }
            }}
          >
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            {needsSetup ? (
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">Display name</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Memproses...' : needsSetup ? 'Buat Admin Awal' : 'Masuk ke Control Room'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
