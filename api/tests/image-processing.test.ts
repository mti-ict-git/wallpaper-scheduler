import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { normalizeWallpaperImage } from '../lib/image-processing.js'

describe('image-processing', () => {
  it('normalizes uploaded images into Full HD JPEG under the operational size target', async () => {
    const input = await sharp({
      create: {
        width: 3000,
        height: 2000,
        channels: 3,
        background: {
          r: 120,
          g: 80,
          b: 200,
        },
      },
    })
      .png()
      .toBuffer()

    const normalized = await normalizeWallpaperImage(input)

    expect(normalized.mimeType).toBe('image/jpeg')
    expect(normalized.widthPx).toBe(1920)
    expect(normalized.heightPx).toBe(1080)
    expect(normalized.fileSizeBytes).toBeLessThanOrEqual(3 * 1024 * 1024)
    expect(normalized.imageBuffer.byteLength).toBe(normalized.fileSizeBytes)
    expect(normalized.checksumSha256).toHaveLength(64)
  })
})
