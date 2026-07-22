import fs from 'node:fs/promises'
import path from 'node:path'
import { appConfig } from '../config.js'
import { setRuntimeStatus } from '../repositories/runtime-status-repository.js'

export async function ensureTargetDirectory() {
  await fs.mkdir(appConfig.sharedFolderPath, { recursive: true })
}

export async function validateShareAccess() {
  const validationFile = path.join(appConfig.sharedFolderPath, '.wallpaper-scheduler-healthcheck')

  try {
    await ensureTargetDirectory()
    await fs.writeFile(validationFile, `ok:${new Date().toISOString()}`, 'utf8')
    await fs.rm(validationFile, { force: true })

    const status = {
      isWritable: true,
      detail: `Writable at ${appConfig.sharedFolderPath}`,
    }

    await setRuntimeStatus('share_access', status)
    return status
  } catch (error) {
    const status = {
      isWritable: false,
      detail: error instanceof Error ? error.message : 'Unknown share validation error',
    }

    await setRuntimeStatus('share_access', status)
    return status
  }
}
