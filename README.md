# Neuron - AI Memory Assistant

Neuron is a multimodal AI agent designed to act as an external memory for patients with Alzheimer's and Dementia. It uses Face Recognition, Vector Search (Qdrant), and LLMs (Llama 3 / OpenAI / Groq) to identify people, objects, and provide context-aware conversations.

## 🚀 Prerequisites

Before running the project, ensure you have the following installed:

*   **Python 3.10+**
*   **Node.js 18+** & **npm**
*   **Vector DB Key / Host** (Qdrant Local or Cloud)
*   **LLM API Key** (Groq, OpenAI, or chosen provider)

---

## 🛠️ Installation & Setup

### 1. Project Directory

```bash
cd Neuron
```

### 2. Backend Setup (FastAPI)
Create a virtual environment and install dependencies.

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup (React)
Install the node modules.

```bash
cd frontend
npm install
cd ..
```

### 4. Environment Configuration
Create a `.env` file in the root directory by copying the example.
```bash
cp .env.example .env
```

**Open `.env` and fill in your keys:**
```ini
# Qdrant (Memory)
QDRANT_MODE=server # or 'local'
QDRANT_URL=your_qdrant_url_here
QDRANT_API_KEY=your_qdrant_api_key_here

# LLM / Groq (AI Model)
GROQ_API_KEY=your_llm_api_key_here
```

### 5. Embeddings & Memory Setup
To start fresh with your own data:
1. Set `QDRANT_MODE=local` for offline local vector storage or provide `QDRANT_URL` and `QDRANT_API_KEY` for Qdrant Cloud.
2. Go to the **Caregiver Dashboard** (`/caregiver`) and upload photos/details for the people you want the AI to remember.
3. Once enrolled, the **Memory Chat** and **Camera** will start recognizing these individuals.

---

## ▶️ Running the Application

### Step 1: Start the Backend
Open a terminal in the Neuron folder (ensure `venv` is active):
```bash
uvicorn app.main:app --reload --port 8000
```
*The API will be available at `http://localhost:8000`*

### Step 2: Start the Frontend
Open a **new** terminal, navigate to `frontend`:
```bash
cd frontend
npm run dev
```
*The App will be available at `http://localhost:5173`*

---

## 📱 Features
1.  **Caregiver Dashboard:** Enroll faces and objects (`/remember/patient`).
2.  **Memory Chat:** Speak to the Avatar to ask "Who is this?" or "Where are my keys?".
3.  **Object Scan:** Use the camera to detect objects (Keys, Medicine).

---

## ⚠️ Troubleshooting
*   **"Qdrant Connection Refused":** Ensure Docker/Local Qdrant is running or your Cloud URL is correct.
*   **"LLM Error":** Check your API Key configuration in `.env`.
*   **Frontend API Error:** Ensure Backend is running on port `8000`.

