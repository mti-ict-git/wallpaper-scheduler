import dotenv from 'dotenv'
import path from 'node:path'
import { resolveSecret } from './lib/secrets.js'

dotenv.config()

const rootDir = process.cwd()

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback
  }

  return value === 'true'
}

function buildDatabaseUrl() {
  const baseUrl = process.env.POSTGRES_URL
  if (!baseUrl) {
    throw new Error('POSTGRES_URL is required')
  }

  const parsed = new URL(baseUrl)
  parsed.username = process.env.POSTGRES_USERNAME ?? parsed.username
  parsed.password = resolveSecret({
    envKey: 'POSTGRES_PASSWORD',
    fileEnvKey: 'POSTGRES_PASSWORD_FILE',
    defaultValue: parsed.password,
  }).value
  parsed.pathname = `/${process.env.POSTGRES_DATABASE ?? parsed.pathname.replace('/', '')}`

  return parsed.toString()
}

export const appConfig = {
  port: toNumber(process.env.PORT, 3011),
  jwtSecret: resolveSecret({
    envKey: 'JWT_SECRET',
    fileEnvKey: 'JWT_SECRET_FILE',
    defaultValue: 'development-only-secret',
  }).value,
  uploadPath: path.resolve(rootDir, process.env.STORAGE_LOCAL_PATH ?? 'storage/wallpapers'),
  migrationsPath: path.resolve(rootDir, 'migrations'),
  sharedFolderPath: process.env.SHARED_FOLDER_PATH ?? '/app/scripts',
  cifsSharePath: process.env.CIFS_SHARE_PATH ?? '',
  schedulerPollIntervalSeconds: toNumber(process.env.SCHEDULER_POLL_INTERVAL_SECONDS, 30),
  publishRetryCount: toNumber(process.env.PUBLISH_RETRY_COUNT, 3),
  publishRetryDelaySeconds: toNumber(process.env.PUBLISH_RETRY_DELAY_SECONDS, 10),
  defaultTimezone: process.env.APP_DEFAULT_TIMEZONE ?? 'Asia/Jakarta',
  backupPath: path.resolve(rootDir, process.env.BACKUP_PATH ?? 'storage/backups'),
  auditRetentionDays: toNumber(process.env.AUDIT_RETENTION_DAYS, 90),
  publishJobRetentionDays: toNumber(process.env.PUBLISH_JOB_RETENTION_DAYS, 30),
  backupRetentionDays: toNumber(process.env.BACKUP_RETENTION_DAYS, 14),
  databaseUrl: buildDatabaseUrl(),
  databaseCreate: toBoolean(process.env.POSTGRES_CREATE_DATABASE, false),
  databaseSsl: toBoolean(process.env.POSTGRES_SSL, false),
  databaseSslRejectUnauthorized: toBoolean(process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED, false),
}
