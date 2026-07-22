import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { PublishProbeResult, ValidationReport } from '@shared/contracts'
import { appConfig } from '../config.js'
import { listBackups } from './backup-service.js'
import { buildPublishTargetFileName } from './publish-service.js'
import { validateShareAccess } from './share-service.js'

function sha256(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export async function generateValidationReport(): Promise<ValidationReport> {
  const shareAccess = await validateShareAccess()
  const backupSummary = await listBackups()
  const targetPath = buildPublishTargetFileName()

  const targetInfo = await fs
    .stat(targetPath)
    .then(async (stats) => {
      const buffer = await fs.readFile(targetPath)
      return {
        exists: true,
        checksumSha256: sha256(buffer),
        sizeBytes: stats.size,
        lastModifiedAt: stats.mtime.toISOString(),
      }
    })
    .catch(() => ({
      exists: false,
      checksumSha256: null,
      sizeBytes: null,
      lastModifiedAt: null,
    }))

  return {
    generatedAt: new Date().toISOString(),
    targetPath,
    shareAccess,
    publishTarget: targetInfo,
    runtime: {
      backupCount: backupSummary.backups.length,
      latestBackupAt: backupSummary.backups[0]?.createdAt ?? null,
      warnings: [
        ...(targetInfo.exists ? [] : ['Publish target file does not exist.']),
        ...(shareAccess.isWritable ? [] : ['Mounted share is not writable.']),
        ...(backupSummary.backups.length ? [] : ['No backup artifacts are available.']),
      ],
    },
  }
}

export async function runPublishProbe(): Promise<PublishProbeResult> {
  const startedAt = new Date().toISOString()
  const startedMs = Date.now()
  const targetDirectory = appConfig.sharedFolderPath
  const probeFileName = `.wallpaper-scheduler-probe-${Date.now()}.txt`
  const fullPath = path.join(targetDirectory, probeFileName)
  const payload = `probe:${new Date().toISOString()}`

  let writeSucceeded = false
  let readSucceeded = false
  let cleanupSucceeded = false
  let detail = 'Probe completed.'

  try {
    await fs.writeFile(fullPath, payload, 'utf8')
    writeSucceeded = true

    const readBack = await fs.readFile(fullPath, 'utf8')
    if (readBack !== payload) {
      throw new Error('Probe read-back content mismatch')
    }
    readSucceeded = true
  } catch (error) {
    detail = error instanceof Error ? error.message : 'Unknown probe error'
  } finally {
    try {
      await fs.rm(fullPath, { force: true })
      cleanupSucceeded = true
    } catch (error) {
      cleanupSucceeded = false
      detail = cleanupSucceeded ? detail : error instanceof Error ? error.message : detail
    }
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedMs,
    probeFileName,
    targetDirectory,
    writeSucceeded,
    readSucceeded,
    cleanupSucceeded,
    detail,
  }
}
