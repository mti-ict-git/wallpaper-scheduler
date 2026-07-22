import type { ScheduleRecord } from '@shared/contracts'
import { detectScheduleConflict } from '@shared/scheduler'
import { query } from '../lib/database.js'

type ScheduleRow = {
  id: string
  wallpaper_id: string
  wallpaper_name: string
  name: string
  start_at_utc: Date
  end_at_utc: Date | null
  timezone: string
  priority: number
  enabled: boolean
  created_at: Date
}

function mapScheduleRow(row: ScheduleRow, hasConflict: boolean): ScheduleRecord {
  return {
    id: row.id,
    wallpaperId: row.wallpaper_id,
    wallpaperName: row.wallpaper_name,
    name: row.name,
    startAt: row.start_at_utc.toISOString(),
    endAt: row.end_at_utc?.toISOString() ?? null,
    timezone: row.timezone,
    priority: Number(row.priority),
    enabled: row.enabled,
    hasConflict,
    createdAt: row.created_at.toISOString(),
  }
}

async function loadSchedules() {
  const result = await query<ScheduleRow>(
    `
      select
        s.*,
        w.name as wallpaper_name
      from schedules s
      inner join wallpapers w on w.id = s.wallpaper_id
      where w.status <> 'deleted'
      order by s.start_at_utc asc
    `,
  )

  return result.rows
}

export async function listSchedules() {
  const rows = await loadSchedules()

  return rows.map((row) =>
    mapScheduleRow(
      row,
      detectScheduleConflict(
        {
          id: row.id,
          startAt: row.start_at_utc.toISOString(),
          endAt: row.end_at_utc?.toISOString() ?? null,
          enabled: row.enabled,
        },
        rows.map((candidate) => ({
          id: candidate.id,
          startAt: candidate.start_at_utc.toISOString(),
          endAt: candidate.end_at_utc?.toISOString() ?? null,
          enabled: candidate.enabled,
        })),
      ),
    ),
  )
}

export async function createSchedule(input: {
  wallpaperId: string
  name: string
  startAt: string
  endAt: string | null
  timezone: string
  priority: number
  enabled: boolean
  createdBy: string
}) {
  const result = await query(
    `
      insert into schedules (wallpaper_id, name, start_at_utc, end_at_utc, timezone, priority, enabled, created_by)
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      returning id
    `,
    [
      input.wallpaperId,
      input.name,
      input.startAt,
      input.endAt,
      input.timezone,
      input.priority,
      input.enabled,
      input.createdBy,
    ],
  )

  return result.rows[0]?.id as string
}

export async function updateSchedule(input: {
  id: string
  wallpaperId: string
  name: string
  startAt: string
  endAt: string | null
  timezone: string
  priority: number
  enabled: boolean
}) {
  await query(
    `
      update schedules
      set wallpaper_id = $2,
          name = $3,
          start_at_utc = $4,
          end_at_utc = $5,
          timezone = $6,
          priority = $7,
          enabled = $8,
          updated_at = now()
      where id = $1
    `,
    [input.id, input.wallpaperId, input.name, input.startAt, input.endAt, input.timezone, input.priority, input.enabled],
  )
}

export async function deleteSchedule(id: string) {
  await query('delete from schedules where id = $1', [id])
}
