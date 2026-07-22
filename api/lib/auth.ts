import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Request } from 'express'
import { appConfig } from '../config.js'
import type { AuthUser } from '@shared/contracts'

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export function signToken(user: AuthUser) {
  return jwt.sign(user, appConfig.jwtSecret, { expiresIn: '12h' })
}

export function parseBearerToken(request: Request) {
  const header = request.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return null
  }

  return header.slice('Bearer '.length)
}

export function verifyToken(token: string) {
  return jwt.verify(token, appConfig.jwtSecret) as AuthUser
}
