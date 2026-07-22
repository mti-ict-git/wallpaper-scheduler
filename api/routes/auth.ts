import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { hashPassword, signToken, verifyPassword } from '../lib/auth.js'
import { writeAuditLog } from '../lib/audit.js'
import { ensureDefaultConfig } from '../repositories/config-repository.js'
import { createUser, countUsers, findUserByEmail, mapUserToAuthUser } from '../repositories/user-repository.js'
import { requireAuth } from '../middleware/require-auth.js'

const router = Router()
const bootstrapSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  password: z.string().min(6),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.get('/bootstrap-status', async (_request: Request, response: Response) => {
  const userCount = await countUsers()
  response.json({ needsSetup: userCount === 0 })
})

router.post('/bootstrap', async (request: Request, response: Response) => {
  const parsed = bootstrapSchema.safeParse(request.body)
  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.flatten() })
    return
  }

  if (await countUsers()) {
    response.status(409).json({ error: 'Bootstrap already completed' })
    return
  }

  const passwordHash = await hashPassword(parsed.data.password)
  const createdUser = await createUser({
    email: parsed.data.email,
    displayName: parsed.data.displayName,
    passwordHash,
    role: 'admin',
  })

  await ensureDefaultConfig(createdUser.id)
  await writeAuditLog({
    actorType: 'system',
    actorUserId: createdUser.id,
    action: 'bootstrap_completed',
    entityType: 'user',
    entityId: createdUser.id,
    payloadJson: { email: createdUser.email },
  })

  const user = mapUserToAuthUser(createdUser)
  response.status(201).json({
    token: signToken(user),
    user,
  })
})

router.post('/login', async (request: Request, response: Response) => {
  const parsed = loginSchema.safeParse(request.body)
  if (!parsed.success) {
    response.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const user = await findUserByEmail(parsed.data.email)
  if (!user || !user.is_active) {
    response.status(401).json({ error: 'Email atau password salah' })
    return
  }

  const passwordValid = await verifyPassword(parsed.data.password, user.password_hash)
  if (!passwordValid) {
    response.status(401).json({ error: 'Email atau password salah' })
    return
  }

  const authUser = mapUserToAuthUser(user)
  await writeAuditLog({
    actorType: 'user',
    actorUserId: user.id,
    action: 'login',
    entityType: 'session',
    entityId: user.id,
    payloadJson: { email: user.email },
  })

  response.json({
    token: signToken(authUser),
    user: authUser,
  })
})

router.get('/me', requireAuth, async (request: Request, response: Response) => {
  response.json({ user: request.authUser })
})

export default router
