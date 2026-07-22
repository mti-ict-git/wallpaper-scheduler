import { getRuntimeStatus, setRuntimeStatus } from '../repositories/runtime-status-repository.js'

export async function markWorkerHeartbeat(status: 'idle' | 'running' | 'error' = 'running') {
  await setRuntimeStatus('worker_heartbeat', {
    heartbeatAt: new Date().toISOString(),
    status,
  })
}

export async function getWorkerHeartbeat() {
  const record = await getRuntimeStatus<{ heartbeatAt: string; status: 'idle' | 'running' | 'error' }>('worker_heartbeat')
  if (!record) {
    return {
      heartbeatAt: null,
      status: 'idle' as const,
    }
  }

  return {
    heartbeatAt: record.value.heartbeatAt,
    status: record.value.status,
  }
}
