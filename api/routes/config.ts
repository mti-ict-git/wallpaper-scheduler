import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { writeAuditLog } from '../lib/audit.js'
import { requireAuth, requireRole } from '../middleware/require-auth.js'
import { getAppConfig, updateAppConfig } from '../repositories/config-repository.js'

const router = Router()

const configSchema = z.object({
  defaultTimezone: z.string().min(2),
  pollIntervalSeconds: z.number().int().min(5).max(3600),
  publishRetryCount: z.number().int().min(0).max(20),
  publishRetryDelaySeconds: z.number().int().min(1).max(3600),
  auditRetentionDays: z.number().int().min(1).max(3650),
  publishJobRetentionDays: z.number().int().min(1).max(3650),
  backupRetentionDays: z.number().int().min(1).max(3650),
  fallbackWallpaperId: z.string().uuid().nullable(),
  sharedFolderPath: z.string().min(1),
  cifsSharePath: z.string().min(1),
})

router.use(requireAuth)

router.get('/', async (_request: Request, response: Response) => {
  response.json(await getAppConfig())
})

router.patch('/', requireRole(['admin']), async (request: Request, response: Response) => {
  const parsed = configSchema.safeParse(request.body)
  if (!parsed.success || !request.authUser) {
    response.status(400).json({ error: parsed.success ? 'Unauthorized' : parsed.error.flatten() })
    return
  }

  const payload = parsed.data
  await updateAppConfig(
    {
      defaultTimezone: payload.defaultTimezone,
      pollIntervalSeconds: payload.pollIntervalSeconds,
      publishRetryCount: payload.publishRetryCount,
      publishRetryDelaySeconds: payload.publishRetryDelaySeconds,
      auditRetentionDays: payload.auditRetentionDays,
      publishJobRetentionDays: payload.publishJobRetentionDays,
      backupRetentionDays: payload.backupRetentionDays,
      fallbackWallpaperId: payload.fallbackWallpaperId,
      sharedFolderPath: payload.sharedFolderPath,
      cifsSharePath: payload.cifsSharePath,
    },
    request.authUser.id,
  )
  await writeAuditLog({
    actorType: 'user',
    actorUserId: request.authUser.id,
    action: 'config_updated',
    entityType: 'system_config',
    entityId: 'app_config',
    payloadJson: parsed.data,
  })

  response.json(parsed.data)
})

export default router
