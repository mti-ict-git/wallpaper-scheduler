import crypto from 'node:crypto'
import sharp from 'sharp'

const FULL_HD_WIDTH = 1920
const FULL_HD_HEIGHT = 1080
const MAX_JPG_BYTES = 3 * 1024 * 1024
const JPG_QUALITY_STEPS = [90, 85, 80, 75, 70, 65, 60, 55, 50, 45]

export type NormalizedWallpaper = {
  imageBuffer: Buffer
  mimeType: 'image/jpeg'
  fileSizeBytes: number
  checksumSha256: string
  widthPx: number
  heightPx: number
}

function computeBufferSha256(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export async function normalizeWallpaperImage(inputBuffer: Buffer): Promise<NormalizedWallpaper> {
  const pipeline = sharp(inputBuffer)
    .rotate()
    .resize(FULL_HD_WIDTH, FULL_HD_HEIGHT, {
      fit: 'cover',
      position: 'centre',
    })

  let outputBuffer: Buffer | null = null

  for (const quality of JPG_QUALITY_STEPS) {
    const candidate = await pipeline.clone().jpeg({
      quality,
      mozjpeg: true,
    }).toBuffer()

    outputBuffer = candidate
    if (candidate.byteLength <= MAX_JPG_BYTES) {
      break
    }
  }

  if (!outputBuffer) {
    throw new Error('Failed to normalize wallpaper image')
  }

  return {
    imageBuffer: outputBuffer,
    mimeType: 'image/jpeg',
    fileSizeBytes: outputBuffer.byteLength,
    checksumSha256: computeBufferSha256(outputBuffer),
    widthPx: FULL_HD_WIDTH,
    heightPx: FULL_HD_HEIGHT,
  }
}
