@echo off
setlocal
cd /d "%~dp0"

echo ===================================================
echo [Neuron Core] Starting FastAPI Backend on Port 8000
echo ===================================================

if not exist "venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment python not found at venv\Scripts\python.exe
    pause
    exit /b 1
)

:: Run Uvicorn backend
venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
