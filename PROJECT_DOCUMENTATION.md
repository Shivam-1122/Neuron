# 🧠 NEURON: The Intelligent Neural Cortex & Assistive Memory System
### Comprehensive Architecture, Technical Specification, Feature Manual & Workflow Guide

---

## 📑 Table of Contents
1. [Executive Summary & Core Mission](#1-executive-summary--core-mission)
2. [Complete Technology Stack & Components](#2-complete-technology-stack--components)
3. [System Architecture & Data Flow Diagrams](#3-system-architecture--data-flow-diagrams)
4. [End-to-End Workflows](#4-end-to-end-workflows)
   - [4.1 Patient Everyday Experience Workflow](#41-patient-everyday-experience-workflow)
   - [4.2 Caregiver Management & Care Plan Workflow](#42-caregiver-management--care-plan-workflow)
   - [4.3 Real-Time Visual Task Coaching Workflow](#43-real-time-visual-task-coaching-workflow)
   - [4.4 Multimodal RAG & Voice Reasoning Loop](#44-multimodal-rag--voice-reasoning-loop)
5. [Exhaustive Feature Guide & How to Use Every Single Feature](#5-exhaustive-feature-guide--how-to-use-every-single-feature)
   - [Feature 1: Biometric Face Recognition & Family Directory](#feature-1-biometric-face-recognition--family-directory)
   - [Feature 2: YOLOv8 Object Localization & Memory Tracking](#feature-2-yolov8-object-localization--memory-tracking)
   - [Feature 3: One-Glance Biometric Face Login](#feature-3-one-glance-biometric-face-login)
   - [Feature 4: Multimodal Semantic Memory Vault (RAG)](#feature-4-multimodal-semantic-memory-vault-rag)
   - [Feature 5: Dual-Engine Cognitive LLM Cortex (Groq & Gemini)](#feature-5-dual-engine-cognitive-llm-cortex-groq--gemini)
   - [Feature 6: Vision-in-the-Loop Task Coach (ADL Guidance)](#feature-6-vision-in-the-loop-task-coach-adl-guidance)
   - [Feature 7: Cognitive Gym (3 Clinical Memory Games)](#feature-7-cognitive-gym-3-clinical-memory-games)
   - [Feature 8: Caregiver Sanctuary & Emergency Escalation](#feature-8-caregiver-sanctuary--emergency-escalation)
   - [Feature 9: Natural Speech Engine (OpenAI Whisper & Edge TTS)](#feature-9-natural-speech-engine-openai-whisper--edge-tts)
   - [Feature 10: 3D Holographic Companion Avatar](#feature-10-3d-holographic-companion-avatar)
6. [Web Application vs. Mobile App (Expo / Android APK) Comparison](#6-web-application-vs-mobile-app-expo--android-apk-comparison)
7. [Complete Backend API Reference](#7-complete-backend-api-reference)
8. [Installation, Configuration & Deployment Playbook](#8-installation-configuration--deployment-playbook)
   - [8.1 Local Backend Setup](#81-local-backend-setup)
   - [8.2 Zero-Cost High-Performance Tunneling (Cloudflare / LocalTunnel)](#82-zero-cost-high-performance-tunneling-cloudflare--localtunnel)
   - [8.3 Web Frontend Setup (Vite / React) & Firebase Hosting](#83-web-frontend-setup-vite--react--firebase-hosting)
   - [8.4 Mobile Application Setup (Expo SDK 52) & APK Generation](#84-mobile-application-setup-expo-sdk-52--apk-generation)
   - [8.5 Hugging Face Spaces (16GB Docker Cloud Deployment)](#85-hugging-face-spaces-16gb-docker-cloud-deployment)
9. [Privacy, Data Security & Biometric Safeguards](#9-privacy-data-security--biometric-safeguards)
10. [Judges Demo Script & Best Practices](#10-judges-demo-script--best-practices)

---

## 1. Executive Summary & Core Mission

**Neuron** is a multimodal artificial intelligence system engineered specifically for individuals living with progressive cognitive impairments (such as **Alzheimer's Disease, Vascular Dementia, and Severe Amnesia**) and the dedicated caregivers who support them.

Memory loss strips away identity, relationships, spatial orientation, and personal autonomy. Patients often experience acute distress when failing to recognize family members, misplacing essential everyday objects (glasses, medication, keys), or struggling to complete routine activities of daily living (such as brewing a cup of tea or taking daily prescriptions).

Neuron acts as an **External Neural Cortex**:
- **Continuous Visual Perception**: Automatically identifies people approaching the patient and locates misplaced personal items.
- **Biometric Effortless Access**: Replaces forgotten passwords and OTPs with instantaneous 1-second facial recognition login.
- **Active Task Guidance**: Observes the physical environment in real-time through the device's camera to verify and coach users through multi-step daily activities.
- **Cognitive Neuro-Rehabilitation**: Delivers personalized clinical memory exercises dynamically populated with the patient’s own family members and belongings.
- **Caregiver Peace of Mind**: Equips care teams with centralized patient profiling, real-time memory logs, task management, and automated one-tap emergency escalation.

---

## 2. Complete Technology Stack & Components

Neuron integrates a modern, distributed architecture combining high-throughput Python machine learning pipelines, edge-compatible web frontends, and cross-platform native mobile applications.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT ECOSYSTEM                                │
│                                                                        │
│   ┌──────────────────────────────┐  ┌──────────────────────────────┐   │
│   │   Web Application (Vite)     │  │   Mobile Application (Expo)  │   │
│   │   • React 18                 │  │   • React Native 0.76        │   │
│   │   • TailwindCSS + CSS Glass  │  │   • Expo SDK 52 (Android)    │   │
│   │   • Three.js / R3F Avatar    │  │   • Expo Camera & Audio      │   │
│   │   • Web Speech & Audio API   │  │   • Custom Sound Engine      │   │
│   └──────────────┬───────────────┘  └──────────────┬───────────────┘   │
└──────────────────┼─────────────────────────────────┼───────────────────┘
                   │  REST API / Multipart Form-Data │
                   ▼                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│               FASTAPI NEURAL CORE (Python 3.10+)                       │
├────────────────────────┬───────────────────────┬───────────────────────┤
│   Computer Vision      │    Voice & Audio      │  Reasoning & Memory   │
├────────────────────────┼───────────────────────┼───────────────────────┤
│ • Keras-FaceNet        │ • OpenAI Whisper Base │ • Qdrant Vector Cloud │
│   (512-D Biometrics)   │   (Local STT Engine)  │   (Cosine Similarity) │
│ • YOLOv8 Nano          │ • Microsoft Edge TTS  │ • Groq LLaMA 3.3 70B  │
│   (Object Detection)   │   (Natural Speech)    │   (Primary LLM)       │
│ • OpenCV & Pillow      │ • WebM/WAV Processing │ • Google Gemini Flash │
│   (Image Optimization) │   (Pygame / ffmpeg)   │   (Fallback & Vision) │
└────────────────────────┴───────────────────────┴───────────────────────┘
                   │                                 │
                   ▼                                 ▼
┌────────────────────────────────────┐ ┌─────────────────────────────────┐
│     EXTERNAL CLOUD SERVICES        │ │       IDENTITY & ALERTS         │
├────────────────────────────────────┤ ├─────────────────────────────────┤
│ • Qdrant Cloud Vector Cluster      │ │ • Firebase Authentication       │
│ • Groq Cloud Inference LPU         │ │ • SMTP Email Dispatcher         │
│ • Google Generative AI API         │ │ • Local Persistent JSON Vaults  │
└────────────────────────────────────┘ └─────────────────────────────────┘
```

### Detailed Stack Breakdown:

| Layer | Component | Version / Technology | Key Responsibility |
|---|---|---|---|
| **Backend Core** | FastAPI | `v0.125.0` | Asynchronous REST server, route orchestration, file handling |
| **Server Engine** | Uvicorn | `v0.34.0` | ASGI web server running with high concurrency |
| **Face Recognition** | `keras-facenet` + `tf-keras` | TensorFlow 2.x | Computes 512-dimensional facial embedding vectors |
| **Object Detection** | YOLOv8n (`ultralytics`) | PyTorch | Detects 80+ standard everyday object categories in under 50ms |
| **Vector Database** | Qdrant Cloud | `qdrant-client 1.13+` | High-dimensional cosine indexing across `faces` and `objects` |
| **Speech-to-Text** | OpenAI Whisper | `openai-whisper` Base | Local audio transcription without external telemetry leaks |
| **Text-to-Speech** | Microsoft Edge TTS | `edge-tts` + Web Speech | Natural speech generation with warm human prosody |
| **Primary LLM** | Groq LLaMA 3.3 70B | `groq` SDK | Instantaneous clinical memory reasoning (~200ms TTFT) |
| **Multimodal LLM** | Google Gemini 2.0 / 3.x Flash | Google Generative AI | Live frame visual verification & fallback conversational engine |
| **Web Frontend** | React 18 + Vite | React 18, Vite 5 | Holographic cyberpunk UI with Glassmorphism styling |
| **3D Rendering** | Three.js & Lucide | `@react-three/fiber` | Interactive 3D companion avatar with speech lip synchronization |
| **Mobile App** | Expo SDK 52 | React Native 0.76 | Native Android production APK (`com.neuron.assistant`) |
| **Authentication** | Firebase Auth | Firebase JS SDK v10+ | Email/password, phone OTP, and token verification |
| **Image Processing** | Pillow & OpenCV | `Pillow`, `opencv-python` | Image normalization, thumbnailing, base64 data encoding |
| **Task Guide Engine** | Dynamic Vision Pipeline | Custom Service | Multi-step activity breakdown with real-time visual milestone check |

---

## 3. System Architecture & Data Flow Diagrams

### High-Level Architectural Flow:

```
[Camera / Microphone] ──> [Client Frontend (Web / Mobile)]
                                │
                        (Base64 / Multipart)
                                │
                                ▼
                       [FastAPI Core Router]
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
[Face Service]          [Object Service]         [Voice Service]
 • Keras-FaceNet         • YOLOv8 Nano            • OpenAI Whisper
 • 512-D Vector          • Bounding Boxes         • Local STT
       │                        │                        │
       ▼                        ▼                        ▼
[Qdrant "faces"]        [Qdrant "objects"]       [Prompt Assembler]
 (Cosine Sim >= 0.60)    (Cosine Sim >= 0.45)            │
       │                        │                        ▼
       └────────────────────────┼──────────────> [LLM Cortex Engine]
                                │                 • Groq LLaMA 3.3 70B
                                │                 • Gemini Flash Fallback
                                │                        │
                                ▼                        ▼
                         [Response Engine] <── [Edge TTS Synthesis]
                                │
                     (JSON + Audio Stream)
                                │
                                ▼
                 [Client UI: Spoken Voice + Text]
```

### Biometric Vector Search Flow:
1. Client transmits captured camera frame (`JPEG` / `PNG`).
2. Backend receives stream, decodes via OpenCV/Pillow, and crops bounding boxes of detected faces.
3. Keras-FaceNet normalizes pixel arrays to `(160, 160, 3)` and generates a **512-dimensional vector**.
4. Vector is searched against the Qdrant Cloud collection (`faces`) filtered by the active `user_id`.
5. If cosine similarity exceeds the recognition threshold (0.60), the payload returns the person's name, relationship, age, care notes, and voice sample.

---

## 4. End-to-End Workflows

### 4.1 Patient Everyday Experience Workflow

```
[Patient wakes up / opens Neuron]
               │
               ▼
   [One-Glance Face Login] ──(Face recognized in 1s)──> [Enters Assistant Cortex]
               │
       ┌───────┴───────────────────────────────┐
       ▼                                       ▼
[Approaching Person]                   [Misplaced Object]
 • Patient points camera at visitor     • Patient taps "Scan Object" or asks
 • Screen shows: "Sachin (Son)"         • Screen shows: "Keys found on dining table"
 • Audio speaks: "Hello Sachin"         • Audio speaks: "Your keys are on the table"
 • Displays: "How do I know Sachin?"    • Shows photo thumbnail & timestamp
       │                                       │
       └───────────────────┬───────────────────┘
                           │
                           ▼
                  [Wants to Exercise Brain]
                           │
                           ▼
                  [Enters Cognitive Gym]
      • Plays CortexMatch using real photos of Sachin & keys
      • Progresses through NeuroSequence audio patterns
                           │
                           ▼
                  [Starts Daily Activity]
                           │
                           ▼
                  [Enters Task Coach]
      • Chooses "Making a Cup of Tea"
      • Device guides step-by-step with camera verification
```

### 4.2 Caregiver Management & Care Plan Workflow

```
[Caregiver logs in via Email or Password]
               │
               ▼
     [Caregiver Sanctuary]
               │
    ┌──────────┼──────────────────────┬──────────────────────┐
    ▼          ▼                      ▼                      ▼
[Patient]   [Care Team]        [Memory Directory]     [Task Routines]
• Profile   • Invite Doctors   • Enroll new faces     • Add medication
• Blood Grp • Assign Roles     • Record voice samples • Set reminders
• Allergies • Manage Contacts  • Register objects     • Real-time checklist
    │          │                      │                      │
    └──────────┴──────────────────────┴──────────────────────┘
                               │
                      [Emergency Trigger]
                               │
            • Patient clicks Emergency Alert
            • Backend dispatches instant SMTP alert emails
            • Logs incident with location and timestamp
```

### 4.3 Real-Time Visual Task Coaching Workflow

```
1. [Patient selects task: "Making Tea"]
2. [Task Guide initializes session via /task-guide/start]
3. [Step 1: "Find your clean mug and place it on the counter"]
4. [Live camera frame continuously transmitted to /task-guide/live-frame]
5. [Gemini Vision / YOLO inspects video frame]:
      ├── If mug not visible ──> "I don't see the mug yet. Keep looking near the sink!"
      └── If mug detected ──> "Great job! Mug is ready." ──> [Auto-advance to Step 2]
6. [Step 2: "Place tea bag inside the mug"]
7. [Visual confirmation confirms tea bag inside mug] ──> [Auto-advance to Step 3]
8. [Final Step: Success celebration badge, chime played, task marked completed]
```

### 4.4 Multimodal RAG & Voice Reasoning Loop

```
1. Patient presses microphone: "Where did I leave my reading glasses?"
2. Whisper transcribes audio ──> "Where did I leave my reading glasses?"
3. Query Router checks intent:
   • Queries Qdrant 'objects' vector collection for semantic match: "reading glasses".
   • Retrieves top vector hit: { name: "Reading Glasses", location: "Nightstand drawer", timestamp: "Today 8:15 AM" }
4. Assembles contextual clinical system prompt:
   "You are Neuron, a compassionate cognitive memory cortex for an Alzheimer's patient.
    Known Memory: Patient's Reading Glasses are in the nightstand drawer.
    Provide a warm, reassuring, concise 1-sentence reply."
5. Groq LLaMA 3.3 70B synthesizes response in 180ms.
6. Edge TTS synthesizes audio voice stream.
7. Patient UI displays text and speaks: "Your reading glasses are safe in your nightstand drawer."
```

---

## 5. Exhaustive Feature Guide & How to Use Every Single Feature

---

### Feature 1: Biometric Face Recognition & Family Directory

#### What It Does:
Alzheimer's patients frequently experience prosopagnosia (inability to recognize familiar faces), causing severe anxiety. Neuron extracts 512-dimensional facial biometrics using Keras-FaceNet and matches incoming camera streams against registered family members, doctors, and friends in Qdrant Vector Cloud.

#### How It Works:
1. **Camera Frame Acquisition**: Captures an uncompressed frame from the front or rear camera.
2. **Face Extraction**: Locates face coordinates using OpenCV Haar/DNN cascades and normalizes the region to 160×160 pixels.
3. **512-D Embedding**: Passes pixels through the pre-trained FaceNet model.
4. **Vector Similarity Query**: Calculates cosine distance against all face vectors stored in Qdrant for that specific user.
5. **Contextual Enrichment**: Returns the recognized individual's name, relationship (e.g., "Daughter", "Primary Physician"), notes, age, and recorded voice signature.

#### Step-by-Step Usage Guide:
- **To Recognize a Person**:
  1. Open the **Assistant (Patient Cortex)** screen.
  2. Point your camera towards the individual's face.
  3. Tap the **Scan Face** button (or click the face scanner target).
  4. In under 1 second, Neuron displays the person's identity card with their relationship, notes, and suggested questions.
  5. The assistant speaks: *"I see Sachin. He is your son."*
- **To Enroll a New Person**:
  1. Click **Enroll Person** (from Assistant quick buttons or Caregiver Dashboard).
  2. Capture or upload a clear, front-facing photo of the person.
  3. Enter their **Full Name**, **Relationship**, **Age**, and **Personal Notes** (e.g., *"Lives in Seattle, visits on Sundays, loves gardening"*).
  4. (Optional) Record a 5-second audio sample of their voice so the patient can hear what they sound like.
  5. Tap **Save Memory**. The face vector is indexed immediately.

---

### Feature 2: YOLOv8 Object Localization & Memory Tracking

#### What It Does:
Patients routinely misplace critical belongings like eyeglasses, wallets, medicine boxes, keys, or canes. Neuron uses a lightweight YOLOv8 nano model combined with semantic vector memory to index and recall object locations.

#### How It Works:
1. When an object is enrolled or recognized, YOLOv8 generates bounding boxes and class probabilities.
2. The object description, room location, and optional bounding image are converted into a dense vector embedding.
3. When the patient asks *"Where are my keys?"*, Neuron searches Qdrant for semantic similarity and returns the last recorded location with timestamp and thumbnail image.

#### Step-by-Step Usage Guide:
- **To Find an Object via Camera**:
  1. Point the camera around your room or table.
  2. Tap **Scan Object**.
  3. Neuron analyzes the scene with YOLOv8. If it matches an enrolled personal item, it highlights the item and announces its location.
- **To Find an Object via Voice or Chat**:
  1. Tap the microphone or type in the chat box: *"Where did I put my blue water bottle?"*
  2. Neuron searches your personal object database and answers: *"Your blue water bottle was last placed on the kitchen counter at 9:30 AM."*
- **To Enroll an Object**:
  1. Tap **Enroll Object**.
  2. Take a photo of the item (e.g., keys, pill organizer).
  3. Enter the item name, default location (e.g., *"Entryway hook"*), and any special instructions.
  4. Tap **Save Object**.

---

### Feature 3: One-Glance Biometric Face Login

#### What It Does:
Individuals with dementia cannot remember complex passwords, security questions, or 6-digit SMS OTP codes. Neuron solves this with **biometric instant face login**.

#### How It Works:
- The patient's face biometric embedding is enrolled once into the `/auth/register-face` collection.
- Upon opening the app or navigating to the Login screen, the patient simply selects **Face Login** and glances at the front camera.
- The backend matches the live vector against the biometric registry (`/auth/face-login`). Upon match, an authenticated JWT session is issued immediately without requiring any password input.

#### Step-by-Step Usage Guide:
1. On the **Login** screen, choose the **Patient** tab.
2. Tap the blue **Instant Face Login** button.
3. Allow camera access and look directly at the screen.
4. Within 1 second, a glowing verification ring confirms identity, and you are automatically transitioned to your personalized Assistant dashboard.

---

### Feature 4: Multimodal Semantic Memory Vault (RAG)

#### What It Does:
Neuron acts as an associative memory bank. When a patient asks natural, vague, or fragmented questions (e.g., *"Who was the young girl who brought me soup?"*), standard keyword search fails. Neuron's RAG pipeline performs semantic vector searches across family notes, past conversations, and object logs.

#### Step-by-Step Usage Guide:
1. Tap the **Microphone** button or the chat input.
2. Ask any question in plain English or conversational speech:
   - *"Who is Priya?"*
   - *"What medicine do I take in the morning?"*
   - *"Tell me about my grandson."*
3. Neuron displays the retrieved facts, thumbnail photo, relation tag, and plays the family member's recorded voice sample if available.

---

### Feature 5: Dual-Engine Cognitive LLM Cortex (Groq & Gemini)

#### What It Does:
Neuron features a resilient, dual-engine intelligence switchboard:
- **Groq LLaMA 3.3 70B (Primary)**: Runs on custom LPU silicon delivering instantaneous response latencies (~200ms) with high clinical empathy.
- **Google Gemini 2.0 / 3.x Flash (Secondary / Vision)**: Provides high-throughput multimodal visual reasoning and serves as an automatic failover engine if Groq limits are reached.

#### Step-by-Step Usage Guide:
1. Look at the LLM badge in the top navigation bar or settings modal (displays **Groq LLaMA 3.3** or **Gemini Flash**).
2. Click the badge or toggle switch to switch providers on the fly.
3. The assistant posts a notification confirming the active neural cortex engine.

---

### Feature 6: Vision-in-the-Loop Task Coach (ADL Guidance)

#### What It Does:
Dementia patients often suffer from apraxia and executive function decay, rendering multi-step activities of daily living (ADLs)—such as brushing teeth, washing hands, or making breakfast—confusing and hazardous. The Task Coach provides step-by-step guidance while the camera monitors progress in real time to verify that each step is completed before advancing.

#### Supported Pre-configured Tasks:
- **Making a Cup of Tea / Coffee** (Get mug ➔ Add tea bag ➔ Pour hot water ➔ Add milk/sugar ➔ Stir)
- **Taking Daily Medication** (Locate medicine box ➔ Open compartment ➔ Take water glass ➔ Swallow pill)
- **Brushing Teeth** (Pick up toothbrush ➔ Apply toothpaste ➔ Brush teeth ➔ Rinse mouth)
- **Hand Washing** (Turn on tap ➔ Apply soap ➔ Lather hands ➔ Rinse ➔ Dry with towel)
- **Preparing Breakfast Cereal** (Get bowl ➔ Pour cereal ➔ Add milk ➔ Get spoon)

#### Step-by-Step Usage Guide:
1. Navigate to **Task Coach** (from bottom navigation on mobile or top nav on web).
2. Select an activity card (e.g., *"Making Tea"*).
3. Tap **Start Visual Guide**.
4. The screen splits into:
   - **Top / Left**: Live camera feed with active object detection bounding boxes.
   - **Bottom / Right**: Current step instruction, voice prompt, and progress bar.
5. Follow the spoken instruction. When the camera verifies the action (e.g., tea mug placed on counter), a green checkmark appears and the app advances to the next step.
6. If the user is stuck, tap **Speak Step** to hear the instructions repeated, or tap **Next Step** to proceed manually.

---

### Feature 7: Cognitive Gym (3 Clinical Memory Games)

#### What It Does:
Cognitive decline can be slowed through continuous, stress-free neuro-rehabilitation games. Unlike generic puzzle apps, Neuron's games dynamically query `/game/memory-pool` to pull **real photos of the patient’s family, pets, and home objects**.

#### Game Breakdown:

| Game | Clinical Mechanism | Target Brain Region | How to Play |
|---|---|---|---|
| **CortexMatch** | Visual spatial associative recall | Hippocampus & Short-Term Memory | Flip cards on the grid. Find matching pairs of family members and personal belongings. |
| **NeuroSequence** | Progressive multi-step working memory | Prefrontal Cortex & Focus | Watch the glowing pattern of lights and synthesized musical tones, then replicate the sequence in order. |
| **NumberSort** | Sequential logic & spatial planning | Executive Function & Reasoning | Reorder scrambled numbered tiles in ascending order as quickly and accurately as possible. |

#### Step-by-Step Usage Guide:
1. Tap **Memory Gym** on the navigation bar.
2. Select your game of choice.
3. Toggle background music or synthesized sound effects on or off using the top sound controls.
4. Complete levels to earn cognitive achievement badges.

---

### Feature 8: Caregiver Sanctuary & Emergency Escalation

#### What It Does:
The Caregiver Sanctuary gives family members, nurses, and doctors complete oversight of the patient's care ecosystem.

#### Key Modules:
- **Patient Profile**: Full medical registry including blood type, allergies, physician contact, and primary diagnosis.
- **Caregiver Team**: Invite additional caregivers with specific roles (Primary Doctor, Nurse, Family Member), phone numbers, and notification settings.
- **Memory & Object Manager**: View, edit, or delete enrolled faces and objects.
- **Daily Care Routines**: Create recurring daily tasks (e.g., *"Take blood pressure pill at 8:00 AM"*) that sync to the patient's task list.
- **Emergency Escalation System**: Patients can tap the red **Emergency Alert** button at any time. The system immediately dispatches urgent SMTP email alerts containing the patient's identity, timestamp, and status to all registered caregivers.

#### Step-by-Step Usage Guide:
1. Log in with a Caregiver account.
2. Select the **Caregiver** tab.
3. Use the sub-navigation tabs to manage **Profile**, **Care Team**, **Enrolled Memories**, and **Daily Tasks**.
4. To test emergency alerts, tap **Trigger Test Emergency Alert**; verify that all assigned caregivers receive the notification email.

---

### Feature 9: Natural Speech Engine (OpenAI Whisper & Edge TTS)

#### What It Does:
Typing on small virtual keyboards is difficult for elderly individuals with motor tremors or vision impairment. Neuron offers full hands-free voice interaction.

#### Features:
- **Hold-to-Talk Recording**: Speak naturally into the mobile or web microphone.
- **OpenAI Whisper Local Transcription**: Converts speech to clean text with high noise tolerance.
- **Edge TTS & Web Speech Synthesis**: Reads every assistant response out loud in a warm, patient tone.
- **Audio Sample Playback**: Allows the patient to listen to pre-recorded voice clips of their family members.

---

### Feature 10: 3D Holographic Companion Avatar

#### What It Does:
Text chat feels cold and clinical. Neuron provides an interactive 3D holographic companion rendered via Three.js. The avatar reacts to user voice input with speech vibrations, head tilt, and ambient breathing animations, creating a warm, comforting presence.

---

## 6. Web Application vs. Mobile App (Expo / Android APK) Comparison

Neuron is built with full parity between web and mobile, tailored for their respective form factors:

| Feature / Dimension | 🌐 Web Application (`frontend/`) | 📱 Mobile App (`neuron-mobile/`) |
|---|---|---|
| **Primary Platform** | Desktop, Laptop, Tablet Web Browsers | Android Smartphones & Tablets (APK) |
| **Framework** | React 18 + Vite | React Native 0.76 + Expo SDK 52 |
| **Styling** | TailwindCSS + CSS Glassmorphism | StyleSheet API + Custom Theme Palette |
| **Camera Access** | HTML5 `navigator.mediaDevices` | `expo-camera` (Native Camera2 API) |
| **Microphone Access** | HTML5 `MediaRecorder` (WebM) | `expo-av` (Native Audio Recording) |
| **3D Avatar Rendering** | Full Three.js / React Three Fiber Canvas | Animated Holographic Avatar Component |
| **Sound Synthesis** | Web Audio API + HTML5 Audio Elements | Native Expo AV Sound Engine |
| **Backend Connectivity** | Configured via `frontend/.env` | Dynamic URL Resolver in Settings Modal |
| **Deployment Target** | Firebase Hosting (`neuron-a940a.web.app`) | Standalone APK (`Neuron.apk`) via EAS |

---

## 7. Complete Backend API Reference

Base URL: `http://localhost:8000/api/v1` (or your public tunnel / cloud URL)

### Biometrics & Recognition Endpoints:
- `POST /recognize/person` — Uploads an image frame; returns identified person or `no_face_detected`.
- `POST /remember/person` — Enrolls a new person (image, name, relation, age, notes, audio file).
- `POST /remember/patient` — Enrolls the patient's primary biometric profile.
- `GET /people` — Retrieves all enrolled persons for the authenticated user.
- `PUT /people/{name}` — Updates details for an enrolled person.
- `DELETE /people/{name}` — Removes a person from the biometric database.

### Object Detection & Tracking Endpoints:
- `POST /find/object` — Uploads an image; runs YOLOv8 and vector search to locate personal items.
- `POST /remember/object` — Enrolls a new object (image, name, room/location, notes).
- `GET /objects` — Lists all registered objects and their last known locations.
- `PUT /objects/{name}` — Updates object location or notes.
- `DELETE /objects/{name}` — Removes an object from memory.

### Multimodal Chat & Reasoning Endpoints:
- `POST /chat/query` — RAG conversational endpoint (accepts query text, active LLM provider, user ID).
- `GET /llm/provider` — Returns active LLM provider (`groq` or `gemini`).
- `POST /llm/provider` — Dynamically switches active provider.
- `POST /voice/transcribe` — Receives WebM/WAV audio blob; returns Whisper transcribed text.

### Visual Task Guidance Endpoints:
- `POST /task-guide/start` — Initializes a step-by-step guidance session.
- `POST /task-guide/live-frame` — Transmits live camera frame for computer vision milestone verification.
- `POST /task-guide/step` — Manually advances or retrieves step guidance.
- `POST /task-guide/end` — Terminates an active guidance session.
- `GET /task-guide/session/{session_id}` — Retrieves session status.

### Authentication & Caregiver Endpoints:
- `POST /auth/register-face` — Registers face embedding for passwordless login.
- `POST /auth/face-login` — Glances at camera to authenticate and issue user session.
- `POST /auth/caregiver-login` — Authenticates caregiver via email and password credentials.
- `GET /caregivers` — Lists all caregivers assigned to the patient.
- `POST /caregivers` — Invites or registers a new caregiver.
- `DELETE /caregivers/{caregiver_id}` — Removes a caregiver from the team.
- `POST /caregiver/notify` — Triggers emergency alert emails via SMTP.

### Cognitive Gym Endpoints:
- `GET /game/memory-pool` — Returns randomized array of real patient family faces and objects for game cards.

### Routine Tasks Endpoints:
- `GET /tasks` — Retrieves patient's daily routine tasks.
- `POST /tasks` — Creates a new task.
- `PUT /tasks/{task_id}/toggle` — Toggles task between completed and pending.
- `DELETE /tasks/{task_id}` — Deletes a task.

---

## 8. Installation, Configuration & Deployment Playbook

### 8.1 Local Backend Setup

#### Prerequisites:
- Python 3.10 or 3.11 installed.
- Git and FFmpeg installed.

```bash
# 1. Navigate to the backend directory
cd Neuron-main

# 2. Create and activate a Python virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# 3. Install core dependencies
pip install -r requirements.txt

# 4. Configure environment variables in .env
cp .env.example .env
```

#### Required `.env` Variables:
```env
# Qdrant Vector Cloud
QDRANT_MODE=server
QDRANT_URL=https://your-cluster-id.us-east4-0.gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key

# LLM Inference Providers
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=AIzaSy_your_gemini_api_key
LLM_PROVIDER=groq

# Caregiver Emergency SMTP Alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_caregiver_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
EMAIL_FROM=your_caregiver_email@gmail.com
```

#### Run the Server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Access the interactive OpenAPI Swagger documentation at: `http://localhost:8000/docs`

---

### 8.2 Zero-Cost High-Performance Tunneling (Cloudflare / LocalTunnel)

*Recommended for live hackathon judging and demonstrations: 0 latency, 0 cold starts, full GPU/CPU power.*

```bash
# Option A: Cloudflare Tunnel (Instant HTTPS URL, no account needed)
npx cloudflared tunnel --url http://localhost:8000

# Option B: LocalTunnel (1-line setup)
npx localtunnel --port 8000
```
Copy the generated HTTPS URL (e.g., `https://rapid-river-42.trycloudflare.com`).

---

### 8.3 Web Frontend Setup (Vite / React) & Firebase Hosting

```bash
cd Neuron-main/frontend

# Install dependencies
npm install

# Configure environment in frontend/.env:
# VITE_API_BASE=https://your-tunnel-url/api/v1 (or http://localhost:8000/api/v1)

# Run local development server
npm run dev
```

#### Deploy to Firebase Hosting:
```bash
npm run build
firebase login
firebase deploy --only hosting
```
Live URL: **[https://neuron-a940a.web.app](https://neuron-a940a.web.app)**

---

### 8.4 Mobile Application Setup (Expo SDK 52) & APK Generation

```bash
cd Neuron-main/neuron-mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

#### How to Connect Mobile App to Backend:
1. Launch the app on your Android device or emulator.
2. Tap the **⚙️ Settings** icon on the top right header.
3. In the **Backend Server URL** input, enter your public tunnel URL or local machine IP (e.g., `https://neat-turtle-42.loca.lt/api/v1`).
4. Tap **Save & Connect**. The indicator turns green to confirm active connection.

#### Building Standalone APK:
```bash
npx eas-cli build -p android --profile preview
```
Direct APK output: `Neuron.apk` ready for direct installation on any Android phone.

---

### 8.5 Hugging Face Spaces (16GB Docker Cloud Deployment)

For a 24/7 cloud backend with no container sleep or memory throttling:
1. Create a free Space on [Hugging Face](https://huggingface.co/) with the **Docker** template.
2. Select the free **2 vCPU + 16 GB RAM** hardware tier.
3. Deploy the included `Dockerfile`:
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
4. Configure Secret Keys under Space Settings. The backend will be live at `https://<your-username>-neuron.hf.space/api/v1`.

---

## 9. Privacy, Data Security & Biometric Safeguards

1. **Vector-Only Biometric Persistence**: Neuron does not store raw, unencrypted face images in public databases. All faces are converted into mathematical floating-point vectors (embeddings). Reconstructing an original face from a 512-D vector is mathematically infeasible.
2. **Local Audio Transcription**: OpenAI Whisper processes patient voice recordings locally, preventing audio leaks to commercial voice-advertising aggregators.
3. **Multi-Tenant User Isolation**: Every Qdrant vector point and personal memory item is strictly indexed and filtered by the patient's unique `user_id`, preventing data cross-contamination between families.
4. **Emergency Encryption**: Patient emergency notifications are transmitted directly over encrypted TLS/SSL SMTP channels.

---

## 10. Judges Demo Script & Best Practices

To demonstrate Neuron effectively during evaluations:

### Act I: The Patient Dilemma (1 Minute)
1. Introduce the problem: An Alzheimer's patient sits down, unable to recall passwords or remember who is in the room.
2. Demonstrate **One-Glance Face Login**: Glance at the camera; the app logs in instantly without any password.

### Act II: Visual Perception in Action (2 Minutes)
1. **Face Recognition**: Point the camera at a colleague or enrolled photo. Tap **Scan Face**. The app announces: *"I see Sachin. He is your son who lives in Seattle."*
2. Play the pre-recorded voice sample: *"Hear Sachin speak."*
3. **Object Localization**: Ask the assistant: *"Where did I put my reading glasses?"* The assistant immediately provides the exact location and thumbnail.

### Act III: Visual Task Coach (1.5 Minutes)
1. Switch to **Task Coach**.
2. Select **"Making a Cup of Tea"**.
3. Point camera at a mug; demonstrate how the vision pipeline recognizes the object and auto-advances the step with audio encouragement.

### Act IV: Cognitive Gym & Caregiver Peace of Mind (1.5 Minutes)
1. Open **Memory Gym** ➔ Launch **CortexMatch**. Point out how the game cards feature the patient's actual family members and belongings instead of generic stock images.
2. Open **Caregiver Sanctuary**: Show the patient health overview and tap **Emergency Alert** to demonstrate immediate multi-channel escalation.

---

*Neuron — Empowering memory, restoring dignity, and bridging connections for those who need it most.*
