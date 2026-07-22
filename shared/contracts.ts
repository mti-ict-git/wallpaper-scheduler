export type UserRole = 'admin' | 'operator'

export type AuthUser = {
  id: string
  email: string
  displayName: string
  role: UserRole
}

export type LoginResponse = {
  token: string
  user: AuthUser
}

export type BootstrapStatus = {
  needsSetup: boolean
}

export type WallpaperRecord = {
  id: string
  name: string
  description: string | null
  originalFilename: string
  mimeType: string
  fileSizeBytes: number
  checksumSha256: string
  widthPx: number | null
  heightPx: number | null
  status: 'active' | 'archived'
  previewUrl: string
  createdAt: string
}

export type ScheduleRecord = {
  id: string
  wallpaperId: string
  wallpaperName: string
  name: string
  startAt: string
  endAt: string | null
  timezone: string
  priority: number
  enabled: boolean
  hasConflict: boolean
  createdAt: string
}

export type PublishJobRecord = {
  id: string
  status: 'pending' | 'running' | 'success' | 'failed'
  triggerType: 'schedule' | 'manual'
  wallpaperId: string
  wallpaperName: string
  scheduleId: string | null
  attemptCount: number
  nextAttemptAt: string | null
  errorCode: string | null
  errorMessage: string | null
  createdAt: string
  finishedAt: string | null
}

export type AuditLogRecord = {
  id: string
  action: string
  entityType: string
  entityId: string
  actorLabel: string
  createdAt: string
}

export type AppConfig = {
  defaultTimezone: string
  pollIntervalSeconds: number
  publishRetryCount: number
  publishRetryDelaySeconds: number
  auditRetentionDays: number
  publishJobRetentionDays: number
  backupRetentionDays: number
  fallbackWallpaperId: string | null
  sharedFolderPath: string
  cifsSharePath: string
}

export type SecretHealth = {
  jwtSecretSource: 'file' | 'env' | 'missing' | 'default'
  postgresPasswordSource: 'file' | 'env' | 'missing' | 'default'
  domainPasswordSource: 'file' | 'env' | 'missing' | 'default'
  warnings: string[]
}

export type BackupRecord = {
  id: string
  type: 'metadata' | 'publish-target'
  fileName: string
  createdAt: string
  sizeBytes: number
}

export type BackupSummary = {
  backups: BackupRecord[]
  backupDirectory: string
}

export type OperationsOverview = {
  secretHealth: SecretHealth
  backups: BackupSummary
  validationReport: ValidationReport | null
}

export type ValidationReport = {
  generatedAt: string
  targetPath: string
  shareAccess: {
    isWritable: boolean
    detail: string | null
  }
  publishTarget: {
    exists: boolean
    checksumSha256: string | null
    sizeBytes: number | null
    lastModifiedAt: string | null
  }
  runtime: {
    backupCount: number
    latestBackupAt: string | null
    warnings: string[]
  }
}

export type PublishProbeResult = {
  startedAt: string
  finishedAt: string
  durationMs: number
  probeFileName: string
  targetDirectory: string
  writeSucceeded: boolean
  readSucceeded: boolean
  cleanupSucceeded: boolean
  detail: string
}

export type RestoreDrillResult = {
  startedAt: string
  finishedAt: string
  durationMs: number
  backupFileName: string
  backupType: 'metadata' | 'publish-target'
  success: boolean
  detail: string
}

export type DashboardOverview = {
  activeWallpaper: {
    wallpaperId: string | null
    wallpaperName: string | null
    scheduleId: string | null
    scheduleName: string | null
    effectiveAt: string | null
  }
  lastPublish: PublishJobRecord | null
  workerLastHeartbeatAt: string | null
  schedulerStatus: 'idle' | 'running' | 'error'
  shareAccess: {
    lastCheckedAt: string | null
    isWritable: boolean | null
    detail: string | null
  }
  failedJobCount: number
  pendingJobCount: number
  nextSchedules: ScheduleRecord[]
  targetPath: string
}
