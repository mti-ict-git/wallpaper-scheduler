import { describe, expect, it, vi } from 'vitest'

describe('secret resolution', () => {
  it('prefers file secrets over environment values', async () => {
    vi.resetModules()
    process.env.JWT_SECRET = 'from-env'
    process.env.JWT_SECRET_FILE = 'C:\\fake\\jwt-secret.txt'

    vi.doMock('node:fs', () => ({
      default: {
        readFileSync: vi.fn().mockReturnValue('from-file'),
      },
    }))

    const { resolveSecret } = await import('../lib/secrets.js')
    const result = resolveSecret({
      envKey: 'JWT_SECRET',
      fileEnvKey: 'JWT_SECRET_FILE',
      defaultValue: 'default-value',
    })

    expect(result.value).toBe('from-file')
    expect(result.source).toBe('file')
  })
})
