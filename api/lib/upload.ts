import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import multer from 'multer'
import path from 'node:path'
import { appConfig } from '../config.js'

const tempPath = path.join(appConfig.uploadPath, '.tmp')

export const uploadMiddleware = multer({
  dest: tempPath,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

export async function moveUploadedFile(file: Express.Multer.File) {
  const extension = path.extname(file.originalname) || '.jpeg'
  const finalName = `${crypto.randomUUID()}${extension.toLowerCase()}`
  const finalPath = path.join(appConfig.uploadPath, finalName)

  await fs.rename(file.path, finalPath)

  return finalPath
}

export async function computeSha256(filePath: string) {
  const buffer = await fs.readFile(filePath)
  return crypto.createHash('sha256').update(buffer).digest('hex')
}
