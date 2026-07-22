import fs from 'node:fs/promises'
import path from 'node:path'
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { writeAuditLog } from '../lib/audit.js'
import { normalizeWallpaperImage } from '../lib/image-processing.js'
import { uploadMiddleware } from '../lib/upload.js'
import { requireAuth } from '../middleware/require-auth.js'
import {
  createWallpaper,
  deleteWallpaper,
  findWallpaperById,
  listWallpapers,
  updateWallpaper,
} from '../repositories/wallpaper-repository.js'

const router = Router()

const updateSchema = z.object({
  name: z.string().min(2),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'archived']),
})

router.use(requireAuth)

router.get('/', async (_request: Request, response: Response) => {
  response.json(await listWallpapers())
})

router.get('/:wallpaperId/preview', async (request: Request, response: Response) => {
  const wallpaper = await findWallpaperById(request.params.wallpaperId)
  if (!wallpaper) {
    response.status(404).json({ error: 'Wallpaper tidak ditemukan' })
    return
  }

  if (wallpaper.imageBlob) {
    response.setHeader('Content-Type', wallpaper.mimeType)
    response.setHeader('Cache-Control', 'private, max-age=60')
    response.send(wallpaper.imageBlob)
    return
  }

  if (wallpaper.storagePath) {
    response.sendFile(path.resolve(wallpaper.storagePath))
    return
  }

  response.status(404).json({ error: 'Wallpaper preview is unavailable' })
})

router.post('/', uploadMiddleware.single('file'), async (request: Request, response: Response) => {
  const file = request.file
  const authUser = request.authUser

  if (!file || !authUser) {
    response.status(400).json({ error: 'File upload wajib diisi' })
    return
  }

  const normalizedImage = await normalizeWallpaperImage(file.buffer)
  const requestedName = typeof request.body.name === 'string' ? request.body.name.trim() : ''

  const wallpaper = await createWallpaper({
    name: requestedName || file.originalname,
    description: request.body.description ? String(request.body.description) : null,
    originalFilename: file.originalname,
    mimeType: normalizedImage.mimeType,
    fileSizeBytes: normalizedImage.fileSizeBytes,
    checksumSha256: normalizedImage.checksumSha256,
    widthPx: normalizedImage.widthPx,
    heightPx: normalizedImage.heightPx,
    imageBuffer: normalizedImage.imageBuffer,
    createdBy: authUser.id,
  })

  await writeAuditLog({
    actorType: 'user',
    actorUserId: authUser.id,
    action: 'wallpaper_uploaded',
    entityType: 'wallpaper',
    entityId: wallpaper.id,
    payloadJson: { name: wallpaper.name },
  })

  response.status(201).json(wallpaper)
})

router.patch('/:wallpaperId', async (request: Request, response: Response) => {
  const parsed = updateSchema.safeParse(request.body)
  if (!parsed.success || !request.authUser) {
    response.status(400).json({ error: parsed.success ? 'Unauthorized' : parsed.error.flatten() })
    return
  }

  const wallpaper = await updateWallpaper({
    id: request.params.wallpaperId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    status: parsed.data.status,
  })

  if (!wallpaper) {
    response.status(404).json({ error: 'Wallpaper tidak ditemukan' })
    return
  }

  await writeAuditLog({
    actorType: 'user',
    actorUserId: request.authUser.id,
    action: 'wallpaper_updated',
    entityType: 'wallpaper',
    entityId: wallpaper.id,
    payloadJson: parsed.data,
  })

  response.json(wallpaper)
})

router.delete('/:wallpaperId', async (request: Request, response: Response) => {
  // #region debug-point G:delete-wallpaper-route-entry
  ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "delete-wallpaper-crash", runId: "pre-fix", hypothesisId: "G", location: "api/routes/wallpapers.ts:delete", msg: "[DEBUG] delete wallpaper route entry", data: { wallpaperId: request.params.wallpaperId, hasAuthUser: Boolean(request.authUser) }, ts: Date.now() }) }).catch(() => {}) })()
  // #endregion
  if (!request.authUser) {
    response.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const deleted = await deleteWallpaper(request.params.wallpaperId)
    // #region debug-point H:delete-wallpaper-route-after-delete
    ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "delete-wallpaper-crash", runId: "pre-fix", hypothesisId: "H", location: "api/routes/wallpapers.ts:delete:after-delete", msg: "[DEBUG] delete wallpaper route after repository call", data: { wallpaperId: request.params.wallpaperId, deleted }, ts: Date.now() }) }).catch(() => {}) })()
    // #endregion
    if (!deleted) {
      response.status(404).json({ error: 'Wallpaper tidak ditemukan' })
      return
    }

    await writeAuditLog({
      actorType: 'user',
      actorUserId: request.authUser.id,
      action: 'wallpaper_deleted',
      entityType: 'wallpaper',
      entityId: request.params.wallpaperId,
      payloadJson: {},
    })
    // #region debug-point I:delete-wallpaper-route-audit
    ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "delete-wallpaper-crash", runId: "pre-fix", hypothesisId: "I", location: "api/routes/wallpapers.ts:delete:audit", msg: "[DEBUG] delete wallpaper route audit log success", data: { wallpaperId: request.params.wallpaperId }, ts: Date.now() }) }).catch(() => {}) })()
    // #endregion

    response.status(204).send()
  } catch (error) {
    // #region debug-point J:delete-wallpaper-route-catch
    ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "delete-wallpaper-crash", runId: "pre-fix", hypothesisId: "J", location: "api/routes/wallpapers.ts:delete:catch", msg: "[DEBUG] delete wallpaper route catch", data: { wallpaperId: request.params.wallpaperId, error: error instanceof Error ? error.message : String(error) }, ts: Date.now() }) }).catch(() => {}) })()
    // #endregion
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Delete wallpaper gagal',
    })
  }
})

export default router
