import type { WallpaperRecord } from '@shared/contracts'
import { query } from '../lib/database.js'

type WallpaperRow = {
  id: string
  name: string
  description: string | null
  storage_path?: string | null
  original_filename: string
  mime_type: string
  file_size_bytes: number
  checksum_sha256: string
  width_px: number | null
  height_px: number | null
  status: 'active' | 'archived' | 'deleted'
  created_at: Date
  image_blob?: Buffer
  stored_mime_type?: string
  stored_file_size_bytes?: number
}

function mapWallpaperRow(row: WallpaperRow): WallpaperRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    originalFilename: row.original_filename,
    mimeType: row.stored_mime_type ?? row.mime_type,
    fileSizeBytes: Number(row.stored_file_size_bytes ?? row.file_size_bytes),
    checksumSha256: row.checksum_sha256,
    widthPx: row.width_px,
    heightPx: row.height_px,
    status: row.status,
    previewUrl: `/api/wallpapers/${row.id}/preview`,
    createdAt: row.created_at.toISOString(),
  }
}

export async function listWallpapers() {
  const result = await query<WallpaperRow>("select * from wallpapers where status <> 'deleted' order by created_at desc")
  return result.rows.map(mapWallpaperRow)
}

export async function findWallpaperById(id: string) {
  const result = await query<WallpaperRow>('select * from wallpapers where id = $1 limit 1', [id])

  const row = result.rows[0]
  if (!row) {
    return null
  }

  return {
    ...mapWallpaperRow(row),
    imageBlob: row.image_blob ?? null,
    storagePath: row.storage_path ?? null,
  }
}

export async function createWallpaper(input: {
  name: string
  description: string | null
  originalFilename: string
  mimeType: string
  fileSizeBytes: number
  checksumSha256: string
  widthPx: number | null
  heightPx: number | null
  imageBuffer: Buffer
  createdBy: string
}) {
  const result = await query<WallpaperRow>(
    `
      insert into wallpapers
      (name, description, original_filename, mime_type, file_size_bytes, checksum_sha256, width_px, height_px, image_blob, stored_mime_type, stored_file_size_bytes, created_by)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      returning *
    `,
    [
      input.name,
      input.description,
      input.originalFilename,
      input.mimeType,
      input.fileSizeBytes,
      input.checksumSha256,
      input.widthPx,
      input.heightPx,
      input.imageBuffer,
      input.mimeType,
      input.fileSizeBytes,
      input.createdBy,
    ],
  )

  return mapWallpaperRow(result.rows[0])
}

export async function updateWallpaper(input: {
  id: string
  name: string
  description: string | null
  status: 'active' | 'archived' | 'deleted'
}) {
  const result = await query<WallpaperRow>(
    `
      update wallpapers
      set name = $2, description = $3, status = $4, updated_at = now()
      where id = $1
      returning *
    `,
    [input.id, input.name, input.description, input.status],
  )

  return result.rows[0] ? mapWallpaperRow(result.rows[0]) : null
}

export async function deleteWallpaper(id: string) {
  // #region debug-point A:delete-wallpaper-repo-entry
  ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "delete-wallpaper-crash", runId: "pre-fix", hypothesisId: "A", location: "api/repositories/wallpaper-repository.ts:deleteWallpaper:entry", msg: "[DEBUG] deleteWallpaper repository entry", data: { wallpaperId: id }, ts: Date.now() }) }).catch(() => {}) })()
  // #endregion
  await query('begin')

  try {
    const existingResult = await query<{ id: string }>("select id from wallpapers where id = $1 and status <> 'deleted' limit 1", [id])
    // #region debug-point B:delete-wallpaper-existing
    ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "delete-wallpaper-crash", runId: "pre-fix", hypothesisId: "B", location: "api/repositories/wallpaper-repository.ts:deleteWallpaper:existing", msg: "[DEBUG] deleteWallpaper existing check", data: { wallpaperId: id, rowCount: existingResult.rowCount }, ts: Date.now() }) }).catch(() => {}) })()
    // #endregion
    if (!existingResult.rowCount) {
      await query('rollback')
      return false
    }

    await query(
      `
        update wallpapers
        set status = 'deleted',
            name = concat(name, ' [deleted]'),
            updated_at = now()
        where id = $1
      `,
      [id],
    )
    // #region debug-point C:delete-wallpaper-updated
    ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "delete-wallpaper-crash", runId: "pre-fix", hypothesisId: "C", location: "api/repositories/wallpaper-repository.ts:deleteWallpaper:updated", msg: "[DEBUG] deleteWallpaper updated wallpaper status", data: { wallpaperId: id }, ts: Date.now() }) }).catch(() => {}) })()
    // #endregion

    await query(
      `
        update schedules
        set enabled = false,
            updated_at = now()
        where wallpaper_id = $1 and enabled = true
      `,
      [id],
    )

    await query(
      `
        update active_wallpaper_state
        set wallpaper_id = null,
            schedule_id = null,
            updated_at = now()
        where wallpaper_id = $1
      `,
      [id],
    )

    await query(
      `
        update system_config
        set value_json = 'null'::jsonb,
            updated_at = now()
        where key = 'fallbackWallpaperId'
          and value_json = to_jsonb($1::text)
      `,
      [id],
    )
    // #region debug-point D:delete-wallpaper-side-effects
    ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "delete-wallpaper-crash", runId: "pre-fix", hypothesisId: "D", location: "api/repositories/wallpaper-repository.ts:deleteWallpaper:side-effects", msg: "[DEBUG] deleteWallpaper applied schedule/active/config side effects", data: { wallpaperId: id }, ts: Date.now() }) }).catch(() => {}) })()
    // #endregion

    await query('commit')
    // #region debug-point E:delete-wallpaper-commit
    ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "delete-wallpaper-crash", runId: "pre-fix", hypothesisId: "E", location: "api/repositories/wallpaper-repository.ts:deleteWallpaper:commit", msg: "[DEBUG] deleteWallpaper commit success", data: { wallpaperId: id }, ts: Date.now() }) }).catch(() => {}) })()
    // #endregion
    return true
  } catch (error) {
    // #region debug-point F:delete-wallpaper-catch
    ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "delete-wallpaper-crash", runId: "pre-fix", hypothesisId: "F", location: "api/repositories/wallpaper-repository.ts:deleteWallpaper:catch", msg: "[DEBUG] deleteWallpaper repository catch", data: { wallpaperId: id, error: error instanceof Error ? error.message : String(error) }, ts: Date.now() }) }).catch(() => {}) })()
    // #endregion
    await query('rollback')
    throw error
  }
}
