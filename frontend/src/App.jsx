import React, { useState, useEffect, useRef } from 'react';
import CameraView from './components/CameraView';
import AudioRecorder from './components/AudioRecorder';
import ChatInterface from './components/ChatInterface';
import EnrollmentForm from './components/EnrollmentForm';
import AvatarCanvas from './components/AvatarCanvas';
import axios from 'axios';
import { Maximize2, Minimize2 } from 'lucide-react';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CaregiverDashboard from './pages/CaregiverDashboard';
import NavBar from './components/SideNav'; // Imported as NavBar
import TaskGuideView from './components/TaskGuideView';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";



function App() {
  const [view, setView] = useState('landing');
  const [mode, setMode] = useState('person');
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello! Show me a face or object, or ask me a question." }
  ]);
  const [suggestions, setSuggestions] = useState([]);
  const [currentPerson, setCurrentPerson] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState(null);
  const [isCameraExpanded, setIsCameraExpanded] = useState(true); // Default Expanded
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(""); // Granular Status

  const [enrollType, setEnrollType] = useState('person'); // 'person' or 'object'
  const [llmProvider, setLlmProvider] = useState('groq'); // 'groq' (primary) or 'gemini'

  // UseRef to trigger camera capture from outside
  const cameraTriggerRef = useRef(null);

  const [captureTrigger, setCaptureTrigger] = useState(0);
  const [enrollData, setEnrollData] = useState(null);

  // Handlers
  const triggerScanFace = () => {
    setMode('person');
    setCaptureTrigger(Date.now());
  };

  const triggerScanObject = () => {
    setMode('object');
    setCaptureTrigger(Date.now());
  };

  const handleEnrollSave = async (data) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', data.file, 'enroll.jpg');
    formData.append('name', data.name);
    formData.append('notes', data.notes || '');

    if (data.type === 'object') {
      try {
        const res = await axios.post(`${API_BASE}/remember/object`, formData);
        addBotMessage(`I've remembered your ${data.name}.`);
        speakResponse(`I have remembered your ${data.name}.`);
        return { success: true };
      } catch (err) {
        console.error("Object enrollment error:", err);
        const detail = err.response?.data?.detail || err.message || "Failed to enroll object.";
        return { success: false, error: detail };
      } finally {
        setIsProcessing(false);
      }
    } else {
      formData.append('relation', data.relation || 'Acquaintance');
      if (data.age) formData.append('age', data.age);
      if (data.audioBlob) {
        formData.append('audio_file', data.audioBlob, 'voice.webm');
      }

      try {
        const res = await axios.post(`${API_BASE}/remember/person`, formData);
        const avatarUrl = res.data?.avatar_url;
        if (avatarUrl) {
          addBotMessage(`I've remembered ${data.name}. (Avatar Created)`);
        } else {
          addBotMessage(`I've remembered ${data.name}.`);
        }
        speakResponse(`I have remembered ${data.name}.`);
        return { success: true, avatar_url: avatarUrl };
      } catch (err) {
        console.error("Person enrollment error:", err);
        const detail = err.response?.data?.detail || err.message || "Failed to enroll person. Make sure face is clear.";
        return { success: false, error: detail };
      } finally {
        setIsProcessing(false);
      }
    }
  };

  useEffect(() => {
    setSuggestions([
      "Start Task Guide",
      "Where is my wallet?",
      "Enroll new person",
      "Enroll new object"
    ]);
  }, []);

  const handleSuggestionClick = (text) => {
    if (text === "Start Task Guide") {
      setView('task_guide');
    } else if (text === "Enroll new person") {
      setEnrollType('person');
      setMode('enroll_ui');
    } else if (text === "Enroll new object") {
      setEnrollType('object');
      setMode('enroll_ui');
    } else {
      handleSendMessage(text);
    }
  };

  const handleCapture = async (blob) => {
    setIsProcessing(true);
    const formData = new FormData();

    if (mode === 'enroll_capture' && enrollData) {
      formData.append('file', blob, 'enroll.jpg');
      formData.append('name', enrollData.name);
      formData.append('notes', enrollData.notes);

      try {
        if (enrollData.type === 'object') {
          await axios.post(`${API_BASE}/remember/object`, formData);
          addBotMessage(`I've remembered your ${enrollData.name}.`);
          speakResponse(`I have remembered your ${enrollData.name}.`);
        } else {
          formData.append('relation', enrollData.relation);
          if (enrollData.age) formData.append('age', enrollData.age);
          if (enrollData.audioBlob) {
            formData.append('audio_file', enrollData.audioBlob, 'voice.webm');
          }
          const res = await axios.post(`${API_BASE}/remember/person`, formData);
          if (res.data.avatar_url) {
            addBotMessage(`I've remembered ${enrollData.name}. (Avatar Created)`);
          } else {
            addBotMessage(`I've remembered ${enrollData.name}.`);
          }
          speakResponse(`I have remembered ${enrollData.name}.`);
        }
        setMode('person');
        setEnrollData(null);
      } catch (e) {
        console.error(e);
        addBotMessage("Failed to enroll.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    formData.append('file', blob, 'capture.jpg');

    try {
      let endpoint = mode === 'person' ? `${API_BASE}/recognize/person` : `${API_BASE}/find/object`;
      const res = await axios.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = res.data;

      if (mode === 'person' && data.status === 'identified') {
        setCurrentPerson(data.person);
        addBotMessage(`I see ${data.person.name}.`);
        updateSuggestions(data.person, 'person');
        speakResponse(`Hello ${data.person.name}.`);
      } else if (mode === 'object' && data.status === 'identified') {
        const loc = data.object.location || "unknown location";
        addBotMessage(`I found your ${data.object.name}. It is usually in ${loc}.`);
        updateSuggestions(data.object, 'object');
        speakResponse(`That is your ${data.object.name}. Location: ${loc}.`);
      } else if (mode === 'object' && data.status === 'generic_detection') {
        const objects = data.objects.map(o => o.object).join(", ");
        addBotMessage(`I see: ${objects}. (Not in my personal memory)`);
        const firstObj = data.objects && data.objects[0] ? data.objects[0].object : "item";
        updateSuggestions({ name: firstObj, type: 'object' }, 'object');
        speakResponse(`I see ${objects}.`);
      } else if (mode === 'person' && data.status === 'no_face_detected') {
        addBotMessage("I couldn't detect a face clearly. Please look straight at the camera and try again.");
        speakResponse("I couldn't see a face clearly. Please try again.");
      } else {
        addBotMessage(`I don't recognize that ${mode} in my memory.`);
        speakResponse(`I don't recognize that ${mode}.`);
      }
    } catch (err) {
      console.error(err);
      addBotMessage("Error connecting to memory service. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSuggestions = (entity, explicitType = null) => {
    if (!entity || !entity.name || entity.name === 'general' || entity.name === 'Memory') {
      setSuggestions([
        "Where is my black pen?",
        "Who is Sachin?",
        "I kept my keys in the drawer",
        "Scan an Object"
      ]);
      return;
    }

    const name = entity.name;
    const isObject = explicitType === 'object' ||
                     entity.type === 'object' ||
                     Boolean(entity.location && !entity.relation && !entity.age);

    if (isObject) {
      setSuggestions([
        `Where is my ${name}?`,
        `I moved my ${name} to drawer`,
        `When was my ${name} last updated?`,
        `Notes on ${name}`
      ]);
    } else {
      const list = [
        `Who is ${name}?`,
        `How do I know ${name}?`,
        `Any notes on ${name}?`
      ];
      if (entity.audio || entity.audio_base64) {
        list.push(`How does ${name} talk?`);
      }
      setSuggestions(list);
    }
  };

  const convertBase64ToAudioUrl = (rawAudio) => {
    if (!rawAudio) return null;
    if (typeof rawAudio === 'string' && (rawAudio.startsWith('blob:') || rawAudio.startsWith('http'))) {
      return rawAudio;
    }
    try {
      let cleanB64 = rawAudio;
      let mime = 'audio/webm';
      if (typeof rawAudio === 'string' && rawAudio.startsWith('data:')) {
        const parts = rawAudio.split(';base64,');
        mime = parts[0].replace('data:', '') || 'audio/webm';
        cleanB64 = parts[1] || '';
      }
      const binaryString = window.atob(cleanB64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mime });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn("Base64 audio convert fallback:", e);
      return (typeof rawAudio === 'string' && rawAudio.startsWith('data:')) ? rawAudio : `data:audio/webm;base64,${rawAudio}`;
    }
  };

  const playAudioSample = (urlOrData) => {
    if (!urlOrData) return;
    try {
      let src = urlOrData;
      if (typeof urlOrData === 'string' && !urlOrData.startsWith('blob:') && !urlOrData.startsWith('http') && !urlOrData.startsWith('data:')) {
        src = `data:audio/webm;base64,${urlOrData}`;
      }
      const audio = new Audio(src);
      audio.play().catch(err => console.warn("Audio playback note:", err));
    } catch (e) {
      console.warn("Failed to play audio sample:", e);
    }
  };

  const handleToggleLLM = async (provider) => {
    const newProv = provider || (llmProvider === 'groq' ? 'gemini' : 'groq');
    setLlmProvider(newProv);
    try {
      await axios.post(`${API_BASE}/llm/provider`, { provider: newProv });
      const engineName = newProv === 'gemini' ? 'Google Gemini 3.6 Flash' : 'Groq Llama 3 (Primary)';
      addBotMessage(`⚡ LLM Cortex switched to: ${engineName}`, null, null, [], newProv);
    } catch (e) {
      console.warn("Failed to update backend LLM provider:", e);
    }
  };

  const handleSendMessage = async (text) => {
    setIsProcessing(true);
    setProcessingStatus("Accessing Memory Bank...");

    // Simulate steps for better UX
    const statusInterval = setInterval(() => {
      setProcessingStatus(prev => {
        if (prev === "Accessing Memory Bank...") return "Consulting LLM Cortex...";
        if (prev === "Consulting LLM Cortex...") return "Synthesizing Response...";
        return prev;
      });
    }, 1500);

    setMessages(prev => [...prev, { role: 'user', text }]);
    let responseText = "I'm not sure about that.";
    let audioUrl = null;
    let imageBase64 = null;

    const lowerText = text.toLowerCase();
    const isVoiceQuery = lowerText.includes("talk") || lowerText.includes("voice") || lowerText.includes("sound") || lowerText.includes("speak") || lowerText.includes("hear");

    try {
      const audioData = currentPerson ? (currentPerson.audio || currentPerson.audio_base64) : null;
      if (currentPerson && isVoiceQuery) {
        if (audioData) {
          responseText = `Here is the voice sample for ${currentPerson.name}.`;
          audioUrl = convertBase64ToAudioUrl(audioData);
        } else {
          responseText = `I don't have a voice sample for ${currentPerson.name}.`;
        }

        clearInterval(statusInterval);
        setProcessingStatus("Retrieving Voice Sample...");

        setTimeout(() => {
          addBotMessage(responseText, audioUrl, null, [], llmProvider);
          speakResponse(responseText, () => {
            if (audioUrl) playAudioSample(audioUrl);
          });
          setIsProcessing(false);
          setProcessingStatus("");
        }, 600);
        return;
      }

      const res = await axios.post(`${API_BASE}/chat/query`, { text, provider: llmProvider });

      clearInterval(statusInterval);
      setProcessingStatus("Finalizing...");

      const data = res.data;
      const responseProvider = data.llm_provider || llmProvider;

      if (data.status === 'found') {
        responseText = data.text;
        const retrievedAudio = data.audio_base64 || (data.person ? (data.person.audio || data.person.audio_base64) : null);
        if (retrievedAudio) {
          audioUrl = convertBase64ToAudioUrl(retrievedAudio);
        }
        if (data.image_base64) imageBase64 = data.image_base64;
        
        if (data.person) {
          const isObj = data.entity_type === 'object' || data.person.type === 'object' || Boolean(data.person.location && !data.person.relation);
          if (!isObj) {
            setCurrentPerson(data.person);
          }
          updateSuggestions(data.person, isObj ? 'object' : 'person');
        }
      } else {
        responseText = data.text || "I don't know who that is.";
      }
      addBotMessage(responseText, audioUrl, imageBase64, data.gallery, responseProvider);
      speakResponse(responseText, () => {
        if (isVoiceQuery && audioUrl) {
          playAudioSample(audioUrl);
        }
      });
    } catch (e) {
      clearInterval(statusInterval);
      console.error(e);
      responseText = "I had trouble searching my memory.";
      addBotMessage(responseText, null, null, [], llmProvider);
      speakResponse(responseText);
    } finally {
      if (!(currentPerson && isVoiceQuery)) {
        setIsProcessing(false);
        setProcessingStatus("");
      }
    }
  };

  const addBotMessage = (text, audioUrl = null, imageBase64 = null, gallery = [], provider = null) => {
    setMessages(prev => [...prev, { role: 'bot', text, audioUrl, image: imageBase64, gallery, llmProvider: provider || llmProvider }]);
  };

  const speakResponse = (text, onComplete = null) => {
    setIsSpeaking(true);
    setAvatarMessage(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsSpeaking(false);
        setAvatarMessage(null);
        if (onComplete) onComplete();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setAvatarMessage(null);
        if (onComplete) onComplete();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setIsSpeaking(false);
        setAvatarMessage(null);
        if (onComplete) onComplete();
      }, 1500);
    }
  };

  // VIEW ROUTING
  let content;
  if (view === 'landing') {
    content = <LandingPage onGetStarted={() => setView('login')} />;
  }
  else if (view === 'login') {
    content = (
      <LoginPage onSelectRole={(role) => {
        if (role === 'caregiver') setView('caregiver');
        else setView('patient');
      }} />
    );
  }
  else if (view === 'caregiver') {
    content = <CaregiverDashboard />;
  } else if (view === 'task_guide') {
    content = (
      <TaskGuideView
        apiBase={API_BASE}
        onBackToPatient={() => setView('patient')}
      />
    );
  } else {
    // Patient App Content
    content = (
      <div className="app-container">
        {/* MAIN STAGE (FULL WIDTH) */}
        <div className="main-stage">
          <div className="avatar-zone">
            <AvatarCanvas isSpeaking={isSpeaking} isProcessing={isProcessing} processingStatus={processingStatus} message={avatarMessage} />
          </div>
          <div className="chat-zone">
            {mode === 'enroll_ui' ? (
              <EnrollmentForm
                type={enrollType}
                onCancel={() => setMode('person')}
                onSave={handleEnrollSave}
              />
            ) : (
              <ChatInterface
                messages={messages}
                currentPerson={currentPerson}
                onSendMessage={handleSendMessage}
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
                onPlayAudio={playAudioSample}
                onCapture={handleCapture}
                onScanFace={() => { setMode('person'); }}
                onScanObject={() => { setMode('object'); }}
                onEnroll={() => { setEnrollType('person'); setMode('enroll_ui'); }}
                onEnrollObject={() => { setEnrollType('object'); setMode('enroll_ui'); }}
                isTyping={isProcessing}
                typingStatus={processingStatus}
                captureTrigger={captureTrigger}
                enrollType={enrollType}
                llmProvider={llmProvider}
                onToggleLLM={handleToggleLLM}
              />
            )}
          </div>
        </div>

        <style>{`
        .app-container {
            display: flex;
            height: 100%;
            background: #060a12;
            color: #f1f5f9;
            overflow: hidden;
            flex-direction: row; 
            width: 100%;
        }
        .main-stage {
            flex: 1;
            display: flex;
            flex-direction: row;
            position: relative;
            background: transparent;
            overflow: hidden;
        }
        .avatar-zone {
            width: 460px;
            height: 100%;
            position: relative;
            background: transparent;
            flex-shrink: 0;
            z-index: 10;
        }
        .chat-zone {
            flex: 1;
            height: 100%;
            padding: 0;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            overflow: hidden;
            background: transparent;
        }
        @media (max-width: 900px) {
            .main-stage { flex-direction: column; }
            .avatar-zone { width: 100%; height: 320px; }
        }
      `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#060a12', overflow: 'hidden' }}>
      <NavBar onViewChange={setView} currentView={view} />
      <div style={{ flex: 1, paddingTop: '70px', height: '100%', overflow: 'hidden' }}>
        {content}
      </div>
    </div>
  );
}

export default App;
