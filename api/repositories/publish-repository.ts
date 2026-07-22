import type { DashboardOverview, PublishJobRecord } from '@shared/contracts'
import { appConfig } from '../config.js'
import { query } from '../lib/database.js'
import { listSchedules } from './schedule-repository.js'
import { getRuntimeStatus } from './runtime-status-repository.js'

type PublishJobRow = {
  id: string
  status: 'pending' | 'running' | 'success' | 'failed'
  trigger_type: 'schedule' | 'manual'
  wallpaper_id: string
  wallpaper_name: string
  schedule_id: string | null
  attempt_count: number
  next_attempt_at: Date | null
  error_code: string | null
  error_message: string | null
  created_at: Date
  finished_at: Date | null
}

function mapPublishJob(row: PublishJobRow): PublishJobRecord {
  return {
    id: row.id,
    status: row.status,
    triggerType: row.trigger_type,
    wallpaperId: row.wallpaper_id,
    wallpaperName: row.wallpaper_name,
    scheduleId: row.schedule_id,
    attemptCount: Number(row.attempt_count),
    nextAttemptAt: row.next_attempt_at?.toISOString() ?? null,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    createdAt: row.created_at.toISOString(),
    finishedAt: row.finished_at?.toISOString() ?? null,
  }
}

export async function listPublishJobs() {
  const result = await query<PublishJobRow>(
    `
      select
        pj.*,
        w.name as wallpaper_name
      from publish_jobs pj
      inner join wallpapers w on w.id = pj.wallpaper_id
      order by pj.created_at desc
      limit 50
    `,
  )

  return result.rows.map(mapPublishJob)
}

export async function createPublishJob(input: {
  triggerType: 'schedule' | 'manual'
  wallpaperId: string
  scheduleId: string | null
  triggeredBy: string | null
  sourceStoragePath: string
  finalTargetPath: string
}) {
  const result = await query<{ id: string }>(
    `
      insert into publish_jobs (trigger_type, triggered_by, wallpaper_id, schedule_id, status, source_storage_path, final_target_path)
      values ($1, $2, $3, $4, 'pending', $5, $6)
      returning id
    `,
    [input.triggerType, input.triggeredBy, input.wallpaperId, input.scheduleId, input.sourceStoragePath, input.finalTargetPath],
  )

  return result.rows[0]?.id as string
}

export async function claimNextPublishJob() {
  const result = await query<{ id: string }>(
    `
      update publish_jobs
      set status = 'running', started_at = now(), attempt_count = attempt_count + 1
      where id = (
        select id
        from publish_jobs
        where (status = 'pending' or status = 'failed')
          and next_attempt_at <= now()
        order by created_at asc, next_attempt_at asc
        for update skip locked
        limit 1
      )
      returning id
    `,
  )

  return result.rows[0]?.id ?? null
}

export async function getPublishJobById(id: string) {
  const result = await query<
    PublishJobRow & { source_storage_path: string; final_target_path: string; checksum_sha256: string | null; staging_target_path: string | null }
  >(
    `
      select
        pj.*,
        w.name as wallpaper_name
      from publish_jobs pj
      inner join wallpapers w on w.id = pj.wallpaper_id
      where pj.id = $1
      limit 1
    `,
    [id],
  )

  return result.rows[0] ?? null
}

export async function markPublishJobSuccess(input: { jobId: string; stagingTargetPath: string; checksumSha256: string }) {
  await query(
    `
      update publish_jobs
      set status = 'success', staging_target_path = $2, checksum_sha256 = $3, finished_at = now()
      where id = $1
    `,
    [input.jobId, input.stagingTargetPath, input.checksumSha256],
  )
}

export async function markPublishJobFailed(input: { jobId: string; errorCode: string; errorMessage: string }) {
  await query(
    `
      update publish_jobs
      set status = 'failed', error_code = $2, error_message = $3, finished_at = now(), last_error_at = now()
      where id = $1
    `,
    [input.jobId, input.errorCode, input.errorMessage],
  )
}

export async function reschedulePublishJob(input: { jobId: string; retryDelaySeconds: number; errorCode: string; errorMessage: string }) {
  await query(
    `
      update publish_jobs
      set status = 'failed',
          error_code = $2,
          error_message = $3,
          last_error_at = now(),
          next_attempt_at = now() + make_interval(secs => $4),
          finished_at = now()
      where id = $1
    `,
    [input.jobId, input.errorCode, input.errorMessage, input.retryDelaySeconds],
  )
}

export async function updateActiveWallpaperState(input: {
  wallpaperId: string
  scheduleId: string | null
  publishJobId: string
}) {
  await query(
    `
      update active_wallpaper_state
      set wallpaper_id = $2,
          schedule_id = $3,
          publish_job_id = $4,
          effective_at_utc = now(),
          updated_at = now()
      where id = 1
    `,
    [1, input.wallpaperId, input.scheduleId, input.publishJobId],
  )
}

export async function loadDashboardOverview(workerLastHeartbeatAt: string | null): Promise<DashboardOverview> {
  const activeState = await query<{
    wallpaper_id: string | null
    wallpaper_name: string | null
    schedule_id: string | null
    schedule_name: string | null
    effective_at_utc: Date | null
  }>(
    `
      select
        aws.wallpaper_id,
        w.name as wallpaper_name,
        aws.schedule_id,
        s.name as schedule_name,
        aws.effective_at_utc
      from active_wallpaper_state aws
      left join wallpapers w on w.id = aws.wallpaper_id
      left join schedules s on s.id = aws.schedule_id
      where aws.id = 1
      limit 1
    `,
  )

  const jobs = await listPublishJobs()
  const schedules = await listSchedules()
  const shareAccessStatus = await getRuntimeStatus<{ isWritable: boolean; detail: string | null }>('share_access')

  const counters = await query<{ failed_count: string; pending_count: string }>(
    `
      select
        count(*) filter (where status = 'failed')::text as failed_count,
        count(*) filter (where status = 'pending' or status = 'running')::text as pending_count
      from publish_jobs
    `,
  )

  const heartbeatStatus = await getRuntimeStatus<{ heartbeatAt: string; status: 'idle' | 'running' | 'error' }>('worker_heartbeat')

  return {
    activeWallpaper: {
      wallpaperId: activeState.rows[0]?.wallpaper_id ?? null,
      wallpaperName: activeState.rows[0]?.wallpaper_name ?? null,
      scheduleId: activeState.rows[0]?.schedule_id ?? null,
      scheduleName: activeState.rows[0]?.schedule_name ?? null,
      effectiveAt: activeState.rows[0]?.effective_at_utc?.toISOString() ?? null,
    },
    lastPublish: jobs[0] ?? null,
    workerLastHeartbeatAt,
    schedulerStatus: heartbeatStatus?.value.status ?? 'idle',
    shareAccess: {
      lastCheckedAt: shareAccessStatus?.updatedAt ?? null,
      isWritable: shareAccessStatus?.value.isWritable ?? null,
      detail: shareAccessStatus?.value.detail ?? null,
    },
    failedJobCount: Number(counters.rows[0]?.failed_count ?? '0'),
    pendingJobCount: Number(counters.rows[0]?.pending_count ?? '0'),
    nextSchedules: schedules.filter((schedule) => new Date(schedule.startAt).getTime() >= Date.now()).slice(0, 5),
    targetPath: `${appConfig.sharedFolderPath}/Wallpaper.jpg`,
  }
}
