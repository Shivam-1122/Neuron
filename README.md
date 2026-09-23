# 🧠 Neuron — AI-Powered Memory Augmentation System

> **Your External Neural Cortex** — An intelligent sensory extension for Alzheimer's & Dementia patients, identifying faces, tracking misplaced objects, and conversing with context-aware memory recall.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.125-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo)](https://expo.dev/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-DC3545)](https://qdrant.tech/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase)](https://firebase.google.com/)

---

## 📖 What is Neuron?

Neuron is a full-stack AI memory assistant designed for patients with memory disorders (Alzheimer's, Dementia). It combines:

- **Biometric Face Recognition** — identifies people from a live camera scan
- **Object Detection** — locates misplaced items using YOLO
- **Context-Aware LLM Chat** — retrieves relevant memories to answer questions
- **Voice Interaction** — Whisper-powered speech-to-text + Edge TTS responses
- **Caregiver Management** — A complete caregiver portal with team coordination tools
- **Cognitive Games** — Built-in memory training games (CortexMatch, NeuroSequence, NumberSort)

---

## ✨ Key Features

### 🧬 Patient Features
- 🎤 **Hold-to-Talk Voice Chat** — Whisper STT transcription with Groq/Gemini LLM responses
- 👤 **Face Recognition Login** — Zero-password biometric login via 512-D facial vectors (Qdrant)
- 📷 **Object Scanner** — YOLO-powered live object identification
- 🧠 **Memory Bank** — Stores enrolled faces, objects, and voice signatures
- 🎮 **Memory Gym** — 3 cognitive training games to slow memory decline
- 📋 **Task Coach** — Autonomous step-by-step guided assistance for daily tasks

### 🛡️ Caregiver Features
- 👥 **Caregiver Team** — Enroll and manage multiple caregivers per patient
- 🚨 **Emergency Alert** — One-tap SMS/email distress signal to all caregivers
- 📡 **Memory Protocol Wizard** — Guide to index new people and objects into patient memory
- 📊 **Activity Logs** — Monitor patient interactions and memory queries

### 📱 Android Mobile App
- Full feature parity with the web app
- Slide-out Navigation Drawer for decluttered UI
- Collapsible Avatar HUD for more chat space
- Built with Expo / React Native

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | FastAPI (Python) + Uvicorn |
| **Vector Database** | Qdrant Cloud (512-D face embeddings) |
| **Face Embeddings** | `keras_facenet` |
| **Object Detection** | YOLOv8 (`ultralytics`) |
| **Speech-to-Text** | OpenAI Whisper |
| **Text-to-Speech** | Microsoft Edge TTS |
| **LLM (Primary)** | Groq Cloud — Llama 3.3 70B |
| **LLM (Fallback)** | Google Gemini 2.0 Flash |
| **Web Frontend** | React 18 + Vite + TailwindCSS |
| **Mobile App** | Expo SDK 52 + React Native 0.76 |
| **Auth** | Firebase Authentication |
| **Email/SMS** | Gmail SMTP |

---

## 📂 Project Structure

```
Neuron/
├── app/                        # FastAPI backend
│   ├── api/                    # REST API endpoints
│   │   ├── endpoints.py        # Auth, memory, caregiver routes
│   │   ├── chat_endpoint.py    # LLM chat (Groq/Gemini)
│   │   └── task_endpoint.py    # Task coach endpoint
│   ├── core/                   # Config & settings
│   ├── models/                 # Pydantic data models
│   └── services/               # Face, object, voice, LLM services
│       ├── face_service.py     # FaceNet + Qdrant face enrollment/search
│       ├── object_service.py   # YOLOv8 object detection
│       ├── voice_service.py    # Whisper STT + Edge TTS
│       └── llm_service.py      # Groq/Gemini LLM orchestration
├── frontend/                   # React web app (Vite)
│   ├── src/
│   │   ├── pages/              # LoginPage, PatientPage, CaregiverPage
│   │   ├── components/         # Shared UI components
│   │   └── firebase.js         # Firebase Auth integration
│   └── .env                    # Frontend environment (not committed)
├── neuron-mobile/              # Expo Android/iOS app
│   ├── App.js                  # Root app with navigation
│   ├── src/
│   │   ├── screens/            # LoginScreen, PatientCortexScreen, etc.
│   │   ├── components/         # NavigationDrawer, HeaderNav, etc.
│   │   └── api/client.js       # API client pointing to backend
│   └── app.json                # Expo config (package: com.neuron.assistant)
├── audio/                      # Voice signature storage
├── photo/                      # Face photo storage
├── static/                     # Backend static assets
├── .env.example                # Template for environment variables
├── requirements.txt            # Python dependencies
├── render_build.sh             # Render/Railway build script
└── README.md
```

---

## 🚀 Quick Start — Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- Android Studio (for mobile emulator)
- [Qdrant Cloud](https://cloud.qdrant.io/) free account
- [Groq](https://console.groq.com/) free API key

### 1. Clone the Repository
```bash
git clone https://github.com/Shivam-1122/Neuron.git
cd Neuron
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and fill in your keys (see Environment Variables section)

# Start backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be live at: `http://localhost:8000`  
API docs at: `http://localhost:8000/api/v1/openapi.json`

### 3. Frontend Setup
```bash
cd frontend
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_BASE=http://localhost:8000/api/v1
# Add your Firebase config values

npm run dev
```

Frontend will be live at: `http://localhost:5173`

### 4. Mobile App Setup
```bash
cd neuron-mobile
npm install
npx expo start --android     # Requires Android Studio emulator running
```

---

## 🔑 Environment Variables

### Backend (`.env`)
```env
# Qdrant Vector Database
QDRANT_MODE=server            # "local" for offline, "server" for Qdrant Cloud
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key

# LLM Providers
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
LLM_PROVIDER=groq             # "groq" or "gemini"

# Email Notifications (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=your@gmail.com
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

> ⚠️ **Never commit `.env` files to git.** Use environment variables on your hosting platform.

---

## ☁️ Deployment

### Backend — Railway (Free)
1. Go to [railway.app](https://railway.app) → Login with GitHub
2. **New Project** → Deploy from GitHub Repo → Select `Shivam-1122/Neuron`
3. Set **Root Directory** to `/` (project root)
4. Set **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all backend environment variables in the Railway dashboard
6. Deploy → Get URL like `https://neuron-production.up.railway.app`

### Frontend — Firebase Hosting (Free)
```bash
# Install Firebase CLI
npm install -g firebase-tools
firebase login

# Build frontend
cd frontend
# Update VITE_API_BASE in .env to your Railway backend URL
npm run build

# Deploy
firebase init hosting    # Select "neuron-a940a" project, dist as public dir
firebase deploy
```

### Android APK — EAS Build (Free)
```bash
# Install EAS CLI
npm install -g eas-cli
eas login    # Login as shivam112205

# Configure
cd neuron-mobile
eas build:configure

# Build APK
eas build --platform android --profile preview
# Download APK from expo.dev/accounts/shivam112205/projects
```

---

## 📱 Mobile App — APK Install

Download the latest APK from the [Releases](https://github.com/Shivam-1122/Neuron/releases) page.

**Install on Android:**
1. Enable "Install from Unknown Sources" in Settings
2. Open the downloaded `.apk` file
3. Follow the installation prompts

---

## 🎮 Memory Games

| Game | Description | Difficulty |
|---|---|---|
| **CortexMatch** | Card matching pairs game | Easy → Hard (8→12 cards) |
| **NeuroSequence** | Simon-style pattern recall | 5 rounds, 4 nodes |
| **NumberSort** | 8-puzzle sliding tiles | Fixed |

---

## 🔒 Security Notes

- Face vectors are stored as 512-dimensional embeddings — the original photos are NOT stored in Qdrant
- All API keys must be configured as environment variables, never hardcoded
- Firebase API keys are restricted via Firebase Security Rules and authorized domain lists
- Caregiver deletion is bidirectional — deleting a caregiver removes their Firebase account too

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Groq](https://groq.com/) — Ultra-fast LLM inference
- [Qdrant](https://qdrant.tech/) — Vector similarity search
- [Expo](https://expo.dev/) — React Native toolchain
- [FaceNet](https://github.com/davidsandberg/facenet) — Face embedding model
- [Ultralytics YOLOv8](https://ultralytics.com/) — Object detection
- [OpenAI Whisper](https://openai.com/research/whisper) — Speech recognition
