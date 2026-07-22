import { query } from '../lib/database.js'
import type { AuthUser, UserRole } from '@shared/contracts'

type UserRow = {
  id: string
  email: string
  display_name: string
  password_hash: string
  role: UserRole
  is_active: boolean
}

export async function countUsers() {
  const result = await query<{ count: string }>('select count(*)::text as count from users')
  return Number(result.rows[0]?.count ?? '0')
}

export async function findUserByEmail(email: string) {
  const result = await query<UserRow>('select * from users where lower(email) = lower($1) limit 1', [email])
  return result.rows[0] ?? null
}

export async function createUser(input: {
  email: string
  displayName: string
  passwordHash: string
  role: UserRole
}) {
  const result = await query<UserRow>(
    `
      insert into users (email, display_name, password_hash, role)
      values ($1, $2, $3, $4)
      returning *
    `,
    [input.email, input.displayName, input.passwordHash, input.role],
  )

  return result.rows[0]
}

export function mapUserToAuthUser(user: Pick<UserRow, 'id' | 'email' | 'display_name' | 'role'>): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
  }
}
