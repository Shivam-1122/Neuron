import axios from 'axios';
import { Platform } from 'react-native';

// Default host: Permanent Ngrok domain
const DEFAULT_HOST = 'https://sampling-shield-capillary.ngrok-free.dev';
let currentApiBase = `${DEFAULT_HOST}/api/v1`;

export const getApiBase = () => currentApiBase;
export const setApiBase = (newUrl) => {
  if (!newUrl) return;
  let formatted = newUrl.trim();
  if (formatted.endsWith('/')) formatted = formatted.slice(0, -1);
  if (!formatted.endsWith('/api/v1')) formatted += '/api/v1';
  currentApiBase = formatted;
};

// Ping / Health test
export const testApiConnection = async () => {
  const startTime = Date.now();
  try {
    const res = await axios.get(`${currentApiBase}/llm/provider`, { timeout: 4000 });
    const latency = Date.now() - startTime;
    return {
      success: true,
      latency,
      data: res.data,
      message: `Cortex Connected (${latency}ms)`
    };
  } catch (err) {
    return {
      success: false,
      latency: null,
      error: err.message,
      message: 'Failed to reach Neural Core'
    };
  }
};

// Recognize Face
export const recognizePersonApi = async (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'scan.jpg',
    type: 'image/jpeg'
  });
  const res = await axios.post(`${currentApiBase}/recognize/person`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000
  });
  return res.data;
};

// Find / Identify Object
export const findObjectApi = async (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'scan_object.jpg',
    type: 'image/jpeg'
  });
  const res = await axios.post(`${currentApiBase}/find/object`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000
  });
  return res.data;
};

// Enroll Person
export const rememberPersonApi = async ({ name, relation, age, notes, imageUri, audioUri }) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('relation', relation || 'Acquaintance');
  if (notes) formData.append('notes', notes);
  if (age) formData.append('age', String(age));
  formData.append('file', {
    uri: imageUri,
    name: 'enroll.jpg',
    type: 'image/jpeg'
  });
  if (audioUri) {
    formData.append('audio_file', {
      uri: audioUri,
      name: 'voice.webm',
      type: 'audio/webm'
    });
  }
  const res = await axios.post(`${currentApiBase}/remember/person`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 45000
  });
  return res.data;
};

// Enroll Patient (Caregiver Hub)
export const rememberPatientApi = async ({ name, relation, age, notes, imageUri, audioUri }) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('relation', relation || 'Acquaintance');
  if (notes) formData.append('notes', notes);
  if (age) formData.append('age', String(age));
  formData.append('file', {
    uri: imageUri,
    name: 'enroll_patient.jpg',
    type: 'image/jpeg'
  });
  if (audioUri) {
    formData.append('audio_file', {
      uri: audioUri,
      name: 'voice.webm',
      type: 'audio/webm'
    });
  }
  const res = await axios.post(`${currentApiBase}/remember/patient`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 45000
  });
  return res.data;
};

// Enroll Object
export const rememberObjectApi = async ({ name, notes, imageUri }) => {
  const formData = new FormData();
  formData.append('name', name);
  if (notes) formData.append('notes', notes);
  formData.append('file', {
    uri: imageUri,
    name: 'enroll_object.jpg',
    type: 'image/jpeg'
  });
  const res = await axios.post(`${currentApiBase}/remember/object`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000
  });
  return res.data;
};

// Chat & Semantic Knowledge Query
export const chatQueryApi = async (text, provider = 'groq') => {
  const res = await axios.post(`${currentApiBase}/chat/query`, {
    text,
    provider
  }, { timeout: 35000 });
  return res.data;
};

// LLM Engine Provider Info & Switcher
export const getLLMProviderApi = async () => {
  const res = await axios.get(`${currentApiBase}/llm/provider`);
  return res.data;
};

export const setLLMProviderApi = async (provider) => {
  const res = await axios.post(`${currentApiBase}/llm/provider`, { provider });
  return res.data;
};

// Voice transcription via Whisper
export const transcribeVoiceApi = async (audioUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    name: 'query.webm',
    type: 'audio/webm'
  });
  const res = await axios.post(`${currentApiBase}/voice/transcribe`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000
  });
  return res.data;
};

// Biometric Face Scan Login
export const faceLoginApi = async (imageUri) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'face_scan.jpg',
    type: 'image/jpeg'
  });
  const res = await axios.post(`${currentApiBase}/auth/face-login`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000
  });
  return res.data;
};

// Caregiver Password / Identifier Login
export const caregiverLoginApi = async (identifier, password) => {
  const res = await axios.post(`${currentApiBase}/auth/caregiver-login`, {
    identifier: identifier.trim(),
    password: password
  }, { timeout: 20000 });
  return res.data;
};

// Register User Face for Biometric Login
export const registerFaceApi = async ({ userId, name, email, phone, imageUri }) => {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('name', name);
  if (email) formData.append('email', email);
  if (phone) formData.append('phone', phone);
  if (imageUri) {
    formData.append('file', {
      uri: imageUri,
      name: 'profile_face.jpg',
      type: 'image/jpeg'
    });
  }
  const res = await axios.post(`${currentApiBase}/auth/register-face`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 35000
  });
  return res.data;
};

// Caregivers Management
export const getCaregiversApi = async (userId = 'default_user') => {
  const res = await axios.get(`${currentApiBase}/caregivers`, {
    params: { user_id: userId },
    timeout: 15000
  });
  return res.data;
};

export const addCaregiverApi = async ({ name, email, phone, relation, password, userId, imageUri }) => {
  const formData = new FormData();
  formData.append('name', name.trim());
  formData.append('email', email.trim());
  if (phone) formData.append('phone', phone.trim());
  formData.append('relation', relation || 'Primary Caregiver');
  formData.append('password', password || 'caregiver123');
  formData.append('user_id', userId || 'default_user');
  if (imageUri) {
    formData.append('file', {
      uri: imageUri,
      name: 'caregiver_face.jpg',
      type: 'image/jpeg'
    });
  }
  const res = await axios.post(`${currentApiBase}/caregivers`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000
  });
  return res.data;
};

export const deleteCaregiverApi = async (caregiverId, userId = 'default_user') => {
  const res = await axios.delete(`${currentApiBase}/caregivers/${encodeURIComponent(caregiverId)}`, {
    params: { user_id: userId },
    timeout: 15000
  });
  return res.data;
};

export const sendCaregiverAlertApi = async (userId = 'default_user', alertType = 'distress', note = '') => {
  const res = await axios.post(`${currentApiBase}/caregivers/alert`, {
    user_id: userId,
    type: alertType,
    note: note
  }, { timeout: 15000 });
  return res.data;
};

// Live Task Guidance Endpoints
export const startTaskApi = async (query) => {
  const res = await axios.post(`${currentApiBase}/task/start`, { query }, { timeout: 25000 });
  return res.data;
};

export const sendTaskLiveFrameApi = async ({ sessionId, imageB64, speechText = '', elapsedSeconds = 0 }) => {
  const res = await axios.post(`${currentApiBase}/task/live-frame`, {
    session_id: sessionId,
    image_b64: imageB64,
    speech_text: speechText,
    elapsed_seconds: elapsedSeconds
  }, { timeout: 20000 });
  return res.data;
};

export const setTaskStepApi = async (sessionId, stepIndex) => {
  const res = await axios.post(`${currentApiBase}/task/step`, {
    session_id: sessionId,
    step_index: stepIndex
  });
  return res.data;
};

export const endTaskApi = async (sessionId) => {
  const res = await axios.post(`${currentApiBase}/task/end`, {
    session_id: sessionId
  });
  return res.data;
};

