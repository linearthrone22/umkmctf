$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

$pidFile = Join-Path $here ".server.pid"

if (Test-Path $pidFile) {
    $serverPid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($serverPid -match "^[0-9]+$") {
        try {
            Stop-Process -Id ([int]$serverPid) -Force -ErrorAction Stop
            Write-Host "Stopped backend (PID $serverPid)."
        } catch {
            Write-Host "PID file found ($serverPid) but process is not running."
        }
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    exit 0
}

# Fallback: stop any process currently listening on port 5001
$conn = Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn -and $conn.OwningProcess) {
    Stop-Process -Id $conn.OwningProcess -Force
    Write-Host "Stopped backend listener on port 5001 (PID $($conn.OwningProcess))."
    exit 0
}

Write-Host "No backend process found to stop."
