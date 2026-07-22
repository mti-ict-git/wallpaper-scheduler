import path from 'node:path'
import { Router, type Request, type Response } from 'express'
import { requireAuth, requireRole } from '../middleware/require-auth.js'
import {
  createMetadataBackup,
  createPublishTargetBackup,
  listBackups,
  pruneExpiredArtifacts,
  runRestoreDrill,
  restoreMetadataBackup,
  restorePublishTargetBackup,
} from '../services/backup-service.js'
import { buildPublishTargetFileName } from '../services/publish-service.js'
import { getSecretHealth } from '../lib/secrets.js'
import { generateValidationReport, runPublishProbe } from '../services/validation-service.js'

const router = Router()

router.use(requireAuth, requireRole(['admin']))

router.get('/secret-health', async (_request: Request, response: Response) => {
  response.json(getSecretHealth())
})

router.get('/backups', async (_request: Request, response: Response) => {
  response.json(await listBackups())
})

router.get('/validation-report', async (_request: Request, response: Response) => {
  response.json(await generateValidationReport())
})

router.post('/publish-probe', async (_request: Request, response: Response) => {
  response.json(await runPublishProbe())
})

router.post('/backups/metadata', async (request: Request, response: Response) => {
  const fileName = await createMetadataBackup(request.authUser?.id ?? null)
  response.status(201).json({ fileName })
})

router.post('/backups/publish-target', async (request: Request, response: Response) => {
  const fileName = await createPublishTargetBackup(request.authUser?.id ?? null, buildPublishTargetFileName())
  response.status(201).json({ fileName })
})

router.post('/backups/restore-metadata', async (request: Request, response: Response) => {
  const fileName = String(request.body.fileName ?? '')
  await restoreMetadataBackup(fileName, request.authUser!.id)
  response.json({ success: true })
})

router.post('/backups/restore-publish-target', async (request: Request, response: Response) => {
  const fileName = path.basename(String(request.body.fileName ?? ''))
  await restorePublishTargetBackup(fileName, request.authUser!.id, buildPublishTargetFileName())
  response.json({ success: true })
})

router.post('/retention/prune', async (request: Request, response: Response) => {
  await pruneExpiredArtifacts(request.authUser?.id ?? null)
  response.json({ success: true })
})

router.post('/restore-drill', async (request: Request, response: Response) => {
  const fileName = path.basename(String(request.body.fileName ?? ''))
  const backupType = String(request.body.backupType ?? '') as 'metadata' | 'publish-target'
  response.json(
    await runRestoreDrill({
      fileName,
      backupType,
      actorUserId: request.authUser!.id,
      targetPath: buildPublishTargetFileName(),
    }),
  )
})

export default router
