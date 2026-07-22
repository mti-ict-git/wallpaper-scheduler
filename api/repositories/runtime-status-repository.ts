import { query } from '../lib/database.js'

type RuntimeStatusRow = {
  key: string
  value_json: unknown
  updated_at: Date
}

export async function setRuntimeStatus(key: string, value: unknown) {
  await query(
    `
      insert into runtime_status (key, value_json, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (key)
      do update set value_json = excluded.value_json, updated_at = now()
    `,
    [key, JSON.stringify(value)],
  )
}

export async function getRuntimeStatus<T>(key: string): Promise<{ value: T; updatedAt: string } | null> {
  const result = await query<RuntimeStatusRow>('select * from runtime_status where key = $1 limit 1', [key])
  const row = result.rows[0]

  if (!row) {
    return null
  }

  return {
    value: row.value_json as T,
    updatedAt: row.updated_at.toISOString(),
  }
}
