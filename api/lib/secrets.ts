import fs from 'node:fs'

type SecretSource = 'file' | 'env' | 'missing' | 'default'

function readSecretFile(filePath: string) {
  return fs.readFileSync(filePath, 'utf8').trim()
}

export function resolveSecret(options: {
  envKey: string
  fileEnvKey?: string
  defaultValue?: string
}) {
  const filePath = options.fileEnvKey ? process.env[options.fileEnvKey] : undefined

  if (filePath) {
    const value = readSecretFile(filePath)
    return {
      value,
      source: 'file' as SecretSource,
    }
  }

  const envValue = process.env[options.envKey]
  if (envValue) {
    return {
      value: envValue,
      source: 'env' as SecretSource,
    }
  }

  if (options.defaultValue !== undefined) {
    return {
      value: options.defaultValue,
      source: 'default' as SecretSource,
    }
  }

  return {
    value: '',
    source: 'missing' as SecretSource,
  }
}

export function getSecretHealth() {
  const jwt = resolveSecret({
    envKey: 'JWT_SECRET',
    fileEnvKey: 'JWT_SECRET_FILE',
    defaultValue: 'development-only-secret',
  })

  const postgresPassword = resolveSecret({
    envKey: 'POSTGRES_PASSWORD',
    fileEnvKey: 'POSTGRES_PASSWORD_FILE',
  })

  const domainPassword = resolveSecret({
    envKey: 'DOMAIN_PASSWORD',
    fileEnvKey: 'DOMAIN_PASSWORD_FILE',
  })

  return {
    jwtSecretSource: jwt.source,
    postgresPasswordSource: postgresPassword.source,
    domainPasswordSource: domainPassword.source,
    warnings: [
      ...(jwt.source === 'default' ? ['JWT secret is using the development default value.'] : []),
      ...(jwt.source === 'env' ? ['JWT secret is loaded from plain environment variables. Prefer secret files in production.'] : []),
      ...(postgresPassword.source === 'env' ? ['Database password is loaded from plain environment variables. Prefer secret files in production.'] : []),
      ...(domainPassword.source === 'env' ? ['Domain password is loaded from plain environment variables. Prefer host-managed secrets or secret files.'] : []),
      ...(domainPassword.source === 'missing' ? ['Domain password is not loaded by the application process. Ensure the host-level CIFS mount is managed separately.'] : []),
    ],
  }
}
