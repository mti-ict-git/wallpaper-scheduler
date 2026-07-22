import type { AuditLogRecord } from '@shared/contracts'
import { query } from '../lib/database.js'

type AuditLogRow = {
  id: string
  action: string
  entity_type: string
  entity_id: string
  actor_label: string
  created_at: Date
}

export async function listAuditLogs() {
  const result = await query<AuditLogRow>(
    `
      select
        a.id,
        a.action,
        a.entity_type,
        a.entity_id,
        coalesce(u.display_name, a.actor_type) as actor_label,
        a.created_at
      from audit_logs a
      left join users u on u.id = a.actor_user_id
      order by a.created_at desc
      limit 100
    `,
  )

  return result.rows.map<AuditLogRecord>((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actorLabel: row.actor_label,
    createdAt: row.created_at.toISOString(),
  }))
}
