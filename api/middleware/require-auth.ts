import type { NextFunction, Request, Response } from 'express'
import { parseBearerToken, verifyToken } from '../lib/auth.js'
import type { AuthUser, UserRole } from '@shared/contracts'

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser
    }
  }
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = parseBearerToken(request)

  if (!token) {
    response.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    request.authUser = verifyToken(token)
    next()
  } catch {
    response.status(401).json({ error: 'Unauthorized' })
  }
}

export function requireRole(roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.authUser || !roles.includes(request.authUser.role)) {
      response.status(403).json({ error: 'Forbidden' })
      return
    }

    next()
  }
}
