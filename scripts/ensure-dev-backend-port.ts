import 'dotenv/config'
import { spawnSync } from 'node:child_process'

const DEFAULT_BACKEND_PORT = 3011
const DEFAULT_FRONTEND_PORT = 5173

function shouldManagePortsLocally() {
  if (process.env.DOCKER === '1') {
    return false
  }

  return process.platform === 'win32'
}

function resolveBackendPort() {
  const parsed = Number(process.env.PORT ?? DEFAULT_BACKEND_PORT)
  return Number.isFinite(parsed) ? parsed : DEFAULT_BACKEND_PORT
}

function resolveFrontendPort() {
  const parsed = Number(process.env.VITE_PORT ?? DEFAULT_FRONTEND_PORT)
  return Number.isFinite(parsed) ? parsed : DEFAULT_FRONTEND_PORT
}

function run(command: string, args: string[]) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
  })
}

function stopWindowsListeners(port: number) {
  const script = `
    $ownerPids = @(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique);
    if (-not $ownerPids) {
      Write-Output 'No listener on ${port}';
      exit 0;
    }

    foreach ($ownerPid in $ownerPids) {
      try {
        $proc = Get-Process -Id $ownerPid -ErrorAction Stop;
        Write-Output ('Stopping PID ' + $ownerPid + ' (' + $proc.ProcessName + ')');
        Stop-Process -Id $ownerPid -Force -ErrorAction Stop;
        Write-Output ('Stopped PID ' + $ownerPid);
      } catch {
        Write-Output ('Failed PID ' + $ownerPid + ': ' + $_.Exception.Message);
        exit 1;
      }
    }
  `

  return run('powershell.exe', ['-NoProfile', '-Command', script])
}

function stopPortListeners(port: number) {
  const result = stopWindowsListeners(port)

  if (result.error) {
    throw result.error
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status)
  }
}

function main() {
  if (!shouldManagePortsLocally()) {
    process.stdout.write('Skipping dev port cleanup outside local Windows development.\n')
    return
  }

  const ports = [resolveBackendPort(), resolveFrontendPort()]
  const uniquePorts = [...new Set(ports)]

  for (const port of uniquePorts) {
    stopPortListeners(port)
  }
}

main()
