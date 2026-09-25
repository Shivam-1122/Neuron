@echo off
setlocal
echo Stopping any running Neuron backend processes on port 8000...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Found process PID: %%a listening on port 8000. Terminating...
    taskkill /F /PID %%a
)

echo Stopping ngrok tunnel if running...
taskkill /F /IM ngrok.exe >nul 2>&1

echo Done. Backend and tunnel stopped.
timeout /t 2 >nul
