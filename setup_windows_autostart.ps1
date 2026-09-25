param(
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$vbsPath = Join-Path $scriptDir "run_server_background.vbs"
$startupDir = [System.IO.Path]::Combine($env:APPDATA, "Microsoft\Windows\Start Menu\Programs\Startup")
$shortcutPath = Join-Path $startupDir "NeuronBackend.lnk"

if ($Uninstall) {
    Write-Host "==========================================" -ForegroundColor Yellow
    Write-Host "Removing Neuron Backend from Windows Startup..." -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Yellow

    if (Test-Path $shortcutPath) {
        Remove-Item $shortcutPath -Force
        Write-Host "[OK] Startup shortcut removed from: $shortcutPath" -ForegroundColor Green
    } else {
        Write-Host "[INFO] No startup shortcut was found." -ForegroundColor Gray
    }

    # Also remove Task Scheduler task if present
    try {
        $task = Get-ScheduledTask -TaskName "NeuronBackendServer" -ErrorAction SilentlyContinue
        if ($task) {
            Unregister-ScheduledTask -TaskName "NeuronBackendServer" -Confirm:$false
            Write-Host "[OK] Scheduled task 'NeuronBackendServer' removed." -ForegroundColor Green
        }
    } catch {}

    Write-Host "`nNeuron autostart has been completely uninstalled.`n" -ForegroundColor Green
    exit 0
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Neuron Core - Windows Autostart Setup Script" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Verify files exist
if (-not (Test-Path $vbsPath)) {
    Write-Error "Cannot find run_server_background.vbs at $vbsPath"
}

# 2. Create Startup Folder Shortcut
Write-Host "`n[1/3] Configuring Windows User Startup folder..." -ForegroundColor Yellow
$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = $scriptDir
$shortcut.Description = "Neuron AI Backend Automatic Background Startup"
$shortcut.Save()

Write-Host "[OK] Startup shortcut successfully created at:" -ForegroundColor Green
Write-Host "     $shortcutPath" -ForegroundColor Gray

# 3. Check Cloudflare Tunnel (cloudflared) status
Write-Host "`n[2/3] Checking Cloudflare Tunnel (cloudflared)..." -ForegroundColor Yellow
$cloudflaredCmd = Get-Command "cloudflared" -ErrorAction SilentlyContinue

if ($cloudflaredCmd) {
    Write-Host "[OK] cloudflared is installed at: $($cloudflaredCmd.Source)" -ForegroundColor Green
    
    # Check if cloudflared service is registered
    $cfService = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($cfService) {
        Write-Host "[OK] Cloudflare Windows Service is installed! Status: $($cfService.Status)" -ForegroundColor Green
    } else {
        Write-Host "[INFO] 'cloudflared' binary is installed, but the Windows service is not yet registered." -ForegroundColor Yellow
        Write-Host "       To register your permanent domain tunnel service, run as Administrator:" -ForegroundColor Gray
        Write-Host "       cloudflared service install <YOUR_TUNNEL_TOKEN>`n" -ForegroundColor White
    }
} else {
    Write-Host "[!] 'cloudflared' command not found in PATH." -ForegroundColor Yellow
    Write-Host "    You can install it automatically by running:" -ForegroundColor Gray
    Write-Host "    winget install --id Cloudflare.cloudflared`n" -ForegroundColor White
}

# 4. Summary & Verification
Write-Host "[3/3] Autostart Setup Complete!" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "When your PC starts:" -ForegroundColor White
Write-Host " 1. Windows automatically launches the Neuron Backend silently in the background." -ForegroundColor White
Write-Host "    - API port: http://localhost:8000" -ForegroundColor Gray
Write-Host "    - Logs saved to: storage\server.log" -ForegroundColor Gray
Write-Host " 2. Cloudflare Tunnel runs as a Windows Service connecting your domain." -ForegroundColor White
Write-Host " 3. Your API is available 24/7 at https://api.yourdomain.com!" -ForegroundColor White
Write-Host "--------------------------------------------------------" -ForegroundColor Gray
Write-Host "Useful commands:" -ForegroundColor Gray
Write-Host " - Test starting right now: .\run_server.bat" -ForegroundColor Gray
Write-Host " - Stop server:             .\stop_server.bat" -ForegroundColor Gray
Write-Host " - Check health:            .\check_status.bat" -ForegroundColor Gray
Write-Host " - To disable autostart:    .\setup_windows_autostart.ps1 -Uninstall`n" -ForegroundColor Gray
