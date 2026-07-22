import { create } from 'zustand'
import type {
  AppConfig,
  AuditLogRecord,
  AuthUser,
  BackupSummary,
  BootstrapStatus,
  DashboardOverview,
  LoginResponse,
  OperationsOverview,
  PublishJobRecord,
  ScheduleRecord,
  WallpaperRecord,
} from '@shared/contracts'
import type { ApiError } from '@/types'

type AppState = {
  token: string | null
  user: AuthUser | null
  bootstrapStatus: BootstrapStatus | null
  overview: DashboardOverview | null
  wallpapers: WallpaperRecord[]
  schedules: ScheduleRecord[]
  publishJobs: PublishJobRecord[]
  auditLogs: AuditLogRecord[]
  config: AppConfig | null
  operations: OperationsOverview | null
  loading: boolean
  error: string | null
  setError: (error: string | null) => void
  fetchBootstrapStatus: () => Promise<void>
  bootstrapAdmin: (payload: { email: string; displayName: string; password: string }) => Promise<void>
  login: (payload: { email: string; password: string }) => Promise<void>
  logout: () => void
  loadAll: () => Promise<void>
  uploadWallpaper: (formData: FormData) => Promise<void>
  updateWallpaper: (id: string, payload: { name: string; description: string | null; status: 'active' | 'archived' }) => Promise<void>
  deleteWallpaper: (id: string) => Promise<void>
  saveSchedule: (payload: {
    id?: string
    wallpaperId: string
    name: string
    startAt: string
    endAt: string | null
    timezone: string
    priority: number
    enabled: boolean
  }) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  triggerManualPublish: (wallpaperId: string) => Promise<void>
  validateShareAccess: () => Promise<void>
  loadOperations: () => Promise<void>
  createMetadataBackup: () => Promise<void>
  createPublishTargetBackup: () => Promise<void>
  restoreMetadataBackup: (fileName: string) => Promise<void>
  restorePublishTargetBackup: (fileName: string) => Promise<void>
  generateValidationReport: () => Promise<void>
  runPublishProbe: () => Promise<void>
  runRestoreDrill: (payload: { fileName: string; backupType: 'metadata' | 'publish-target' }) => Promise<void>
  pruneRetention: () => Promise<void>
  updateConfig: (payload: AppConfig) => Promise<void>
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: 'Request gagal' }))) as ApiError
    throw new Error(error.error)
  }

  return response.json() as Promise<T>
}

