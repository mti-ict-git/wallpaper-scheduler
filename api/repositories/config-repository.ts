import type { AppConfig } from '@shared/contracts'
import { appConfig } from '../config.js'
import { query } from '../lib/database.js'

type ConfigRow = {
  key: string
  value_json: unknown
}

const defaultConfig: AppConfig = {
  defaultTimezone: appConfig.defaultTimezone,
  pollIntervalSeconds: appConfig.schedulerPollIntervalSeconds,
  publishRetryCount: appConfig.publishRetryCount,
  publishRetryDelaySeconds: appConfig.publishRetryDelaySeconds,
  auditRetentionDays: appConfig.auditRetentionDays,
  publishJobRetentionDays: appConfig.publishJobRetentionDays,
  backupRetentionDays: appConfig.backupRetentionDays,
  fallbackWallpaperId: null,
  sharedFolderPath: appConfig.sharedFolderPath,
  cifsSharePath: appConfig.cifsSharePath,
}

export async function ensureDefaultConfig(userId: string | null) {
  await query(
    `
      insert into system_config (key, value_json, updated_by)
      values ('app_config', $1::jsonb, $2)
      on conflict (key) do nothing
    `,
    [JSON.stringify(defaultConfig), userId],
  )
}

export async function getAppConfig() {
  const result = await query<ConfigRow>('select * from system_config where key = $1', ['app_config'])
  if (!result.rowCount) {
    return defaultConfig
  }

  return result.rows[0].value_json as AppConfig
}

export async function updateAppConfig(config: AppConfig, userId: string) {
  await query(
    `
      insert into system_config (key, value_json, updated_by)
      values ('app_config', $1::jsonb, $2)
      on conflict (key)
      do update set value_json = excluded.value_json, updated_by = excluded.updated_by, updated_at = now()
    `,
    [JSON.stringify(config), userId],
  )
}
