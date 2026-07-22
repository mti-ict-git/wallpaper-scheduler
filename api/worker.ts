import { appConfig } from './config.js'
import { writeAuditLog } from './lib/audit.js'
import { ensureStorageDirectories, runMigrations } from './lib/database.js'
import { claimNextPublishJob, createPublishJob, listPublishJobs } from './repositories/publish-repository.js'
import { listSchedules } from './repositories/schedule-repository.js'
import { getAppConfig } from './repositories/config-repository.js'
import { findWallpaperById } from './repositories/wallpaper-repository.js'
import { markWorkerHeartbeat } from './state/worker-state.js'
import { selectActiveSchedule } from '@shared/scheduler'
import { buildPublishTargetFileName, executePublishJob } from './services/publish-service.js'
import { validateShareAccess } from './services/share-service.js'
import { pruneExpiredArtifacts } from './services/backup-service.js'

let isWorking = false

async function processScheduleActivation() {
  const config = await getAppConfig()
  const schedules = await listSchedules()
  const activeSchedule = selectActiveSchedule(schedules, new Date().toISOString())

  if (!activeSchedule) {
    if (!config.fallbackWallpaperId) {
      return
    }

    const jobs = await listPublishJobs()
    const fallbackPublished = jobs.find(
      (job) => job.wallpaperId === config.fallbackWallpaperId && job.status !== 'failed',
    )

    if (fallbackPublished) {
      return
    }

    const fallbackWallpaper = await findWallpaperById(config.fallbackWallpaperId)
    if (!fallbackWallpaper) {
      return
    }

    await createPublishJob({
      triggerType: 'schedule',
      wallpaperId: fallbackWallpaper.id,
      scheduleId: null,
      triggeredBy: null,
      finalTargetPath: buildPublishTargetFileName(),
    })
    return
  }

  const jobs = await listPublishJobs()
  const latestJob = jobs.find(
    (job) =>
      job.wallpaperId === activeSchedule.wallpaperId &&
      job.scheduleId === activeSchedule.id &&
      (job.status === 'success' || job.status === 'running' || job.status === 'pending'),
  )

  if (latestJob) {
    return
  }

  const wallpaper = await findWallpaperById(activeSchedule.wallpaperId)
  if (!wallpaper) {
    return
  }

  await createPublishJob({
    triggerType: 'schedule',
    wallpaperId: wallpaper.id,
    scheduleId: activeSchedule.id,
    triggeredBy: null,
    finalTargetPath: buildPublishTargetFileName(),
  })
}

async function processPendingPublishJob() {
  const config = await getAppConfig()
  const claimedJobId = await claimNextPublishJob()
  if (!claimedJobId) {
    return
  }

  await executePublishJob(claimedJobId, config.publishRetryCount, config.publishRetryDelaySeconds)
}

async function runWorkerCycle() {
  if (isWorking) {
    return
  }

  isWorking = true
  await markWorkerHeartbeat('running')

  try {
    await validateShareAccess()
    await processScheduleActivation()
    await processPendingPublishJob()
    await pruneExpiredArtifacts(null)
    await markWorkerHeartbeat('idle')
  } catch (error) {
    await writeAuditLog({
      actorType: 'system',
      actorUserId: null,
      action: 'worker_cycle_failed',
      entityType: 'worker',
      entityId: 'scheduler-worker',
      payloadJson: { message: error instanceof Error ? error.message : 'Unknown worker error' },
    })
    await markWorkerHeartbeat('error')
  } finally {
    isWorking = false
  }
}

async function startWorker() {
  await ensureStorageDirectories()
  await runMigrations()
  await getAppConfig()
  await validateShareAccess()

  console.log(`Worker started. Poll interval: ${appConfig.schedulerPollIntervalSeconds}s`)
  await runWorkerCycle()

  setInterval(() => {
    void runWorkerCycle()
  }, appConfig.schedulerPollIntervalSeconds * 1000)
}

startWorker().catch((error) => {
  console.error('Worker failed to start', error)
  process.exit(1)
})
