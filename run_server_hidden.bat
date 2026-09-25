@echo off
setlocal
cd /d "%~dp0"
if not exist "storage" mkdir "storage"

:: 1. Start Python Uvicorn backend in background
start /b "" venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 >> "storage\server.log" 2>&1

:: Wait 3 seconds for backend to bind to port 8000
timeout /t 3 /nobreak >nul

:: 2. Start Ngrok with your permanent domain
start /b "" "%~dp0ngrok.exe" http --domain=sampling-shield-capillary.ngrok-free.dev 8000 >> "storage\ngrok.log" 2>&1
