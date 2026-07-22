import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const runtimeStatus = vi.hoisted(() => ({
  setRuntimeStatus: vi.fn(),
}))

const tempDir = path.join(os.tmpdir(), `wallpaper-share-test-${Date.now()}`)

vi.mock('../config.js', () => ({
  appConfig: {
    sharedFolderPath: tempDir,
  },
}))

vi.mock('../repositories/runtime-status-repository.js', () => runtimeStatus)

describe('share-service', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true })
    runtimeStatus.setRuntimeStatus.mockReset()
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('menandai share writable bila file healthcheck bisa ditulis', async () => {
    const { validateShareAccess } = await import('../services/share-service.js')
    const result = await validateShareAccess()

    expect(result.isWritable).toBe(true)
    expect(runtimeStatus.setRuntimeStatus).toHaveBeenCalled()
  })
})
