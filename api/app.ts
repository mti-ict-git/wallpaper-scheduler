import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import wallpaperRoutes from './routes/wallpapers.js'
import scheduleRoutes from './routes/schedules.js'
import publishRoutes from './routes/publish.js'
import configRoutes from './routes/config.js'
import dashboardRoutes from './routes/dashboard.js'
import operationsRoutes from './routes/operations.js'
import { getWorkerHeartbeat } from './state/worker-state.js'
import { validateShareAccess } from './services/share-service.js'
import { getSecretHealth } from './lib/secrets.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/storage', express.static(path.resolve(process.cwd(), 'storage')))

app.use('/api/auth', authRoutes)
app.use('/api/wallpapers', wallpaperRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/publish', publishRoutes)
app.use('/api/config', configRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/operations', operationsRoutes)

app.use(
  '/api/health',
  async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const workerHeartbeat = await getWorkerHeartbeat()
    const shareStatus = await validateShareAccess()

    res.status(200).json({
      success: true,
      message: 'ok',
      details: {
        workerHeartbeatAt: workerHeartbeat.heartbeatAt,
        workerStatus: workerHeartbeat.status,
        shareAccess: shareStatus,
        secretHealth: getSecretHealth(),
      },
    })
  },
)

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
