import path from 'node:path'
import { Router, type Request, type Response } from 'express'
import { appConfig } from '../config.js'
import { writeAuditLog } from '../lib/audit.js'
import { requireAuth, requireRole } from '../middleware/require-auth.js'
import { createPublishJob, listPublishJobs, loadDashboardOverview } from '../repositories/publish-repository.js'
import { findWallpaperById } from '../repositories/wallpaper-repository.js'
import { getWorkerHeartbeat } from '../state/worker-state.js'
import { validateShareAccess } from '../services/share-service.js'

const router = Router()

router.use(requireAuth)

router.get('/jobs', async (_request: Request, response: Response) => {
  response.json(await listPublishJobs())
})

router.get('/status', async (_request: Request, response: Response) => {
  const workerHeartbeat = await getWorkerHeartbeat()
  response.json(await loadDashboardOverview(workerHeartbeat.heartbeatAt))
})

router.post('/validate-share-access', requireRole(['admin']), async (_request: Request, response: Response) => {
  response.json(await validateShareAccess())
})

router.post('/manual', requireRole(['admin']), async (request: Request, response: Response) => {
  const wallpaperId = String(request.body.wallpaperId ?? '')
  const wallpaper = await findWallpaperById(wallpaperId)

  if (!wallpaper || !request.authUser) {
    response.status(404).json({ error: 'Wallpaper tidak ditemukan' })
    return
  }

  if (wallpaper.status === 'deleted') {
    response.status(409).json({ error: 'Wallpaper sudah dihapus dan tidak bisa dipublish lagi' })
    return
  }

  const jobId = await createPublishJob({
    triggerType: 'manual',
    wallpaperId: wallpaper.id,
    scheduleId: null,
    triggeredBy: request.authUser.id,
    finalTargetPath: path.posix.join(appConfig.sharedFolderPath, 'Wallpaper.jpg'),
  })

  await writeAuditLog({
    actorType: 'user',
    actorUserId: request.authUser.id,
    action: 'manual_publish_triggered',
    entityType: 'publish_job',
    entityId: jobId,
    payloadJson: { wallpaperId: wallpaper.id },
  })

  response.status(202).json({ id: jobId })
})

export default router
