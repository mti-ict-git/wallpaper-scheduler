import { query } from './database.js'

export async function writeAuditLog(input: {
  actorType: string
  actorUserId?: string | null
  action: string
  entityType: string
  entityId: string
  payloadJson: unknown
}) {
  await query(
    `
      insert into audit_logs (actor_type, actor_user_id, action, entity_type, entity_id, payload_json)
      values ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [
      input.actorType,
      input.actorUserId ?? null,
      input.action,
      input.entityType,
      input.entityId,
      JSON.stringify(input.payloadJson ?? {}),
    ],
  )
}
