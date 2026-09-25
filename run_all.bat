@echo off
setlocal
cd /d "%~dp0"
if not exist "storage" mkdir "storage"

echo Starting Neuron Backend...
start "NeuronBackend" /min cmd /c "venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

timeout /t 4 /nobreak >nul

echo Starting Ngrok Tunnel...
start "NeuronNgrok" /min cmd /c "ngrok.exe http --url=sampling-shield-capillary.ngrok-free.dev 8000"

echo [OK] Both services started.
