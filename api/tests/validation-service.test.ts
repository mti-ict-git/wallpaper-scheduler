import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const tempRoot = path.join(os.tmpdir(), `wallpaper-validation-test-${Date.now()}`)
const targetDir = path.join(tempRoot, 'scripts')
const backupDir = path.join(tempRoot, 'backups')

vi.mock('../config.js', () => ({
  appConfig: {
    sharedFolderPath: targetDir,
    backupPath: backupDir,
  },
}))

vi.mock('../repositories/runtime-status-repository.js', () => ({
  setRuntimeStatus: vi.fn(),
}))

vi.mock('../services/backup-service.js', () => ({
  listBackups: vi.fn().mockResolvedValue({
    backups: [],
    backupDirectory: backupDir,
  }),
}))

describe('validation-service', () => {
  beforeEach(async () => {
    await fs.mkdir(targetDir, { recursive: true })
    await fs.mkdir(backupDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true })
  })

  it('runs a publish probe and cleans up the probe file', async () => {
    const { runPublishProbe } = await import('../services/validation-service.js')
    const result = await runPublishProbe()

    expect(result.writeSucceeded).toBe(true)
    expect(result.readSucceeded).toBe(true)
    expect(result.cleanupSucceeded).toBe(true)
  })
})
