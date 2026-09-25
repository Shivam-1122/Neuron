@echo off
setlocal
cd /d "%~dp0"

echo ====================================================
echo        Neuron Core & Tunnel Status Check
echo ====================================================
echo.

:: 1. Check Port 8000
netstat -aon | findstr ":8000" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [OK] Backend is RUNNING on port 8000.
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
        echo      Process PID: %%a
    )
) else (
    echo [OFFLINE] Backend is NOT running on port 8000.
    echo           Run .\run_server.bat to start it manually.
)
echo.

:: 2. Check Local HTTP Health endpoint via PowerShell
powershell -Command "try { $res = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/llm/provider' -TimeoutSec 3; Write-Host '[OK] Local API Health Test Passed! Provider:' $res.provider -ForegroundColor Green } catch { Write-Host '[!] Local API is not responding on http://localhost:8000' -ForegroundColor Yellow }"

echo.
:: 3. Check Permanent Ngrok Domain Reachability
powershell -Command "try { $res = Invoke-RestMethod -Uri 'https://sampling-shield-capillary.ngrok-free.dev/api/v1/llm/provider' -Headers @{'ngrok-skip-browser-warning'='69420'} -TimeoutSec 5; Write-Host '[OK] Permanent Domain (sampling-shield-capillary.ngrok-free.dev) is LIVE! Provider:' $res.provider -ForegroundColor Green } catch { Write-Host '[!] Permanent domain is not reachable.' -ForegroundColor Yellow }"

echo.
echo ====================================================
echo Recent Log Entries (storage\server.log):
echo ====================================================
if exist "storage\server.log" (
    powershell -Command "Get-Content 'storage\server.log' -Tail 10"
) else (
    echo No server.log found yet.
)
echo.
pause
