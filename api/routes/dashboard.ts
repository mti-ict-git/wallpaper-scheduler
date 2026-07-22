import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/require-auth.js'
import { listAuditLogs } from '../repositories/audit-repository.js'
import { loadDashboardOverview } from '../repositories/publish-repository.js'
import { getWorkerHeartbeat } from '../state/worker-state.js'

const router = Router()

router.use(requireAuth)

router.get('/overview', async (_request: Request, response: Response) => {
  const workerHeartbeat = await getWorkerHeartbeat()
  response.json(await loadDashboardOverview(workerHeartbeat.heartbeatAt))
})

router.get('/audit-logs', async (_request: Request, response: Response) => {
  response.json(await listAuditLogs())
})

export default router
