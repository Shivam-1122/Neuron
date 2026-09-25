$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

# 1. Stop old instances if running on port 8000
try {
    $connections = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
    Get-Process -Name "ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
} catch {}

# 2. Ensure storage directory exists
$storageDir = Join-Path $scriptDir "storage"
if (-not (Test-Path $storageDir)) {
    New-Item -ItemType Directory -Path $storageDir -Force | Out-Null
}

$pythonExe = Join-Path $scriptDir "venv\Scripts\python.exe"
$serverLog = Join-Path $storageDir "server.log"
$serverErr = Join-Path $storageDir "server_err.log"
$ngrokLog = Join-Path $storageDir "ngrok.log"
$ngrokErr = Join-Path $storageDir "ngrok_err.log"
$ngrokExe = Join-Path $scriptDir "ngrok.exe"

# 3. Start Python Uvicorn backend completely detached and hidden
Start-Process -FilePath $pythonExe `
    -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" `
    -WorkingDirectory $scriptDir `
    -RedirectStandardOutput $serverLog `
    -RedirectStandardError $serverErr `
    -WindowStyle Hidden

# 4. Wait for port 8000 to be ready
$maxWait = 15
$ready = $false
for ($i = 0; $i -lt $maxWait; $i++) {
    Start-Sleep -Seconds 1
    $conn = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($conn) {
        $ready = $true
        break
    }
}

# 5. Start Ngrok tunnel completely detached and hidden
Start-Process -FilePath $ngrokExe `
    -ArgumentList "http --domain=sampling-shield-capillary.ngrok-free.dev 8000" `
    -WorkingDirectory $scriptDir `
    -RedirectStandardOutput $ngrokLog `
    -RedirectStandardError $ngrokErr `
    -WindowStyle Hidden

Start-Sleep -Seconds 2

Write-Output "[OK] Neuron Backend & Ngrok tunnel are running detached in background."
