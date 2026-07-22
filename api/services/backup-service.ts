import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { BackupRecord, BackupSummary, RestoreDrillResult } from '@shared/contracts'
import { appConfig } from '../config.js'
import { db, query } from '../lib/database.js'
import { writeAuditLog } from '../lib/audit.js'

function buildBackupId() {
  return crypto.randomUUID()
}

async function ensureBackupDirectory() {
  await fs.mkdir(appConfig.backupPath, { recursive: true })
}

async function getFileStats(filePath: string) {
  const stats = await fs.stat(filePath)
  return {
    sizeBytes: stats.size,
    createdAt: stats.mtime.toISOString(),
  }
}

export async function listBackups(): Promise<BackupSummary> {
  await ensureBackupDirectory()
  const entries = await fs.readdir(appConfig.backupPath)
  const backupFiles = await Promise.all(
    entries
      .filter((entry) => entry.endsWith('.json') || entry.endsWith('.jpg') || entry.endsWith('.jpeg'))
      .map(async (entry) => {
        const fullPath = path.join(appConfig.backupPath, entry)
        const stats = await getFileStats(fullPath)
        return {
          id: entry,
          type: entry.endsWith('.jpg') || entry.endsWith('.jpeg') ? 'publish-target' : 'metadata',
          fileName: entry,
          createdAt: stats.createdAt,
          sizeBytes: stats.sizeBytes,
        } satisfies BackupRecord
      }),
  )

  return {
    backups: backupFiles.sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    backupDirectory: appConfig.backupPath,
  }
}

export async function createMetadataBackup(actorUserId: string | null) {
  await ensureBackupDirectory()
  const backupId = buildBackupId()
  const fileName = `metadata-${new Date().toISOString().replace(/[:.]/g, '-')}-${backupId}.json`
  const fullPath = path.join(appConfig.backupPath, fileName)

  const tables = ['users', 'wallpapers', 'schedules', 'publish_jobs', 'active_wallpaper_state', 'system_config', 'audit_logs'] as const
  const payload: {
    exportedAt: string
    tables: Record<string, unknown[]>
  } = {
    exportedAt: new Date().toISOString(),
    tables: {},
  }

  for (const table of tables) {
    const result = await query<Record<string, unknown>>(`select row_to_json(t) as row from (select * from ${table}) t`)
    payload.tables[table] = result.rows.map((row) => row.row)
  }

  await fs.writeFile(fullPath, JSON.stringify(payload, null, 2), 'utf8')

  await writeAuditLog({
    actorType: actorUserId ? 'user' : 'system',
    actorUserId,
    action: 'metadata_backup_created',
    entityType: 'backup',
    entityId: fileName,
    payloadJson: { fileName },
  })

  return fileName
}

export async function createPublishTargetBackup(actorUserId: string | null, targetPath: string) {
  await ensureBackupDirectory()
  const targetExists = await fs
    .access(targetPath)
    .then(() => true)
    .catch(() => false)

  if (!targetExists) {
    throw new Error('Publish target file does not exist')
  }

  const fileName = `publish-target-${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`
  const backupPath = path.join(appConfig.backupPath, fileName)
  await fs.copyFile(targetPath, backupPath)

  await writeAuditLog({
    actorType: actorUserId ? 'user' : 'system',
    actorUserId,
    action: 'publish_target_backup_created',
    entityType: 'backup',
    entityId: fileName,
    payloadJson: { fileName, targetPath },
  })

  return fileName
}

export async function restoreMetadataBackup(fileName: string, actorUserId: string) {
  await ensureBackupDirectory()
  const fullPath = path.join(appConfig.backupPath, fileName)
  const raw = await fs.readFile(fullPath, 'utf8')
  const payload = JSON.parse(raw) as {
    tables: Record<string, Record<string, unknown>[]>
  }

  const client = await db.connect()
  try {
    await client.query('begin')
    const restoreOrder = ['audit_logs', 'publish_jobs', 'active_wallpaper_state', 'schedules', 'wallpapers', 'system_config', 'users']
    const insertOrder = ['users', 'wallpapers', 'schedules', 'system_config', 'publish_jobs', 'active_wallpaper_state', 'audit_logs']

    for (const table of restoreOrder) {
      await client.query(`delete from ${table}`)
    }

    for (const table of insertOrder) {
      const rows = payload.tables[table] ?? []
      for (const row of rows) {
        const columns = Object.keys(row)
        const values = Object.values(row)
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ')
        await client.query(
          `insert into ${table} (${columns.join(', ')}) values (${placeholders})`,
          values,
        )
      }
    }

    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }

  await writeAuditLog({
    actorType: 'user',
    actorUserId,
    action: 'metadata_backup_restored',
    entityType: 'backup',
    entityId: fileName,
    payloadJson: { fileName },
  })
}

export async function restorePublishTargetBackup(fileName: string, actorUserId: string, targetPath: string) {
  await ensureBackupDirectory()
  const sourcePath = path.join(appConfig.backupPath, fileName)
  await fs.copyFile(sourcePath, targetPath)

  await writeAuditLog({
    actorType: 'user',
    actorUserId,
    action: 'publish_target_backup_restored',
    entityType: 'backup',
    entityId: fileName,
    payloadJson: { fileName, targetPath },
  })
}

export async function runRestoreDrill(input: {
  fileName: string
  backupType: 'metadata' | 'publish-target'
  actorUserId: string
  targetPath: string
}): Promise<RestoreDrillResult> {
  const startedAt = new Date().toISOString()
  const startTime = Date.now()

  try {
    if (input.backupType === 'metadata') {
      await restoreMetadataBackup(input.fileName, input.actorUserId)
    } else {
      await restorePublishTargetBackup(input.fileName, input.actorUserId, input.targetPath)
    }

    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      backupFileName: input.fileName,
      backupType: input.backupType,
      success: true,
      detail: 'Restore drill completed successfully',
    }
  } catch (error) {
    return {
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      backupFileName: input.fileName,
      backupType: input.backupType,
      success: false,
      detail: error instanceof Error ? error.message : 'Unknown restore drill error',
    }
  }
}

export async function pruneExpiredArtifacts(actorUserId: string | null) {
  const configRetentionMs = appConfig.backupRetentionDays * 24 * 60 * 60 * 1000
  await ensureBackupDirectory()
  const entries = await fs.readdir(appConfig.backupPath)
  const now = Date.now()

  for (const entry of entries) {
    const fullPath = path.join(appConfig.backupPath, entry)
    const stats = await fs.stat(fullPath)
    if (now - stats.mtimeMs > configRetentionMs) {
      await fs.rm(fullPath, { force: true, recursive: true })
    }
  }

  await query('delete from audit_logs where created_at < now() - make_interval(days => $1)', [appConfig.auditRetentionDays])
  await query('delete from publish_jobs where created_at < now() - make_interval(days => $1)', [appConfig.publishJobRetentionDays])

  await writeAuditLog({
    actorType: actorUserId ? 'user' : 'system',
    actorUserId,
    action: 'retention_prune_executed',
    entityType: 'retention',
    entityId: 'system',
    payloadJson: {
      backupRetentionDays: appConfig.backupRetentionDays,
      auditRetentionDays: appConfig.auditRetentionDays,
      publishJobRetentionDays: appConfig.publishJobRetentionDays,
    },
  })
}
