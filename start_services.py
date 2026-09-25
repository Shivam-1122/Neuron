import subprocess
import sys
import time
import os

backend_dir = os.path.dirname(os.path.abspath(__file__))
python_exe = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
ngrok_exe = os.path.join(backend_dir, "ngrok.exe")

print("====================================================")
print("  Neuron Core & Ngrok Unified Server Supervisor")
print("====================================================")

# 1. Start Uvicorn Backend
print("[1/2] Starting FastAPI Backend on port 8000...")
backend_proc = subprocess.Popen(
    [python_exe, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
    cwd=backend_dir
)

# Wait 4 seconds for AI models and port 8000 to be ready
time.sleep(4)

# 2. Start Ngrok Tunnel
print("[2/2] Starting Ngrok Tunnel for https://sampling-shield-capillary.ngrok-free.dev...")
ngrok_proc = subprocess.Popen(
    [ngrok_exe, "http", "--url=sampling-shield-capillary.ngrok-free.dev", "8000", "--log=stdout"],
    cwd=backend_dir
)

print("\n[SUCCESS] Both Backend and Ngrok are LIVE and connected!")
print("Press CTRL+C anytime to stop both services.\n")

try:
    while True:
        # If either process terminates, alert and break
        if backend_proc.poll() is not None:
            print("[ALERT] Backend process terminated.")
            break
        if ngrok_proc.poll() is not None:
            print("[ALERT] Ngrok process terminated.")
            break
        time.sleep(1)
except KeyboardInterrupt:
    print("\nStopping services...")
finally:
    backend_proc.terminate()
    ngrok_proc.terminate()
