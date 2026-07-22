import { useMemo, useState } from 'react'
import type { WallpaperRecord } from '@shared/contracts'
import { useAppStore } from '@/store/app-store'

type WallpapersViewProps = {
  wallpapers: WallpaperRecord[]
}

export function WallpapersView({ wallpapers }: WallpapersViewProps) {
  const { uploadWallpaper, updateWallpaper, deleteWallpaper, triggerManualPublish } = useAppStore()
  const [selectedId, setSelectedId] = useState<string | null>(wallpapers[0]?.id ?? null)
  const selectedWallpaper = useMemo(() => wallpapers.find((wallpaper) => wallpaper.id === selectedId) ?? wallpapers[0] ?? null, [selectedId, wallpapers])

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Upload Wallpaper</h2>
        <form
          className="mt-4 rounded-3xl border border-dashed border-cyan-300/30 bg-slate-950/70 p-5"
          onSubmit={(event) => {
            event.preventDefault()
            const form = event.currentTarget
            const formData = new FormData(form)
            void uploadWallpaper(formData)
            form.reset()
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <input name="name" placeholder="Nama wallpaper" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" />
            <input name="description" placeholder="Deskripsi opsional" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white" />
          </div>
          <input name="file" type="file" accept=".jpg,.jpeg,.png,.webp" className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-2xl file:border-0 file:bg-cyan-300 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-slate-950" />
          <button type="submit" className="mt-4 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
            Upload & Simpan
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {wallpapers.map((wallpaper) => (
            <button
              key={wallpaper.id}
              type="button"
              onClick={() => setSelectedId(wallpaper.id)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                selectedWallpaper?.id === wallpaper.id ? 'border-cyan-300/40 bg-cyan-400/10' : 'border-white/10 bg-slate-950/70 hover:bg-white/5'
              }`}
            >
              <div>
                <p className="font-medium text-white">{wallpaper.name}</p>
                <p className="text-sm text-slate-400">{wallpaper.originalFilename}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-slate-300">{wallpaper.status}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        {selectedWallpaper ? (
          <>
            <h2 className="text-lg font-semibold text-white">Detail Wallpaper</h2>
            <img src={selectedWallpaper.previewUrl} alt={selectedWallpaper.name} className="mt-4 h-72 w-full rounded-3xl object-cover" />
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">Checksum: {selectedWallpaper.checksumSha256}</div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">File size: {selectedWallpaper.fileSizeBytes.toLocaleString()} bytes</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  void updateWallpaper(selectedWallpaper.id, {
                    name: selectedWallpaper.name,
                    description: selectedWallpaper.description,
                    status: selectedWallpaper.status === 'active' ? 'archived' : 'active',
                  })
                }
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white transition hover:bg-white/10"
              >
                Toggle Status
              </button>
              <button
                type="button"
                onClick={() => void triggerManualPublish(selectedWallpaper.id)}
                className="rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
              >
                Manual Publish
              </button>
              <button
                type="button"
                onClick={() => void deleteWallpaper(selectedWallpaper.id)}
                className="rounded-2xl border border-rose-400/20 px-4 py-3 text-sm text-rose-200 transition hover:bg-rose-500/10"
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-white/10 text-sm text-slate-400">
            Belum ada wallpaper yang diupload.
          </div>
        )}
      </section>
    </div>
  )
}
