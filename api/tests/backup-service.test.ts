import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const tempRoot = path.join(os.tmpdir(), `wallpaper-backup-test-${Date.now()}`)

vi.mock('../config.js', () => ({
  appConfig: {
    backupPath: tempRoot,
    auditRetentionDays: 90,
    publishJobRetentionDays: 30,
    backupRetentionDays: 14,
  },
}))

const databaseMock = vi.hoisted(() => ({
  db: {
    connect: vi.fn(),
  },
  query: vi.fn(),
}))

vi.mock('../lib/database.js', () => databaseMock)
vi.mock('../lib/audit.js', () => ({
  writeAuditLog: vi.fn(),
}))

describe('backup-service', () => {
  beforeEach(async () => {
    await fs.mkdir(tempRoot, { recursive: true })
    databaseMock.query.mockReset()
  })

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true })
  })

  it('lists created backup files', async () => {
    await fs.writeFile(path.join(tempRoot, 'metadata-test.json'), '{"ok":true}', 'utf8')
    const { listBackups } = await import('../services/backup-service.js')
    const result = await listBackups()

    expect(result.backups.length).toBe(1)
    expect(result.backups[0]?.type).toBe('metadata')
  })
})
