import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../lib/database.js', () => ({
  ensureStorageDirectories: vi.fn(),
  runMigrations: vi.fn(),
}))

const userRepository = vi.hoisted(() => ({
  countUsers: vi.fn(),
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  mapUserToAuthUser: vi.fn((user: { id: string; email: string; display_name?: string; displayName?: string; role: 'admin' | 'operator' }) => ({
    id: user.id,
    email: user.email,
    displayName: user.display_name ?? user.displayName ?? 'Admin',
    role: user.role,
  })),
}))

const authLib = vi.hoisted(() => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
  signToken: vi.fn().mockReturnValue('test-token'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}))

vi.mock('../repositories/user-repository.js', () => userRepository)
vi.mock('../repositories/config-repository.js', () => ({
  ensureDefaultConfig: vi.fn(),
}))
vi.mock('../lib/audit.js', () => ({
  writeAuditLog: vi.fn(),
}))
vi.mock('../lib/auth.js', () => authLib)

const { default: app } = await import('../app.js')

describe('auth routes', () => {
  beforeEach(() => {
    userRepository.countUsers.mockReset()
    userRepository.createUser.mockReset()
    userRepository.findUserByEmail.mockReset()
    authLib.hashPassword.mockClear()
    authLib.signToken.mockClear()
    authLib.verifyPassword.mockClear()
  })

  it('mengembalikan bootstrap status true saat belum ada user', async () => {
    userRepository.countUsers.mockResolvedValue(0)
    const response = await request(app).get('/api/auth/bootstrap-status')

    expect(response.status).toBe(200)
    expect(response.body.needsSetup).toBe(true)
  })

  it('berhasil login dengan credential valid', async () => {
    userRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@mbma.com',
      display_name: 'Admin',
      password_hash: '$2a$10$xauA6gTC2Qn.zYt7riqN9OdX3Ew5z6J6D8YK3PaY5E9OQj1YxDCEi',
      role: 'admin',
      is_active: true,
    })

    const response = await request(app).post('/api/auth/login').send({
      email: 'admin@mbma.com',
      password: 'changeme123',
    })

    expect(response.status).toBe(200)
    expect(response.body.user.email).toBe('admin@mbma.com')
    expect(response.body.token).toBeTruthy()
    expect(authLib.verifyPassword).toHaveBeenCalled()
  })
})
