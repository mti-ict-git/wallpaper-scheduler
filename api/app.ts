import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import wallpaperRoutes from './routes/wallpapers.js'
import scheduleRoutes from './routes/schedules.js'
import publishRoutes from './routes/publish.js'
import configRoutes from './routes/config.js'
import dashboardRoutes from './routes/dashboard.js'
import operationsRoutes from './routes/operations.js'
import { MAX_UPLOAD_BYTES } from './lib/upload.js'
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
  // #region debug-point L:global-error-handler
  ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "preview-delete-regression", runId: "pre-fix", hypothesisId: "L", location: "api/app.ts:error-handler", msg: "[DEBUG] global error handler captured error", data: { error: error.message, stack: error.stack ?? null }, ts: Date.now() }) }).catch(() => {}) })()
  // #endregion

  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      success: false,
      error: `File upload terlalu besar. Maksimal ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB sebelum normalisasi.`,
    })
    return
  }

  if (
    error.message.includes('unsupported image format')
    || error.message.includes('Upload file harus berupa image yang valid')
    || error.message.includes('Input buffer')
    || error.message.includes('corrupt')
    || error.message.includes('libpng')
    || error.message.includes('heif')
  ) {
    res.status(400).json({
      success: false,
      error: 'File upload harus berupa image yang valid dan tidak rusak.',
    })
    return
  }

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
