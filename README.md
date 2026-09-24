# 🧠 Neuron — AI-Powered Memory Augmentation System

> **Your External Neural Cortex** — An intelligent sensory extension for Alzheimer's & Dementia patients, identifying familiar faces, locating misplaced objects, and conversing with context-aware memory recall.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.125-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo)](https://expo.dev/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-DC3545)](https://qdrant.tech/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Live Web App](https://img.shields.io/badge/Live%20Web%20App-neuron--a940a.web.app-00f0ff?logo=googlechrome)](https://neuron-a940a.web.app)
[![Android APK](https://img.shields.io/badge/Android%20APK-Ready%20to%20Install-34A853?logo=android)](https://expo.dev/artifacts/eas/_GTGYBQM8CiuicIdr47wN04qYjq2zdX8wEeb2aKBMIU.apk)

---

## 🌐 Live Web Application & Android APK

- 🌐 **Live Web Application (Firebase)**: **[https://neuron-a940a.web.app](https://neuron-a940a.web.app)**
- 📥 **Direct APK Download**: **[Download Neuron APK (v1.0.0)](https://expo.dev/artifacts/eas/_GTGYBQM8CiuicIdr47wN04qYjq2zdX8wEeb2aKBMIU.apk)**
- 📋 **EAS Build Page**: **[Expo EAS Build Logs & Details](https://expo.dev/accounts/shivam112205/projects/neuron/builds/a8ab329d-ed11-47c5-9a4a-21455b0f05a8)**

### How to Install:
1. Download the `.apk` file directly on your Android device.
2. Tap the file to install (allow "Install from Unknown Sources" if prompted).
3. Open the app! Tap the **⚙️ Settings** icon on the top header to point to your live backend URL (e.g. your Cloudflare/ngrok tunnel or cloud backend).

---

## 📖 What is Neuron?

Neuron is a full-stack, multimodal assistive system built specifically for individuals experiencing memory disorders (such as Alzheimer's and Dementia) and their caregivers:

- **Biometric Face Recognition** — Real-time camera recognition matching faces against 512-dimensional facial embeddings.
- **YOLOv8 Object Detection** — Instant localization and identification of misplaced daily objects.
- **Context-Aware Semantic Memory Recall** — Hybrid LLM reasoning querying the patient's personal memory vault.
- **Voice Interaction** — Hold-to-talk speech-to-text with OpenAI Whisper and low-latency vocal synthesis via Edge TTS.
- **Caregiver Sanctuary** — Multi-caregiver team management, real-time memory protocol indexing, and one-tap emergency alerts.
- **Cognitive Gym** — 3 engaging memory rehabilitation games (CortexMatch, NeuroSequence, NumberSort).

---

## 🏗️ Architecture & Tech Stack

```
                                  ┌───────────────────────────────┐
                                  │      Client Applications      │
                                  ├───────────────┬───────────────┤
                                  │ React 18 Web  │ Expo Android  │
                                  │  (Vite App)   │   (APK v1)    │
                                  └───────┬───────┴───────┬───────┘
                                          │               │
                                   REST / WebSocket / Audio
                                          │               │
                                          ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FastAPI Neural Core (Backend)                         │
├───────────────────────┬─────────────────────────┬───────────────────────────────┤
│    Computer Vision    │   Voice & Speech (STT)  │       Memory & Reasoning      │
├───────────────────────┼─────────────────────────┼───────────────────────────────┤
│ • FaceNet (Keras/TF)  │ • OpenAI Whisper (Base) │ • Qdrant Cloud (Vector DB)    │
│ • YOLOv8 (Ultralytics)│ • Microsoft Edge TTS    │ • Groq LLaMA 3.3 (Primary)    │
│ • OpenCV Image Pipe   │ • Pygame Audio Engine   │ • Gemini 2.0 Flash (Fallback) │
└───────────────────────┴─────────────────────────┴───────────────────────────────┘
```

| Component | Technology | Role |
|---|---|---|
| **Backend Core** | FastAPI + Uvicorn (Python 3.10+) | High-throughput async REST API |
| **Vector DB** | Qdrant Cloud | 512-D cosine vector similarity search |
| **Face Recognition** | `keras-facenet` + `tf-keras` | Biometric face vector extraction |
| **Object Detection** | YOLOv8n (`ultralytics`) | Real-time object identification |
| **Speech-to-Text** | OpenAI Whisper | Local, high-accuracy speech transcription |
| **Text-to-Speech** | Microsoft Edge TTS | Natural conversational voice synthesis |
| **LLM Reasoning** | Groq (LLaMA 3.3 70B) & Gemini 2.0 | Cognitive reasoning & memory lookup |
| **Web Frontend** | React 18 + Vite + TailwindCSS | Cyberpunk holographic responsive UI |
| **Mobile App** | Expo SDK 52 + React Native 0.76 | Native Android app with navigation drawer |
| **Authentication** | Firebase Auth (SMS OTP & Email) | Secure identity gateway |

---

## ⚖️ Backend Deployment & Judges Demo Guide

### Why standard free containers (Railway / Render free tier) fail for heavy AI backends:
Neuron packages real computer vision and speech AI models:
- `torch` + `ultralytics` (YOLO)
- `tensorflow` + `keras_facenet` (Face recognition)
- `openai-whisper` (Speech transcription)
- `sentence-transformers`

Free hosting tiers (e.g. Render free tier or Railway trial) provide only **512 MB of RAM**. When Python imports PyTorch and TensorFlow, memory usage immediately exceeds 1 GB, causing the host to terminate the container with **`Exit Code 137 (OOM - Out Of Memory)`**. Furthermore, free containers sleep after 15 minutes of inactivity, causing huge cold-start delays.

---

### 🏆 Solution 1: Live Demo via Public Tunnel (Recommended for Judges)
*100% Free, Zero Cost, 0 Cold Starts, Full GPU/CPU Power, Never Crashes*

Run the backend on your laptop and generate an instant, secure public HTTPS URL using **Cloudflare Tunnel** or **LocalTunnel**.

#### Step 1: Start Backend
```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Step 2: Open a Public Tunnel (Choose any ONE):

**Option A — Cloudflare Tunnel (No install required):**
```bash
# Download cloudflared or run via npx:
npx cloudflared tunnel --url http://localhost:8000
```
*Output will give you a public HTTPS URL like `https://random-name.trycloudflare.com`.*

**Option B — LocalTunnel (1 command):**
```bash
npx localtunnel --port 8000
```
*Output will give you a public URL like `https://neat-turtle-42.loca.lt`.*

**Option C — ngrok:**
```bash
ngrok http 8000
```

#### Step 3: Connect Frontend & Mobile APK
- In the **Mobile APK**: Tap the **⚙️ Settings** button on the header, paste your public tunnel URL, and tap **Save & Connect**.
- In the **Web Frontend**: Set `VITE_API_BASE=https://your-tunnel-url/api/v1` in `frontend/.env`.

**Why this is the best solution for hackathon judging:**
1. **Zero latency**: Whisper and YOLO execute in ~50ms using your local hardware.
2. **Persistent memory**: All enrolled patient faces, voices, and memories are stored permanently on your machine.
3. **No timeouts or memory limits**: Never crashes in front of judges.

---

### ☁️ Solution 2: Free 16GB Cloud Hosting via Hugging Face Spaces

If you prefer a 100% cloud-hosted URL that runs 24/7 without keeping your laptop on:

1. Create a free account at [Hugging Face](https://huggingface.co/).
2. Click **New Space** → Set SDK to **Docker** → Blank template.
3. Hugging Face Spaces provides **2 vCPU + 16 GB RAM completely free** (ample memory to run PyTorch, YOLO, and FaceNet without OOM crashes).
4. Push your code with a `Dockerfile`:
```dockerfile
FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 ffmpeg
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
```
Your Space will be accessible at: `https://<username>-neuron.hf.space/api/v1`

---

## 📂 Project Structure

```
Neuron/
├── app/                        # FastAPI Neural Core Backend
│   ├── api/                    # API Endpoints (Auth, Memory, Chat, Task)
│   ├── core/                   # Configuration & CORS settings
│   ├── models/                 # Pydantic validation schemas
│   └── services/               # ML Services (FaceNet, YOLOv8, Whisper, LLM)
├── frontend/                   # React 18 + Vite Web Application
│   ├── src/
│   │   ├── components/         # Holographic UI widgets & Modals
│   │   ├── pages/              # Patient, Caregiver, Login screens
│   │   └── firebase.js         # Firebase Auth integration (Environment-driven)
│   └── package.json
├── neuron-mobile/              # Expo React Native Android/iOS App
│   ├── App.js                  # Main Application with Drawer & Header
│   ├── app.json                # Expo config (Package: com.neuron.assistant)
│   ├── eas.json                # EAS Build configuration for APK
│   ├── assets/                 # App icon & holographic animations
│   ├── src/
│   │   ├── screens/            # PatientCortex, Caregiver, MemoryGames, TaskGuide
│   │   ├── components/         # CameraScanner, AudioRecorder, SettingsModal
│   │   └── api/client.js       # Dynamic API host resolver
│   └── package.json
├── audio/                      # Enrolled patient voice signatures
├── photo/                      # Enrolled face snapshots
├── requirements.txt            # Python dependencies
├── .env.example                # Example environment keys
└── README.md
```

---

## 🔑 Environment Setup

### Backend `.env`
```env
# Vector Database (Qdrant Cloud)
QDRANT_MODE=server
QDRANT_URL=https://your-cluster-id.us-east4-0.gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key

# LLM Providers
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=AIzaSy_your_gemini_api_key
LLM_PROVIDER=groq

# Caregiver Alert SMTP (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

### Frontend `frontend/.env`
```env
VITE_API_BASE=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🎮 Built-in Cognitive Rehabilitation Games

| Game | Cognitive Objective | Target Area |
|---|---|---|
| **CortexMatch** | Visual spatial associative recall | Hippocampus & Short-Term Memory |
| **NeuroSequence** | Progressive multi-step pattern memory | Prefrontal Cortex & Working Memory |
| **NumberSort** | Sequential logic & spatial planning | Executive Function & Concentration |

---

## 🔒 Security & Privacy

- **Biometric Vectors Only**: Face photos are converted into 512-D floating-point embeddings; raw face photos are not stored in the cloud vector database.
- **Environment-Driven Configuration**: No sensitive credentials or API keys are committed in source code.
- **Fail-Safe Fallback**: Automatic dual-engine failover between Groq (ultra-low latency LLaMA 3.3) and Google Gemini ensures high availability during clinical assistance.

---

## 📄 License
MIT License. Crafted with precision for memory augmentation and assistive healthcare.
