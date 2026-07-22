import fs from 'node:fs/promises'
import path from 'node:path'
import { Pool, type PoolConfig, type QueryResultRow } from 'pg'
import { appConfig } from '../config.js'

const ssl = appConfig.databaseSsl
  ? {
      rejectUnauthorized: appConfig.databaseSslRejectUnauthorized,
    }
  : undefined

const poolConfig: PoolConfig = {
  connectionString: appConfig.databaseUrl,
  ssl,
}

export const db = new Pool(poolConfig)

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return db.query<T>(text, values)
}

export async function ensureStorageDirectories() {
  await fs.mkdir(appConfig.uploadPath, { recursive: true })
  await fs.mkdir(path.join(appConfig.uploadPath, '.tmp'), { recursive: true })
}

export async function runMigrations() {
  const migrationFiles = (await fs.readdir(appConfig.migrationsPath))
    .filter((file) => file.endsWith('.sql'))
    .sort()

  await query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `)

  for (const fileName of migrationFiles) {
    const migrationId = fileName
    const migrationPath = path.join(appConfig.migrationsPath, fileName)
    const sql = await fs.readFile(migrationPath, 'utf8')
    const exists = await query<{ id: string }>('select id from schema_migrations where id = $1', [migrationId])

    if (exists.rowCount) {
      continue
    }

    await query('begin')

    try {
      await query(sql)
      await query('insert into schema_migrations (id) values ($1)', [migrationId])
      await query('commit')
    } catch (error) {
      await query('rollback')
      throw error
    }
  }
}
