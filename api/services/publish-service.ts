import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { appConfig } from '../config.js'
import { writeAuditLog } from '../lib/audit.js'
import {
  getPublishJobById,
  markPublishJobFailed,
  markPublishJobSuccess,
  reschedulePublishJob,
  updateActiveWallpaperState,
} from '../repositories/publish-repository.js'
import { validateShareAccess } from './share-service.js'

function computeBufferSha256(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export async function executePublishJob(jobId: string, maxRetryCount: number, retryDelaySeconds: number) {
  const job = await getPublishJobById(jobId)
  if (!job) {
    return
  }

  const shareStatus = await validateShareAccess()
  if (!shareStatus.isWritable) {
    if (job.attempt_count < maxRetryCount) {
      await reschedulePublishJob({
        jobId: job.id,
        retryDelaySeconds,
        errorCode: 'share_unavailable',
        errorMessage: shareStatus.detail ?? 'Target share is not writable',
      })
    } else {
      await markPublishJobFailed({
        jobId: job.id,
        errorCode: 'share_unavailable',
        errorMessage: shareStatus.detail ?? 'Target share is not writable',
      })
    }
    return
  }

  const sourceBuffer = await fs.readFile(job.source_storage_path)
  const checksumSha256 = computeBufferSha256(sourceBuffer)
  const finalTargetPath = job.final_target_path
  const stagingTargetPath = `${finalTargetPath}.tmp`
  const backupTargetPath = `${finalTargetPath}.bak`

  try {
    await fs.writeFile(stagingTargetPath, sourceBuffer)

    const stagedBuffer = await fs.readFile(stagingTargetPath)
    if (computeBufferSha256(stagedBuffer) !== checksumSha256) {
      throw new Error('Staging checksum mismatch')
    }

    const finalExists = await fs
      .access(finalTargetPath)
      .then(() => true)
      .catch(() => false)

    if (finalExists) {
      await fs.copyFile(finalTargetPath, backupTargetPath)
    }

    await fs.rename(stagingTargetPath, finalTargetPath)

    const finalBuffer = await fs.readFile(finalTargetPath)
    if (computeBufferSha256(finalBuffer) !== checksumSha256) {
      throw new Error('Final checksum mismatch')
    }

    await markPublishJobSuccess({
      jobId: job.id,
      stagingTargetPath,
      checksumSha256,
    })

    await updateActiveWallpaperState({
      wallpaperId: job.wallpaper_id,
      scheduleId: job.schedule_id,
      publishJobId: job.id,
    })

    await writeAuditLog({
      actorType: 'system',
      actorUserId: null,
      action: 'publish_completed',
      entityType: 'publish_job',
      entityId: job.id,
      payloadJson: {
        finalTargetPath,
        checksumSha256,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown publish error'

    const backupExists = await fs
      .access(backupTargetPath)
      .then(() => true)
      .catch(() => false)

    if (backupExists) {
      await fs.copyFile(backupTargetPath, finalTargetPath)
    }

    await fs.rm(stagingTargetPath, { force: true })

    if (job.attempt_count < maxRetryCount) {
      await reschedulePublishJob({
        jobId: job.id,
        retryDelaySeconds,
        errorCode: 'publish_failed',
        errorMessage: message,
      })
    } else {
      await markPublishJobFailed({
        jobId: job.id,
        errorCode: 'publish_failed',
        errorMessage: message,
      })
    }
  }
}

export function buildPublishTargetFileName() {
  return path.posix.join(appConfig.sharedFolderPath, 'Wallpaper.jpg')
}
