param(
    [string]$Domain = "http://localhost:8000"
)

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   Neuron API & Cloudflare Tunnel Connectivity Test" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Local backend check
Write-Host "`n[1] Testing Local Backend (http://localhost:8000)..." -ForegroundColor Yellow
try {
    $localRes = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/llm/provider" -TimeoutSec 3
    Write-Host "[OK] Local backend is responding!" -ForegroundColor Green
    Write-Host "     Provider: $($localRes.provider)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Local backend is not reachable on http://localhost:8000" -ForegroundColor Red
    Write-Host "       Run .\run_server.bat to start it." -ForegroundColor Gray
}

# 2. Cloudflare Service check
Write-Host "`n[2] Checking Cloudflare Windows Service..." -ForegroundColor Yellow
$cfSvc = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
if ($cfSvc) {
    Write-Host "[OK] Cloudflare service is installed. Status: $($cfSvc.Status)" -ForegroundColor Green
} else {
    Write-Host "[!] Cloudflare service is not installed on this PC." -ForegroundColor Yellow
    Write-Host "    Install using: winget install --id Cloudflare.cloudflared" -ForegroundColor Gray
    Write-Host "    Then run: cloudflared.exe service install <TOKEN>" -ForegroundColor Gray
}

# 3. Custom Domain check
if ($Domain -and $Domain -ne "http://localhost:8000") {
    $cleanDomain = $Domain.TrimEnd('/')
    if (-not ($cleanDomain.StartsWith("http://") -or $cleanDomain.StartsWith("https://"))) {
        $cleanDomain = "https://$cleanDomain"
    }
    
    $testUrl = "$cleanDomain/api/v1/llm/provider"
    Write-Host "`n[3] Testing Public Custom Domain URL ($testUrl)..." -ForegroundColor Yellow
    try {
        $startTime = Get-Date
        $remoteRes = Invoke-RestMethod -Uri $testUrl -TimeoutSec 10
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        Write-Host "[SUCCESS] Public domain is LIVE and accessible from anywhere!" -ForegroundColor Green
        Write-Host "          Latency: $([math]::Round($duration))ms" -ForegroundColor Gray
        Write-Host "          Response Provider: $($remoteRes.provider)" -ForegroundColor Gray
    } catch {
        Write-Host "[FAIL] Could not connect to $testUrl" -ForegroundColor Red
        Write-Host "       Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "`n[3] To test your public custom domain, run:" -ForegroundColor Gray
    Write-Host "    .\verify_connection.ps1 -Domain https://api.yourdomain.com`n" -ForegroundColor White
}
