$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

$pidFile = Join-Path $here ".server.pid"

if (Test-Path $pidFile) {
    $existingPid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
    if ($existingPid -match "^[0-9]+$") {
        $p = Get-Process -Id ([int]$existingPid) -ErrorAction SilentlyContinue
        if ($p) {
            Write-Host "Server already running (PID $existingPid). Stop it first: .\\stop-server.ps1"
            exit 0
        }
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

$proc = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $here -PassThru -WindowStyle Hidden
$proc.Id | Set-Content -Path $pidFile -Encoding ascii

Write-Host "Backend started on http://localhost:5001/api/ (PID $($proc.Id))"
Write-Host "Stop: .\\stop-server.ps1"

