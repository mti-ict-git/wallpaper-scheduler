import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { writeAuditLog } from '../lib/audit.js'
import { requireAuth } from '../middleware/require-auth.js'
import { createSchedule, deleteSchedule, listSchedules, updateSchedule } from '../repositories/schedule-repository.js'

const router = Router()

const scheduleSchema = z.object({
  wallpaperId: z.string().uuid(),
  name: z.string().min(2),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().nullable(),
  timezone: z.string().min(2),
  priority: z.number().int().min(0).max(999),
  enabled: z.boolean(),
})

router.use(requireAuth)

router.get('/', async (_request: Request, response: Response) => {
  response.json(await listSchedules())
})

router.post('/', async (request: Request, response: Response) => {
  const parsed = scheduleSchema.safeParse(request.body)
  if (!parsed.success || !request.authUser) {
    response.status(400).json({ error: parsed.success ? 'Unauthorized' : parsed.error.flatten() })
    return
  }

  const payload = parsed.data
  const scheduleId = await createSchedule({
    wallpaperId: payload.wallpaperId,
    name: payload.name,
    startAt: payload.startAt,
    endAt: payload.endAt,
    timezone: payload.timezone,
    priority: payload.priority,
    enabled: payload.enabled,
    createdBy: request.authUser.id,
  })

  await writeAuditLog({
    actorType: 'user',
    actorUserId: request.authUser.id,
    action: 'schedule_created',
    entityType: 'schedule',
    entityId: scheduleId,
    payloadJson: parsed.data,
  })

  response.status(201).json({ id: scheduleId })
})

router.patch('/:scheduleId', async (request: Request, response: Response) => {
  const parsed = scheduleSchema.safeParse(request.body)
  if (!parsed.success || !request.authUser) {
    response.status(400).json({ error: parsed.success ? 'Unauthorized' : parsed.error.flatten() })
    return
  }

  const payload = parsed.data
  await updateSchedule({
    id: request.params.scheduleId,
    wallpaperId: payload.wallpaperId,
    name: payload.name,
    startAt: payload.startAt,
    endAt: payload.endAt,
    timezone: payload.timezone,
    priority: payload.priority,
    enabled: payload.enabled,
  })

  await writeAuditLog({
    actorType: 'user',
    actorUserId: request.authUser.id,
    action: 'schedule_updated',
    entityType: 'schedule',
    entityId: request.params.scheduleId,
    payloadJson: parsed.data,
  })

  response.json({ success: true })
})

router.delete('/:scheduleId', async (request: Request, response: Response) => {
  if (!request.authUser) {
    response.status(401).json({ error: 'Unauthorized' })
    return
  }

  await deleteSchedule(request.params.scheduleId)
  await writeAuditLog({
    actorType: 'user',
    actorUserId: request.authUser.id,
    action: 'schedule_deleted',
    entityType: 'schedule',
    entityId: request.params.scheduleId,
    payloadJson: {},
  })

  response.status(204).send()
})

export default router
