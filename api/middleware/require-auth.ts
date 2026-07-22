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
    // #region debug-point C:require-auth-missing-token
    ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "preview-delete-regression", runId: "pre-fix", hypothesisId: "C", location: "api/middleware/require-auth.ts:requireAuth", msg: "[DEBUG] requireAuth rejected request with missing token", data: { method: request.method, originalUrl: request.originalUrl, hasAuthorizationHeader: Boolean(request.headers.authorization) }, ts: Date.now() }) }).catch(() => {}) })()
    // #endregion
    response.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    request.authUser = verifyToken(token)
    // #region debug-point D:require-auth-accepted
    ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "preview-delete-regression", runId: "pre-fix", hypothesisId: "D", location: "api/middleware/require-auth.ts:requireAuth", msg: "[DEBUG] requireAuth accepted request", data: { method: request.method, originalUrl: request.originalUrl, userId: request.authUser?.id ?? null }, ts: Date.now() }) }).catch(() => {}) })()
    // #endregion
    next()
  } catch {
    // #region debug-point E:require-auth-invalid-token
    ;(() => { fetch("http://127.0.0.1:7777/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: "preview-delete-regression", runId: "pre-fix", hypothesisId: "E", location: "api/middleware/require-auth.ts:requireAuth", msg: "[DEBUG] requireAuth rejected request with invalid token", data: { method: request.method, originalUrl: request.originalUrl, hasAuthorizationHeader: Boolean(request.headers.authorization) }, ts: Date.now() }) }).catch(() => {}) })()
    // #endregion
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