function buildHeaders(token: string | null, json = true) {
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  token: null,
  user: null,
  bootstrapStatus: null,
  overview: null,
  wallpapers: [],
  schedules: [],
  publishJobs: [],
  auditLogs: [],
  config: null,
  operations: null,
  loading: false,
  error: null,
  setError: (error) => set({ error }),
  fetchBootstrapStatus: async () => {
    const data = await parseResponse<BootstrapStatus>(await fetch('/api/auth/bootstrap-status'))
    set({ bootstrapStatus: data })
  },
  bootstrapAdmin: async (payload) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: buildHeaders(null),
        body: JSON.stringify(payload),
      })
      const data = await parseResponse<LoginResponse>(response)
      set({ token: data.token, user: data.user, bootstrapStatus: { needsSetup: false } })
      await get().loadAll()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Bootstrap gagal' })
    } finally {
      set({ loading: false })
    }
  },
  login: async (payload) => {
    set({ loading: true, error: null })
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: buildHeaders(null),
        body: JSON.stringify(payload),
      })
      const data = await parseResponse<LoginResponse>(response)
      set({ token: data.token, user: data.user })
      await get().loadAll()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Login gagal' })
    } finally {
      set({ loading: false })
    }
  },
  logout: () => set({ token: null, user: null, overview: null }),
  loadAll: async () => {
    const { token } = get()
    if (!token) {
      return
    }

    set({ loading: true, error: null })
    try {
      const [overview, wallpapers, schedules, publishJobs, auditLogs, config] = await Promise.all([
        parseResponse<DashboardOverview>(await fetch('/api/dashboard/overview', { headers: buildHeaders(token, false) })),
        parseResponse<WallpaperRecord[]>(await fetch('/api/wallpapers', { headers: buildHeaders(token, false) })),
        parseResponse<ScheduleRecord[]>(await fetch('/api/schedules', { headers: buildHeaders(token, false) })),
        parseResponse<PublishJobRecord[]>(await fetch('/api/publish/jobs', { headers: buildHeaders(token, false) })),
        parseResponse<AuditLogRecord[]>(await fetch('/api/dashboard/audit-logs', { headers: buildHeaders(token, false) })),
        parseResponse<AppConfig>(await fetch('/api/config', { headers: buildHeaders(token, false) })),
      ])

      set({ overview, wallpapers, schedules, publishJobs, auditLogs, config })
      await get().loadOperations()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal memuat data' })
    } finally {
      set({ loading: false })
    }
  },
  uploadWallpaper: async (formData) => {
    const { token } = get()
    if (!token) {
      return
    }

    await parseResponse(
      await fetch('/api/wallpapers', {
        method: 'POST',
        headers: buildHeaders(token, false),
        body: formData,
      }),
    )
    await get().loadAll()
  },
  updateWallpaper: async (id, payload) => {
    const { token } = get()
    if (!token) {
      return
    }

    await parseResponse(
      await fetch(`/api/wallpapers/${id}`, {
        method: 'PATCH',
        headers: buildHeaders(token),
        body: JSON.stringify(payload),
      }),
    )
    await get().loadAll()
  },
  deleteWallpaper: async (id) => {
    const { token } = get()
    if (!token) {
      return
    }

    await fetch(`/api/wallpapers/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(token, false),
    })
    await get().loadAll()
  },
  saveSchedule: async (payload) => {
    const { token } = get()
    if (!token) {
      return
    }

    const method = payload.id ? 'PATCH' : 'POST'
    const url = payload.id ? `/api/schedules/${payload.id}` : '/api/schedules'
    await parseResponse(
      await fetch(url, {
        method,
        headers: buildHeaders(token),
        body: JSON.stringify({
          wallpaperId: payload.wallpaperId,
          name: payload.name,
          startAt: payload.startAt,
          endAt: payload.endAt,
          timezone: payload.timezone,
          priority: payload.priority,
          enabled: payload.enabled,
        }),
      }),
    )
    await get().loadAll()
  },
  deleteSchedule: async (id) => {
    const { token } = get()
    if (!token) {
      return
    }

    await fetch(`/api/schedules/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(token, false),
    })
    await get().loadAll()
  },
  triggerManualPublish: async (wallpaperId) => {
    const { token } = get()
    if (!token) {
      return
    }

    await parseResponse(
      await fetch('/api/publish/manual', {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ wallpaperId }),
      }),
    )
    await get().loadAll()
  },
  validateShareAccess: async () => {
    const { token } = get()
    if (!token) {
      return
    }

    await parseResponse(
      await fetch('/api/publish/validate-share-access', {
        method: 'POST',
        headers: buildHeaders(token, false),
      }),
    )
    await get().loadAll()
  },
  loadOperations: async () => {
    const { token } = get()
    if (!token) {
      return
    }

    const [secretHealth, backups, validationReport] = await Promise.all([
      parseResponse<OperationsOverview['secretHealth']>(await fetch('/api/operations/secret-health', { headers: buildHeaders(token, false) })),
      parseResponse<BackupSummary>(await fetch('/api/operations/backups', { headers: buildHeaders(token, false) })),
      parseResponse<OperationsOverview['validationReport']>(await fetch('/api/operations/validation-report', { headers: buildHeaders(token, false) })),
    ])

    set({
      operations: {
        secretHealth,
        backups,
        validationReport,
      },
    })
  },
  createMetadataBackup: async () => {
    const { token } = get()
    if (!token) {
      return
    }
    await parseResponse(await fetch('/api/operations/backups/metadata', { method: 'POST', headers: buildHeaders(token, false) }))
    await get().loadOperations()
  },
  createPublishTargetBackup: async () => {
    const { token } = get()
    if (!token) {
      return
    }
    await parseResponse(await fetch('/api/operations/backups/publish-target', { method: 'POST', headers: buildHeaders(token, false) }))
    await get().loadOperations()
  },
  restoreMetadataBackup: async (fileName) => {
    const { token } = get()
    if (!token) {
      return
    }
    await parseResponse(
      await fetch('/api/operations/backups/restore-metadata', {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ fileName }),
      }),
    )
    await get().loadAll()
  },
  restorePublishTargetBackup: async (fileName) => {
    const { token } = get()
    if (!token) {
      return
    }
    await parseResponse(
      await fetch('/api/operations/backups/restore-publish-target', {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({ fileName }),
      }),
    )
    await get().loadAll()
  },
  generateValidationReport: async () => {
    const { token } = get()
    if (!token) {
      return
    }
    await parseResponse(await fetch('/api/operations/validation-report', { headers: buildHeaders(token, false) }))
    await get().loadOperations()
  },
  runPublishProbe: async () => {
    const { token } = get()
    if (!token) {
      return
    }
    await parseResponse(await fetch('/api/operations/publish-probe', { method: 'POST', headers: buildHeaders(token, false) }))
    await get().loadOperations()
  },
  runRestoreDrill: async (payload) => {
    const { token } = get()
    if (!token) {
      return
    }
    await parseResponse(
      await fetch('/api/operations/restore-drill', {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify(payload),
      }),
    )
    await get().loadOperations()
  },
  pruneRetention: async () => {
    const { token } = get()
    if (!token) {
      return
    }
    await parseResponse(await fetch('/api/operations/retention/prune', { method: 'POST', headers: buildHeaders(token, false) }))
    await get().loadAll()
  },
  updateConfig: async (payload) => {
    const { token } = get()
    if (!token) {
      return
    }

    await parseResponse(
      await fetch('/api/config', {
        method: 'PATCH',
        headers: buildHeaders(token),
        body: JSON.stringify(payload),
      }),
    )
    await get().loadAll()
  },
}))
