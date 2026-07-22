import path from 'node:path'
import type { WallpaperRecord } from '@shared/contracts'
import { query } from '../lib/database.js'

type WallpaperRow = {
  id: string
  name: string
  description: string | null
  original_filename: string
  mime_type: string
  file_size_bytes: number
  checksum_sha256: string
  width_px: number | null
  height_px: number | null
  status: 'active' | 'archived'
  created_at: Date
}

function mapWallpaperRow(row: WallpaperRow): WallpaperRecord {
  const previewFileName = path.basename((row as WallpaperRow & { storage_path?: string }).storage_path ?? row.original_filename)

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    fileSizeBytes: Number(row.file_size_bytes),
    checksumSha256: row.checksum_sha256,
    widthPx: row.width_px,
    heightPx: row.height_px,
    status: row.status,
    previewUrl: `/storage/wallpapers/${previewFileName}`,
    createdAt: row.created_at.toISOString(),
  }
}

export async function listWallpapers() {
  const result = await query<WallpaperRow & { storage_path: string }>('select * from wallpapers order by created_at desc')
  return result.rows.map(mapWallpaperRow)
}

export async function findWallpaperById(id: string) {
  const result = await query<
    WallpaperRow & {
      storage_path: string
    }
  >('select * from wallpapers where id = $1 limit 1', [id])

  const row = result.rows[0]
  if (!row) {
    return null
  }

  return {
    ...mapWallpaperRow(row),
    storagePath: row.storage_path,
  }
}

export async function createWallpaper(input: {
  name: string
  description: string | null
  storagePath: string
  originalFilename: string
  mimeType: string
  fileSizeBytes: number
  checksumSha256: string
  widthPx: number | null
  heightPx: number | null
  createdBy: string
}) {
  const result = await query<WallpaperRow>(
    `
      insert into wallpapers
      (name, description, storage_path, original_filename, mime_type, file_size_bytes, checksum_sha256, width_px, height_px, created_by)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      returning *
    `,
    [
      input.name,
      input.description,
      input.storagePath,
      input.originalFilename,
      input.mimeType,
      input.fileSizeBytes,
      input.checksumSha256,
      input.widthPx,
      input.heightPx,
      input.createdBy,
    ],
  )

  return mapWallpaperRow(result.rows[0])
}

export async function updateWallpaper(input: {
  id: string
  name: string
  description: string | null
  status: 'active' | 'archived'
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
  await query('delete from wallpapers where id = $1', [id])
}
