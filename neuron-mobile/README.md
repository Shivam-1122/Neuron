# Neuron Mobile App (React Native & Expo)

Full-featured React Native mobile application for the Neuron Multi-Modal Cognitive Assistant for Alzheimer's & Dementia patients.

## Features
- **Holographic Projection Avatar**: Animated idle & vocal speaking states, frequency equalizer visualizer, and dynamic status telemetry.
- **Biometric Optical Scanner**: Real-time facial recognition (`/recognize/person`) and spatial object tracking (`/find/object`) using device camera.
- **Patient Cortex Conversation**: Context-aware chat with memory bank recall, dynamic suggestion chips, and vocal playback.
- **Dual LLM Engine Switcher**: Toggle dynamically between Groq Llama 3 and Google Gemini 3.6 Flash.
- **Multimodal Live Task Guide**: Dementia-safe step-by-step guidance (Making Tea, Medications, Toast, Soup) with AI camera watchdog inspection and voice coach.
- **Caregiver Architect Hub**: 4-step wizard to register loved ones, store 512-D face embeddings, voice audio signatures, and notes.
- **Dynamic API Telemetry Config**: In-app configuration modal to easily connect physical phones or emulators to the FastAPI backend with instant ping latency test.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Connect to Neuron FastAPI Backend
1. Ensure your backend is running:
   ```bash
   cd ../Neuron-main
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. In the mobile app, tap the **Settings icon** in the top header:
   - For Android Emulator: Use preset `http://10.0.2.2:8000/api/v1`
   - For Physical Phone (Expo Go): Enter your computer's Wi-Fi IP (e.g. `http://192.168.1.15:8000/api/v1`)
   - Tap **TEST PING** to verify sub-second telemetry link.

### 3. Launch App
```bash
# Start Expo development server (QR code for Expo Go on phone)
npx expo start

# Run directly on Android emulator
npx expo start --android

# Run directly on iOS simulator (macOS)
npx expo start --ios

# Run in Web browser
npx expo start --web
```
