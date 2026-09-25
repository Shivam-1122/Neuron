import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Send, 
    Volume2, 
    User, 
    Package, 
    Sparkles, 
    Mic, 
    MicOff, 
    Play,
    Pause,
    RotateCcw, 
    Check, 
    Calendar, 
    Clock, 
    X, 
    Radio,
    Plus,
    UserPlus,
    PackagePlus,
    ScanFace,
    Scan,
    SlidersHorizontal,
    Trash2,
    Mail,
    CheckCircle2,
    RefreshCw
} from 'lucide-react';
import CameraView from './CameraView';
import soundManager from '../utils/soundManager';
import { formatImageSrc } from '../utils/imageUtils';
import { getApiBase } from '../utils/apiConfig';

const API_BASE = getApiBase();

export default function ChatInterface({
    messages = [],
    currentPerson = null,
    onSendMessage,
    suggestions = [],
    onSuggestionClick,
    onPlayAudio,
    onSpeakText,
    onCapture,
    onScanFace,
    onScanObject,
    onEnroll,
    onEnrollObject,
    onPlayGame,
    isTyping,
    typingStatus,
    captureTrigger,
    enrollType,
    scanMode = 'person',
    llmProvider = 'groq',
    onToggleLLM,
    onOpenSettings,
    dataVersion = 0,
    userId = null
}) {
    const [input, setInput] = useState("");
    const [showCamera, setShowCamera] = useState(false);
    const [cameraMode, setCameraMode] = useState('person');
    const [isListening, setIsListening] = useState(false);
    const [actionMenuOpen, setActionMenuOpen] = useState(false);
    const actionMenuRef = useRef(null);
    const actionMenuCloseTimerRef = useRef(null);

    const handleActionMenuMouseEnter = () => {
        if (actionMenuCloseTimerRef.current) {
            clearTimeout(actionMenuCloseTimerRef.current);
            actionMenuCloseTimerRef.current = null;
        }
        setActionMenuOpen(true);
    };

    const handleActionMenuMouseLeave = () => {
        if (actionMenuCloseTimerRef.current) {
            clearTimeout(actionMenuCloseTimerRef.current);
        }
        actionMenuCloseTimerRef.current = setTimeout(() => {
            setActionMenuOpen(false);
        }, 280);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
                setActionMenuOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setActionMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
            if (actionMenuCloseTimerRef.current) {
                clearTimeout(actionMenuCloseTimerRef.current);
            }
        };
    }, []);
    const [companionState, setCompanionState] = useState('idle'); // 'idle' | 'listening' | 'speaking'
    const [enrolledPeople, setEnrolledPeople] = useState([]);
    const [notifiedQueries, setNotifiedQueries] = useState({});
    const [notifyingIndex, setNotifyingIndex] = useState(null);
    const [playingMsgIndex, setPlayingMsgIndex] = useState(null);
    const currentAudioRef = useRef(null);

    const handlePlayVoiceSample = (audioUrl, idx) => {
        if (!audioUrl) return;
        if (playingMsgIndex === idx && currentAudioRef.current) {
            currentAudioRef.current.pause();
            setPlayingMsgIndex(null);
            return;
        }
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
        }
        const cleanUrl = (typeof audioUrl === 'string' && (audioUrl.startsWith('data:') || audioUrl.startsWith('blob:') || audioUrl.startsWith('http')))
            ? audioUrl
            : `data:audio/webm;base64,${audioUrl}`;
        const audio = new Audio(cleanUrl);
        currentAudioRef.current = audio;
        setPlayingMsgIndex(idx);
        audio.onended = () => {
            setPlayingMsgIndex(null);
        };
        audio.onerror = (e) => {
            console.warn("Audio element error:", e);
            setPlayingMsgIndex(null);
            if (onPlayAudio) onPlayAudio(audioUrl);
        };
        audio.play().catch(err => {
            console.warn("Playback error:", err);
            setPlayingMsgIndex(null);
            if (onPlayAudio) onPlayAudio(audioUrl);
        });
    };

    useEffect(() => {
        return () => {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
            }
        };
    }, []);

    const handleNotifyCaregiver = async (queryText, index) => {
        if (notifyingIndex !== null) return;
        setNotifyingIndex(index);
        try {
            soundManager.playChime('click');
            const res = await axios.post(`${API_BASE}/caregiver/notify`, {
                user_id: userId || 'default_user',
                patient_name: 'Sanctuary Patient',
                query: queryText || 'Patient requested information with no matching record in memory cortex.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

            if (res.data && res.data.status === 'no_recipients') {
                alert("No caregiver emails registered yet. Please add a caregiver in the Caregiver section.");
            } else {
                soundManager.playChime('send');
                const list = res.data?.notified_caregivers || [];
                setNotifiedQueries(prev => ({
                    ...prev,
                    [index]: {
                        count: list.length || 1,
                        emails: list
                    }
                }));
            }
        } catch (err) {
            console.error("Caregiver notification error:", err);
            alert("Could not send email alert to caregivers. Please verify connection.");
        } finally {
            setNotifyingIndex(null);
        }
    };

    // DYNAMIC TIME-BASED GREETING (e.g. Good morning / afternoon / evening / night)
    const getGreetingDetails = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
            return {
                greeting: "Good morning",
                timeLabel: "this morning",
                subtext: "A peaceful new day begins. Take your time, breathe gently, and let me know how I can assist your routine."
            };
        } else if (hour >= 12 && hour < 17) {
            return {
                greeting: "Good afternoon",
                timeLabel: "this afternoon",
                subtext: "Wishing you a tranquil and pleasant afternoon. Your memory companion is here whenever you need."
            };
        } else if (hour >= 17 && hour < 21) {
            return {
                greeting: "Good evening",
                timeLabel: "this evening",
                subtext: "The evening is quiet and relaxing. Unwind comfortably, and let me know if you need any reminders or guidance."
            };
        } else {
            return {
                greeting: "Good evening",
                timeLabel: "tonight",
                subtext: "The night is calm and peaceful. Rest comfortably, take your time, and let me know if you need any gentle assistance."
            };
        }
    };
    const greetingDetails = getGreetingDetails();
    
    // Face Management: Choose which 2 faces appear (defaults to 2 newest)
    const [managedFaceNames, setManagedFaceNames] = useState(() => {
        try {
            const saved = localStorage.getItem('neuron_displayed_faces');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [showFaceManager, setShowFaceManager] = useState(false);
    const [tempSelectedFaces, setTempSelectedFaces] = useState([]);
    const prevNamesRef = useRef([]);

    // Robust image source helper that prevents double data URI prefixes
    const getFaceImageSrc = (img) => {
        return formatImageSrc(img);
    };

    const endRef = useRef(null);
    const inputRef = useRef("");
    const recognitionRef = useRef(null);

    const fetchEnrolledPeople = async () => {
        try {
            const res = await axios.get(`${API_BASE}/people`, { params: userId ? { user_id: userId } : {} });
            if (res.data && Array.isArray(res.data.people)) {
                setEnrolledPeople(res.data.people);
            }
        } catch (e) {
            console.warn("Could not fetch enrolled people:", e);
        }
    };

    useEffect(() => {
        fetchEnrolledPeople();
    }, [messages.length, dataVersion, userId]);

    // When newly enrolled person is added, ensure they appear immediately as one of the 2 displayed faces
    useEffect(() => {
        const currentNames = enrolledPeople.map(p => p.name);
        const newNames = currentNames.filter(n => !prevNamesRef.current.includes(n));
        if (newNames.length > 0 && prevNamesRef.current.length > 0) {
            const newest = newNames[0];
            setManagedFaceNames(prev => {
                const next = [newest, ...prev.filter(n => n !== newest)].slice(0, 2);
                try { localStorage.setItem('neuron_displayed_faces', JSON.stringify(next)); } catch(e) {}
                return next;
            });
        }
        prevNamesRef.current = currentNames;
    }, [enrolledPeople]);

    // Display maximum of 2 people (prioritizing user custom selection or newest)
    const displayedPeople = React.useMemo(() => {
        if (!enrolledPeople || enrolledPeople.length === 0) return [];
        if (managedFaceNames && managedFaceNames.length > 0) {
            const chosen = enrolledPeople.filter(p => managedFaceNames.includes(p.name));
            if (chosen.length > 0) {
                if (chosen.length < 2) {
                    const remaining = enrolledPeople.filter(p => !managedFaceNames.includes(p.name));
                    return [...chosen, ...remaining].slice(0, 2);
                }
                return chosen.slice(0, 2);
            }
        }
        return enrolledPeople.slice(0, 2);
    }, [enrolledPeople, managedFaceNames]);

    useEffect(() => {
        inputRef.current = input;
    }, [input]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // TODAY'S GENTLE ANCHORS (DYNAMIC SCHEDULED ROUTINES)
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskTime, setNewTaskTime] = useState("");
    const [newTaskNotes, setNewTaskNotes] = useState("");
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);

    // READ ALOUD / SPEECH SYNTHESIS STATE
    const [speakingMsgIndex, setSpeakingMsgIndex] = useState(null);

    const fetchTasks = async () => {
        try {
            setLoadingTasks(true);
            const res = await axios.get(`${API_BASE}/tasks`, { params: userId ? { user_id: userId } : {} });
            if (res.data && Array.isArray(res.data.tasks)) {
                setTasks(res.data.tasks);
            }
        } catch (e) {
            console.warn("Could not fetch gentle anchors tasks:", e);
        } finally {
            setLoadingTasks(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [dataVersion, messages.length, userId]);

    // Cleanup TTS on unmount
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                try { window.speechSynthesis.cancel(); } catch (e) {}
            }
        };
    }, []);

    const handleToggleTask = async (taskId) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const nextCompleted = !t.completed;
                return {
                    ...t,
                    completed: nextCompleted,
                    completed_at: nextCompleted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
                };
            }
            return t;
        }));
        try {
            soundManager.playChime('click');
            await axios.put(`${apiBase}/tasks/${encodeURIComponent(taskId)}/toggle`, null, {
                params: userId ? { user_id: userId } : {}
            });
        } catch (e) {
            console.error("Failed to toggle task:", e);
            fetchTasks();
        }
    };

    const handleDeleteTask = async (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        try {
            soundManager.playChime('click');
            await axios.delete(`${apiBase}/tasks/${encodeURIComponent(taskId)}`, {
                params: userId ? { user_id: userId } : {}
            });
        } catch (e) {
            console.error("Failed to delete task:", e);
            fetchTasks();
        }
    };

    const handleCreateTask = async (e) => {
        if (e) e.preventDefault();
        if (!newTaskTitle.trim() || isSubmittingTask) return;
        setIsSubmittingTask(true);
        try {
            const res = await axios.post(`${apiBase}/tasks`, {
                title: newTaskTitle.trim(),
                time: newTaskTime.trim() || "Today",
                notes: newTaskNotes.trim() || "",
                user_id: userId || "default_user"
            });
            if (res.data && res.data.task) {
                setTasks(prev => [...prev, res.data.task]);
                soundManager.playChime('send');
            }
            setNewTaskTitle("");
            setNewTaskTime("");
            setNewTaskNotes("");
            setIsAddingTask(false);
        } catch (e) {
            console.error("Failed to add task:", e);
        } finally {
            setIsSubmittingTask(false);
        }
    };

    const handleReadAloud = (msg, index) => {
        if (!msg) return;

        // Toggle off if currently reading this specific message
        if (speakingMsgIndex === index) {
            if ('speechSynthesis' in window) {
                try { window.speechSynthesis.cancel(); } catch (e) {}
            }
            setSpeakingMsgIndex(null);
            return;
        }

        // Cancel previous speech
        if ('speechSynthesis' in window) {
            try { window.speechSynthesis.cancel(); } catch (e) {}
        }

        // If message has pre-recorded voice audio
        if (msg.audioUrl && onPlayAudio) {
            setSpeakingMsgIndex(index);
            onPlayAudio(msg.audioUrl);
            setTimeout(() => setSpeakingMsgIndex(null), 4000);
            return;
        }

        const textToSpeak = msg.text || '';
        if (!textToSpeak) return;

        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.rate = 0.92;
                utterance.pitch = 1.05;
                setSpeakingMsgIndex(index);
                utterance.onend = () => setSpeakingMsgIndex(null);
                utterance.onerror = () => setSpeakingMsgIndex(null);
                window.speechSynthesis.speak(utterance);
            } catch (err) {
                console.warn("Speech synthesis error:", err);
                setSpeakingMsgIndex(null);
                if (onSpeakText) onSpeakText(textToSpeak, true);
            }
        } else if (onSpeakText) {
            setSpeakingMsgIndex(index);
            onSpeakText(textToSpeak, true);
            setTimeout(() => setSpeakingMsgIndex(null), 3500);
        }
    };

    // Handle External Capture Trigger (e.g. from Settings or Enrollment)
    const prevCaptureTriggerRef = useRef(captureTrigger);
    useEffect(() => {
        if (captureTrigger && captureTrigger > 0 && captureTrigger !== prevCaptureTriggerRef.current) {
            setCameraMode(scanMode || enrollType || 'person');
            setShowCamera(true);
        }
        prevCaptureTriggerRef.current = captureTrigger;
    }, [captureTrigger, scanMode, enrollType]);

    // Update companion state based on isTyping / external status
    useEffect(() => {
        if (isTyping) {
            setCompanionState('speaking');
        } else if (isListening) {
            setCompanionState('listening');
        } else {
            setCompanionState('idle');
        }
    }, [isTyping, isListening]);

    // Safe Send Function
    const handleSend = (textToSend) => {
        const text = (textToSend || input).trim();
        if (!text) return;
        soundManager.playChime('send');
        setInput("");
        inputRef.current = "";
        onSendMessage(text);
    };

    // Speech-to-Text Recognition Setup
    const toggleSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please type your message.");
            return;
        }

        if (isListening) {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }
            setIsListening(false);
            setCompanionState('idle');
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                setCompanionState('listening');
                soundManager.playChime('click');
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                const spokenText = finalTranscript || interimTranscript;
                if (spokenText) {
                    setInput(spokenText);
                }
                if (finalTranscript) {
                    handleSend(finalTranscript);
                }
            };

            recognition.onerror = () => {
                setIsListening(false);
                setCompanionState('idle');
            };

            recognition.onend = () => {
                setIsListening(false);
                setCompanionState('idle');
            };

            recognition.start();
        } catch (err) {
            console.error(err);
            setIsListening(false);
            setCompanionState('idle');
        }
    };

    return (
        <div className="w-full h-full min-h-full bg-[#111318] text-[#e2e2e9] p-2.5 sm:p-4 md:p-6 lg:p-8 overflow-y-auto select-none">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

                {/* ========================================================= */}
                {/* 1. TOP SANCTUARY GREETING & AMBIENT STATUS                */}
                {/* ========================================================= */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 pb-1 sm:pb-2">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            <span className="font-mono text-[10px] sm:text-[11px] text-amber-300 tracking-widest uppercase">
                                PARLOR SANCTUARY • 21°C • PEACEFUL ROUTINE
                            </span>
                        </div>
                        <h1 className="font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                            {currentPerson?.name && currentPerson.name !== 'general' && currentPerson.name !== 'Memory'
                                ? `${greetingDetails.greeting}, ${currentPerson.name}`
                                : greetingDetails.greeting}
                        </h1>
                        <p className="font-sans text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                            {greetingDetails.subtext}
                        </p>
                    </div>

                    {/* Companion State Indicator Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 bg-[#181a20] p-1 sm:p-1.5 rounded-xl border border-white/[0.06] shadow-sm max-w-full">
                        <button 
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-sans font-medium transition-all flex items-center gap-1.5 ${
                                companionState === 'idle'
                                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                            onClick={() => setCompanionState('idle')}
                        >
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400"></span>
                            <span>Gentle Resting</span>
                        </button>

                        <button 
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-sans font-medium transition-all flex items-center gap-1.5 ${
                                companionState === 'listening'
                                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                            onClick={toggleSpeechRecognition}
                        >
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 animate-ping"></span>
                            <span>{isListening ? 'Listening...' : 'Listen'}</span>
                        </button>

                        <button 
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-sans font-medium transition-all flex items-center gap-1.5 ${
                                companionState === 'speaking'
                                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400"></span>
                            <span>Speaking</span>
                        </button>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* 2. MAIN TWO-COLUMN SANCTUARY ARCHITECTURE                 */}
                {/* ========================================================= */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-start">
                    
                    {/* LEFT COLUMN: COMPANION PRESENCE, INVITATIONS & ANCHORS (7 cols) */}
                    <div className="xl:col-span-7 space-y-4 sm:space-y-6">

                        {/* COMPANION AVATAR CARD WITH BREATHING HALO */}
                        <div className="relative w-full rounded-2xl bg-[#181a20] border border-white/[0.08] p-4 sm:p-6 shadow-xl overflow-hidden flex flex-col items-center justify-between min-h-[320px] sm:min-h-[380px] md:min-h-[440px]">
                            
                            {/* Subtle Ambient Radial Cones */}
                            <div className="absolute -top-16 -left-16 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-amber-500/10 blur-[90px] pointer-events-none" />
                            <div className="absolute -bottom-16 -right-16 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-blue-500/10 blur-[90px] pointer-events-none" />

                            {/* Card Top Telemetry */}
                            <div className="w-full flex items-center justify-between z-10 font-mono text-[10px] sm:text-xs">
                                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#111318]/80 border border-amber-500/30 text-amber-300">
                                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    <span>
                                        {companionState === 'listening' ? 'Aura: Attentive Presence' : companionState === 'speaking' ? 'Aura: Speaking Calmly' : 'Aura: Resting Harmony'}
                                    </span>
                                </div>
                                <span className="text-slate-500 text-[10px] sm:text-[11px]">
                                    // DEPTH 98.4% • SERENE
                                </span>
                            </div>

                            {/* Center Avatar Presence with Halo Rings */}
                            <div className="relative z-10 flex flex-col items-center justify-center my-3 sm:my-6">
                                <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 flex items-center justify-center">
                                    {/* Breathing Glow Outer Rings */}
                                    <div className={`absolute inset-0 rounded-full bg-amber-500/15 filter blur-2xl transition-all duration-1000 ${companionState !== 'idle' ? 'scale-110 bg-amber-500/25' : 'scale-95'}`} />
                                    <div className="absolute -inset-2 sm:-inset-4 rounded-full border border-amber-500/20 border-dashed animate-[spin_40s_linear_infinite] pointer-events-none" />
                                    
                                    {/* Avatar Circle Container */}
                                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-full bg-[#111318] border-2 border-amber-500/40 shadow-2xl flex items-center justify-center overflow-hidden">
                                        <img 
                                            src={companionState === 'speaking' ? "/assets/speaking.gif" : "/assets/idle.gif"} 
                                            alt="Companion Avatar"
                                            className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-transform duration-500 hover:scale-105"
                                        />
                                    </div>

                                    {/* Large Tactile Microphone Button Floating on Bottom */}
                                    <button 
                                        onClick={toggleSpeechRecognition}
                                        className={`absolute -bottom-2 w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95 cursor-pointer z-20 ${
                                            isListening
                                                ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-pulse'
                                                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 hover:scale-105'
                                        }`}
                                        title={isListening ? "Listening... Tap to stop" : "Tap microphone to speak"}
                                    >
                                        {isListening ? <Mic size={20} className="animate-bounce" /> : <Mic size={20} />}
                                    </button>
                                </div>

                                <div className="mt-3 sm:mt-5 text-center space-y-1">
                                    <h3 className="font-serif text-base sm:text-lg font-semibold text-white">
                                        {companionState === 'listening' ? 'Neuron is gently listening...' : companionState === 'speaking' ? 'Neuron is responding...' : 'Neuron is breathing with you'}
                                    </h3>
                                    <p className="font-sans text-[11px] sm:text-xs text-slate-400">
                                        Tap microphone to speak or use the chat below
                                    </p>
                                </div>
                            </div>

                            {/* Bottom Acoustic Stream Bar */}
                            <div className="w-full flex flex-wrap items-center justify-between gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#111318]/70 border border-white/[0.05] z-10 text-[10px] sm:text-xs font-mono">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400">
                                    <Radio size={14} className="text-amber-400 animate-pulse shrink-0" />
                                    <span className="truncate">ACOUSTIC STREAM: 432Hz HARMONIC</span>
                                </div>
                                <div className="flex items-center gap-1 h-3.5">
                                    <span className="w-1 bg-amber-400/60 rounded-full h-2 animate-[pulse_1s_infinite]"></span>
                                    <span className="w-1 bg-amber-400/80 rounded-full h-3.5 animate-[pulse_1.2s_infinite_0.1s]"></span>
                                    <span className="w-1 bg-amber-400 rounded-full h-2 animate-[pulse_0.9s_infinite_0.2s]"></span>
                                    <span className="w-1 bg-amber-400/60 rounded-full h-3 animate-[pulse_1.1s_infinite_0.3s]"></span>
                                </div>
                                <span className="text-amber-300/90 shrink-0">CALM: 96/100</span>
                            </div>
                        </div>

                        {/* FAMILIAR FACES & MEMORY ANCHORS (MAX 2 FACES + CORNERED ADD ANOTHER + MANAGE) */}
                        <div className="bg-[#181a20] p-3.5 sm:p-5 rounded-2xl border border-white/[0.06] shadow-md space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-amber-400" />
                                    <span className="font-sans text-xs font-semibold text-white uppercase tracking-wider">
                                        Familiar Faces &amp; Loved Ones
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Manage button to choose which 2 faces appear */}
                                    {enrolledPeople.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTempSelectedFaces(displayedPeople.map(p => p.name));
                                                setShowFaceManager(true);
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white text-[11px] sm:text-xs font-sans flex items-center gap-1.5 transition-all cursor-pointer"
                                            title="Manage which 2 faces appear here"
                                        >
                                            <SlidersHorizontal size={12} className="text-amber-400" />
                                            <span>Manage ({displayedPeople.length}/2)</span>
                                        </button>
                                    )}

                                    {/* Cornered Add Another Button when both 2 faces are shown */}
                                    {displayedPeople.length === 2 && (
                                        <button
                                            type="button"
                                            onClick={onEnroll}
                                            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                                            title="Add another loved one or caregiver"
                                        >
                                            <Plus size={13} />
                                            <span>Add Another</span>
                                        </button>
                                    )}

                                    {displayedPeople.length < 2 && enrolledPeople.length > 0 && (
                                        <span className="font-mono text-[9px] sm:text-[10px] text-slate-500 uppercase">
                                            TOUCH TO RECALL
                                        </span>
                                    )}
                                </div>
                            </div>

                            {enrolledPeople.length === 0 ? (
                                /* When no loved ones are enrolled, display friendly welcoming Add option */
                                <div 
                                    onClick={onEnroll}
                                    className="p-5 rounded-2xl bg-[#1f222a]/70 hover:bg-[#282c36] border-2 border-dashed border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-4 group text-center sm:text-left"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 text-2xl font-bold group-hover:scale-110 transition-transform">
                                        +
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-sans text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                                            Add Your First Loved One or Caregiver
                                        </h5>
                                        <p className="text-xs text-slate-400 mt-1">
                                            No faces saved yet. Tap here to add a photo and name so Neuron recognizes them and speaks with you about them.
                                        </p>
                                    </div>
                                    <span className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40 group-hover:bg-amber-500/30">
                                        + Add Person
                                    </span>
                                </div>
                            ) : (
                                /* Exactly max of 2 people displayed */
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {displayedPeople.map((person, idx) => {
                                        const initials = person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'LO';
                                        const imgSrc = getFaceImageSrc(person.image_base64 || person.avatar_url);

                                        return (
                                            <div 
                                                key={person.id || person.name || idx}
                                                onClick={() => handleSend(`Tell me about ${person.name}`)}
                                                className="p-3 rounded-xl bg-[#1f222a] hover:bg-[#282c36] border border-white/[0.06] hover:border-amber-400/40 transition-all cursor-pointer flex items-center gap-3 group"
                                            >
                                                {imgSrc ? (
                                                    <div className="relative w-11 h-11 shrink-0">
                                                        <img 
                                                            src={imgSrc} 
                                                            alt={person.name} 
                                                            className="w-11 h-11 rounded-lg object-cover border border-amber-500/30 group-hover:scale-105 transition-transform"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                if (e.currentTarget.nextElementSibling) {
                                                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                }
                                                            }}
                                                        />
                                                        <div 
                                                            style={{ display: 'none' }}
                                                            className="w-11 h-11 rounded-lg bg-amber-500/15 border border-amber-500/30 items-center justify-center text-amber-300 font-serif font-bold text-base"
                                                        >
                                                            {initials}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-11 h-11 shrink-0 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 font-serif font-bold text-base group-hover:scale-105 transition-transform">
                                                        {initials}
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <h5 className="font-sans text-xs font-semibold text-white truncate group-hover:text-amber-200 transition-colors">{person.name}</h5>
                                                    <p className="text-[11px] text-amber-400 truncate">{person.relation || "Family / Loved One"}</p>
                                                    {person.notes && <span className="text-[10px] text-slate-400 block truncate">{person.notes}</span>}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* When only 1 person is displayed, slot 2 is the "Add Another" card */}
                                    {displayedPeople.length === 1 && (
                                        <div 
                                            onClick={onEnroll}
                                            className="p-3 rounded-xl bg-[#1f222a]/50 hover:bg-[#282c36] border border-dashed border-white/[0.1] hover:border-amber-400/50 transition-all cursor-pointer flex items-center gap-3 group"
                                        >
                                            <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg font-bold group-hover:scale-105 transition-all">
                                                +
                                            </div>
                                            <div>
                                                <h5 className="font-sans text-xs font-medium text-slate-300 group-hover:text-white">Add Another</h5>
                                                <p className="text-[10px] text-slate-500">Add family or caregiver</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT COLUMN: TODAY'S GENTLE ANCHORS & COMPANION CHAT STREAM (5 cols) */}
                    <div className="xl:col-span-5 space-y-4 sm:space-y-6">

                        {/* TODAY'S GENTLE ANCHORS (DAILY ROUTINE CHECKLIST) */}
                        <div className="bg-[#181a20] p-3.5 sm:p-5 rounded-2xl border border-white/[0.06] shadow-md space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-amber-400" />
                                    <h3 className="font-serif text-sm font-semibold text-white">Today's Gentle Anchors</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] sm:text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                        {tasks.filter(t => t.completed).length} OF {tasks.length} COMPLETE
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingTask(!isAddingTask)}
                                        className="text-[10px] sm:text-[11px] font-mono flex items-center gap-1 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 transition-all cursor-pointer"
                                        title="Add a gentle scheduled anchor"
                                    >
                                        <Plus size={12} />
                                        <span>Anchor</span>
                                    </button>
                                </div>
                            </div>

                            {/* Quick Inline Task Creator */}
                            {isAddingTask && (
                                <form onSubmit={handleCreateTask} className="p-3 bg-[#1f222a] rounded-xl border border-amber-500/30 space-y-2.5 animate-fadeIn">
                                    <div className="text-[11px] font-mono text-amber-300 flex items-center justify-between">
                                        <span>NEW GENTLE ANCHOR</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsAddingTask(false)}
                                            className="text-slate-400 hover:text-white"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Task (e.g. Evening Lemon Tea)"
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-[#14161b] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                                            autoFocus
                                        />
                                        <input
                                            type="text"
                                            placeholder="Time (e.g. 20:00 / Bedtime)"
                                            value={newTaskTime}
                                            onChange={(e) => setNewTaskTime(e.target.value)}
                                            className="px-3 py-1.5 rounded-lg bg-[#14161b] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingTask(false)}
                                            className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:bg-white/[0.06] transition-colors cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!newTaskTitle.trim() || isSubmittingTask}
                                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            {isSubmittingTask ? "Adding..." : "Add Anchor"}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Dynamic Task List */}
                            <div className="space-y-2">
                                {tasks.length === 0 ? (
                                    <div className="p-4 text-center bg-[#1f222a]/50 rounded-xl border border-white/[0.04]">
                                        <p className="text-xs text-slate-400">No gentle anchors scheduled for today.</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Message Neuron to schedule tasks or click "+ Anchor".</p>
                                    </div>
                                ) : (
                                    tasks.map(task => {
                                        const isDone = Boolean(task.completed);
                                        return (
                                            <div 
                                                key={task.id}
                                                className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
                                                    isDone 
                                                        ? 'bg-[#1b1d24]/70 border-white/[0.03]' 
                                                        : 'bg-[#1f222a] border-l-4 border-amber-400 border-y border-r border-white/[0.06] shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleTask(task.id)}
                                                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                                            isDone 
                                                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                                                                : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-400/30'
                                                        }`}
                                                        title={isDone ? "Mark as pending" : "Mark as completed"}
                                                    >
                                                        {isDone ? <Check size={14} /> : <Clock size={13} />}
                                                    </button>
                                                    <div className="min-w-0 flex-1">
                                                        <span className={`text-xs block truncate ${
                                                            isDone 
                                                                ? 'font-medium text-slate-400 line-through opacity-75' 
                                                                : 'font-semibold text-white'
                                                        }`}>
                                                            {task.title}
                                                        </span>
                                                        <span className={`text-[10px] block truncate ${
                                                            isDone ? 'text-slate-500' : 'text-amber-300/80'
                                                        }`}>
                                                            {isDone 
                                                                ? (task.completed_at ? `Completed at ${task.completed_at}` : 'Completed') 
                                                                : (task.notes || 'Gentle Anchor')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
                                                    <span className={`text-[11px] sm:text-xs font-mono ${isDone ? 'text-slate-500' : 'font-semibold text-amber-400'}`}>
                                                        {task.time || "Today"}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteTask(task.id);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all rounded hover:bg-rose-500/10 cursor-pointer"
                                                        title="Remove anchor"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* COMPANION STREAM (THE SERENE CHAT WINDOW) */}
                        <div className="bg-[#181a20] rounded-2xl border border-white/[0.08] shadow-xl flex flex-col h-[460px] sm:h-[520px] md:h-[580px] overflow-hidden">
                            
                            {/* Stream Header */}
                            <div className="p-3 sm:p-4 bg-[#14161b] border-b border-white/[0.06] flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                    <div>
                                        <h4 className="font-serif font-semibold text-white text-xs sm:text-sm">Companion Stream</h4>
                                        <span className="font-mono text-[9px] sm:text-[10px] text-slate-400">WARM DIALOGUE • NO RUSH</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleSend("Hello Neuron")}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                                    title="Fresh greeting"
                                >
                                    <RotateCcw size={15} />
                                </button>
                            </div>

                            {/* Dialogue Messages Scroll Area */}
                            <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4">
                                <div className="flex justify-center my-1">
                                    <span className="font-mono text-[9px] sm:text-[10px] text-slate-500 bg-[#111318] px-3 py-1 rounded-full border border-white/[0.04]">
                                        TODAY • PEACEFUL CONVERSATION
                                    </span>
                                </div>

                                {messages.length === 0 && (
                                    <div className="space-y-3">
                                        <div className="flex flex-col items-start max-w-[95%] sm:max-w-[90%] space-y-1">
                                            <span className="font-sans text-[11px] text-amber-400/90 font-medium px-1">Neuron</span>
                                            <div className="bg-[#1f222a] border border-white/[0.06] text-slate-100 p-3 sm:p-4 rounded-2xl rounded-tl-sm text-xs sm:text-sm leading-relaxed shadow-sm">
                                                Welcome to your cognitive sanctuary. I am Neuron, your memory and routine companion. How can I assist you {greetingDetails.timeLabel}?
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, index) => {
                                    const isUser = msg.role === 'user' || msg.sender === 'user';
                                    return (
                                        <div 
                                            key={index}
                                            className={`flex flex-col space-y-1 ${isUser ? 'items-end self-end max-w-[90%] sm:max-w-[85%]' : 'items-start max-w-[95%] sm:max-w-[90%]'}`}
                                        >
                                            <span className={`font-sans text-[10px] sm:text-[11px] px-1 font-medium ${isUser ? 'text-amber-400 text-right' : 'text-slate-400'}`}>
                                                {isUser ? 'You' : 'Neuron'}
                                            </span>
                                            <div className={`p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm relative group ${
                                                isUser
                                                    ? 'bg-amber-500/20 text-amber-100 border border-amber-500/40 rounded-tr-sm shadow-[0_2px_12px_rgba(245,158,11,0.15)]'
                                                    : 'bg-[#1f222a] text-slate-100 border border-white/[0.06] rounded-tl-sm'
                                            }`}>
                                                {msg.text}

                                                {/* LOVED ONE / CAREGIVER VOICE RECORDING PLAYER */}
                                                {!isUser && msg.audioUrl && (
                                                    <div className="mt-3 p-2.5 sm:p-3 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/35 rounded-2xl flex items-center gap-2.5 sm:gap-3 text-left">
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePlayVoiceSample(msg.audioUrl, index)}
                                                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg transition-all cursor-pointer ${
                                                                playingMsgIndex === index
                                                                    ? 'bg-amber-400 text-slate-950 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                                                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 hover:scale-105'
                                                            }`}
                                                            title={playingMsgIndex === index ? "Pause voice sample" : "Listen to how they sound"}
                                                        >
                                                            {playingMsgIndex === index ? (
                                                                <Pause size={15} className="fill-slate-950 text-slate-950" />
                                                            ) : (
                                                                <Play size={15} className="ml-0.5 fill-slate-950 text-slate-950" />
                                                            )}
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 text-amber-300 font-mono text-[10px] sm:text-[11px] font-semibold">
                                                                <Volume2 size={13} className="text-amber-400" />
                                                                <span className="truncate">{playingMsgIndex === index ? "PLAYING..." : "HEAR VOICE SAMPLE"}</span>
                                                            </div>
                                                            {playingMsgIndex === index ? (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                                    <span className="w-1 h-4 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                                    <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                                    <span className="w-1 h-5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                                                                    <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '250ms' }} />
                                                                    <span className="text-[10px] text-amber-200/80 font-mono ml-2">Active</span>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                                                    Tap to hear voice recording
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* PERSON OR OBJECT PHOTO (PROTECTED AGAINST BROKEN IMAGES) */}
                                                {!isUser && msg.image && !msg.noDataFound && (
                                                    <div className="mt-3 overflow-hidden rounded-xl border border-amber-500/30 max-w-[200px] sm:max-w-[220px] shadow-md bg-black/40">
                                                        <img 
                                                            src={formatImageSrc(msg.image)} 
                                                            alt="Memory" 
                                                            onError={(e) => {
                                                                e.currentTarget.parentElement.style.display = 'none';
                                                            }}
                                                            className="w-full h-auto max-h-56 object-cover rounded-xl" 
                                                        />
                                                    </div>
                                                )}

                                                {/* CAREGIVER NOTIFICATION OPTION WHEN NO DATA FOUND */}
                                                {!isUser && msg.noDataFound && (
                                                    <div className="mt-3 p-3 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/35 rounded-2xl space-y-2 text-left">
                                                        <div className="flex items-center gap-2 text-amber-300 font-mono text-[10px] sm:text-[11px] font-semibold">
                                                            <Mail size={13} className="text-amber-400" />
                                                            <span>CAREGIVER EMAIL ALERT</span>
                                                        </div>
                                                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                                                            Neuron does not have recorded memories for this yet. Would you like to notify your caregivers via email so they can assist you?
                                                        </p>

                                                        {notifiedQueries[index] ? (
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-medium">
                                                                <CheckCircle2 size={14} className="text-emerald-400" />
                                                                <span>
                                                                    Caregivers notified via email ({notifiedQueries[index].emails?.join(', ') || `${notifiedQueries[index].count} caregiver(s)`})
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleNotifyCaregiver(msg.queryText, index)}
                                                                disabled={notifyingIndex === index}
                                                                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-sans text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                                            >
                                                                {notifyingIndex === index ? (
                                                                    <>
                                                                        <RefreshCw size={13} className="animate-spin" />
                                                                        <span>Sending Alert to Caregivers...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Mail size={13} />
                                                                        <span>Notify All Caregivers via Email</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {!isUser && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReadAloud(msg, index)}
                                                        className={`mt-2 flex items-center gap-1.5 text-xs transition-colors cursor-pointer px-2.5 py-1 rounded-lg border ${
                                                            speakingMsgIndex === index
                                                                ? 'bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                                                                : 'bg-white/[0.04] text-slate-400 hover:text-amber-300 hover:bg-white/[0.08] border-white/[0.06]'
                                                        }`}
                                                        title={speakingMsgIndex === index ? "Click to stop speaking" : "Listen aloud"}
                                                    >
                                                        <Volume2 size={13} className={speakingMsgIndex === index ? 'animate-pulse text-amber-300' : ''} />
                                                        <span className="text-[10px] sm:text-[11px] font-medium">
                                                            {speakingMsgIndex === index ? 'Speaking...' : 'Read Aloud'}
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {isTyping && (
                                    <div className="flex flex-col items-start max-w-[85%] space-y-1">
                                        <span className="font-sans text-[11px] text-amber-400 px-1 font-medium">Neuron</span>
                                        <div className="bg-[#1f222a] border border-white/[0.06] text-slate-300 p-2.5 sm:p-3 rounded-2xl rounded-tl-sm text-xs flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                            <span>{typingStatus || "Thinking gently..."}</span>
                                        </div>
                                    </div>
                                )}

                                <div ref={endRef} />
                            </div>

                            {/* Clean Bottom Input Container */}
                            <div className="p-2 sm:p-3.5 bg-[#14161b] border-t border-white/[0.06] space-y-2">
                                <form 
                                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                    className="flex items-center gap-1.5 sm:gap-2 relative"
                                >
                                    {/* Action Launcher Button with Hover & Click Popover (4 options: add/scan object or face) */}
                                    <div 
                                        ref={actionMenuRef}
                                        className="relative group/action shrink-0"
                                        onMouseEnter={handleActionMenuMouseEnter}
                                        onMouseLeave={handleActionMenuMouseLeave}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (actionMenuCloseTimerRef.current) {
                                                    clearTimeout(actionMenuCloseTimerRef.current);
                                                }
                                                setActionMenuOpen(prev => !prev);
                                            }}
                                            className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                                                actionMenuOpen
                                                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                                                    : 'bg-[#1c1f26] hover:bg-[#252932] text-slate-300 hover:text-amber-300 border-white/[0.08]'
                                            }`}
                                            title="Quick Actions (Add or Scan Face & Object)"
                                            aria-label="Add or Scan Face or Object"
                                        >
                                            <Plus size={18} className={`transition-transform duration-200 ${actionMenuOpen ? 'rotate-45 text-amber-400' : ''}`} />
                                        </button>

                                        {/* Popover wrapper touching the button directly with bottom-full and pb-2.5 so mouse never leaves container */}
                                        <div 
                                            className={`absolute bottom-full left-0 pb-2.5 z-50 transition-all duration-200 origin-bottom-left ${
                                                actionMenuOpen 
                                                    ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' 
                                                    : 'opacity-0 scale-95 pointer-events-none translate-y-2'
                                            }`}
                                        >
                                            <div className="w-[calc(100vw-36px)] max-w-[280px] sm:max-w-xs sm:w-72 p-2 sm:p-2.5 bg-[#181a20]/98 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_20px_rgba(245,158,11,0.15)]">
                                                <div className="px-2 py-1 border-b border-white/[0.06] mb-1.5 flex items-center justify-between">
                                                    <span className="font-mono text-[9px] sm:text-[10px] tracking-wider text-amber-400 font-semibold uppercase">Memory &amp; Vision</span>
                                                    <span className="text-[9px] font-mono text-slate-400 bg-white/[0.05] px-1.5 py-0.5 rounded">4 Options</span>
                                                </div>

                                                <div className="space-y-1">
                                                    {/* Option 1: Scan Face */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActionMenuOpen(false);
                                                            setCameraMode('person');
                                                            setShowCamera(true);
                                                            if (onScanFace) onScanFace();
                                                        }}
                                                        className="w-full flex items-center gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-xl hover:bg-white/[0.06] text-left transition-all group/item cursor-pointer"
                                                    >
                                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0 group-hover/item:scale-105 group-hover/item:bg-amber-400/25 transition-all">
                                                            <ScanFace size={15} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-semibold text-slate-200 group-hover/item:text-amber-300 transition-colors">Scan Face</div>
                                                            <div className="text-[10px] text-slate-400 truncate">Recognize a person in front of you</div>
                                                        </div>
                                                    </button>

                                                    {/* Option 2: Scan Object */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActionMenuOpen(false);
                                                            setCameraMode('object');
                                                            setShowCamera(true);
                                                            if (onScanObject) onScanObject();
                                                        }}
                                                        className="w-full flex items-center gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-xl hover:bg-white/[0.06] text-left transition-all group/item cursor-pointer"
                                                    >
                                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover/item:scale-105 group-hover/item:bg-cyan-400/25 transition-all">
                                                            <Scan size={15} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-semibold text-slate-200 group-hover/item:text-cyan-300 transition-colors">Scan Object</div>
                                                            <div className="text-[10px] text-slate-400 truncate">Identify or locate everyday items</div>
                                                        </div>
                                                    </button>

                                                    {/* Option 3: Add Face */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActionMenuOpen(false);
                                                            if (onEnroll) onEnroll();
                                                        }}
                                                        className="w-full flex items-center gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-xl hover:bg-white/[0.06] text-left transition-all group/item cursor-pointer"
                                                    >
                                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-400/15 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover/item:scale-105 group-hover/item:bg-emerald-400/25 transition-all">
                                                            <UserPlus size={15} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-semibold text-slate-200 group-hover/item:text-emerald-300 transition-colors">Add Face / Person</div>
                                                            <div className="text-[10px] text-slate-400 truncate">Enroll loved one with photo</div>
                                                        </div>
                                                    </button>

                                                    {/* Option 4: Add Object */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setActionMenuOpen(false);
                                                            if (onEnrollObject) onEnrollObject();
                                                        }}
                                                        className="w-full flex items-center gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-xl hover:bg-white/[0.06] text-left transition-all group/item cursor-pointer"
                                                    >
                                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-400/15 border border-purple-400/30 text-purple-400 flex items-center justify-center shrink-0 group-hover/item:scale-105 group-hover/item:bg-purple-400/25 transition-all">
                                                            <PackagePlus size={15} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-semibold text-slate-200 group-hover/item:text-purple-300 transition-colors">Add Object</div>
                                                            <div className="text-[10px] text-slate-400 truncate">Remember everyday object &amp; notes</div>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <input 
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type or speak a gentle thought..."
                                        className="flex-1 min-w-0 bg-[#1c1f26] border border-white/[0.08] focus:border-amber-400/50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all font-sans"
                                    />

                                    {/* Mic Trigger */}
                                    <button
                                        type="button"
                                        onClick={toggleSpeechRecognition}
                                        className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                            isListening
                                                ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                                                : 'bg-[#1c1f26] hover:bg-[#252932] text-slate-300 hover:text-amber-300 border border-white/[0.08]'
                                        }`}
                                        title="Speak voice message"
                                    >
                                        <Mic size={17} />
                                    </button>

                                    {/* Send Arrow Button */}
                                    <button
                                        type="submit"
                                        disabled={!input.trim()}
                                        className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
                                        title="Send message"
                                    >
                                        <Send size={15} />
                                    </button>
                                </form>

                                <div className="flex items-center justify-between px-1 text-[10px] sm:text-[11px] text-slate-500 font-sans">
                                    <span className="truncate">Voice clarity active • Gentle no-rush pacing</span>
                                    <span className="shrink-0">Ready</span>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

            </div>

            {/* Manage Displayed Faces Modal (Max 2 Faces) */}
            {showFaceManager && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
                    <div className="relative w-full max-w-md bg-[#16181e] rounded-2xl border border-amber-500/30 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                                    <SlidersHorizontal size={17} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white font-serif">Manage Displayed Faces</h3>
                                    <p className="text-[11px] text-slate-400">Choose up to 2 familiar faces to showcase</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFaceManager(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-center justify-between font-mono">
                            <span>Selected: {tempSelectedFaces.length} / 2</span>
                            <span>{tempSelectedFaces.length === 2 ? '✓ 2 Selected' : 'Choose up to 2'}</span>
                        </div>

                        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                            {enrolledPeople.map(p => {
                                const isSelected = tempSelectedFaces.includes(p.name);
                                const imgSrc = getFaceImageSrc(p.image_base64 || p.avatar_url);
                                const initials = p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'LO';

                                return (
                                    <div
                                        key={p.id || p.name}
                                        onClick={() => {
                                            if (isSelected) {
                                                setTempSelectedFaces(prev => prev.filter(n => n !== p.name));
                                            } else {
                                                if (tempSelectedFaces.length >= 2) {
                                                    // Replace earliest selected with new one
                                                    setTempSelectedFaces(prev => [prev[1], p.name]);
                                                } else {
                                                    setTempSelectedFaces(prev => [...prev, p.name]);
                                                }
                                            }
                                        }}
                                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                                            isSelected
                                                ? 'bg-amber-500/15 border-amber-400/60 shadow-sm'
                                                : 'bg-[#1f222a] border-white/[0.06] hover:bg-[#252932]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative w-10 h-10 shrink-0">
                                                {imgSrc ? (
                                                    <img 
                                                        src={imgSrc} 
                                                        alt={p.name} 
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            if (e.currentTarget.nextElementSibling) {
                                                                e.currentTarget.nextElementSibling.style.display = 'flex';
                                                            }
                                                        }}
                                                        className="w-10 h-10 rounded-lg object-cover border border-amber-500/30 shrink-0" 
                                                    />
                                                ) : null}
                                                <div 
                                                    style={{ display: imgSrc ? 'none' : 'flex' }}
                                                    className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 items-center justify-center text-amber-300 font-serif font-bold text-xs"
                                                >
                                                    {initials}
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                                                <div className="text-[11px] text-amber-400/90 truncate">{p.relation || 'Loved One'}</div>
                                                {p.notes && <div className="text-[10px] text-slate-400 truncate">{p.notes}</div>}
                                            </div>
                                        </div>

                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                            isSelected
                                                ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                                                : 'border-white/20 bg-white/5 text-transparent'
                                        }`}>
                                            <Check size={13} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                            <button
                                type="button"
                                onClick={() => {
                                    setManagedFaceNames([]);
                                    try { localStorage.removeItem('neuron_displayed_faces'); } catch(e) {}
                                    setShowFaceManager(false);
                                }}
                                className="text-xs text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                            >
                                Auto (Show Newest)
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowFaceManager(false)}
                                    className="px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setManagedFaceNames(tempSelectedFaces);
                                        try { localStorage.setItem('neuron_displayed_faces', JSON.stringify(tempSelectedFaces)); } catch(e) {}
                                        setShowFaceManager(false);
                                    }}
                                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-md transition-all cursor-pointer"
                                >
                                    Apply Selection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Camera Overlay Modal (Shown cleanly when scanning is requested) */}
            {showCamera && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="relative w-full max-w-2xl bg-[#16181e] rounded-2xl border border-amber-500/30 p-5 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                                <h3 className="text-sm font-semibold font-serif text-white uppercase tracking-wider">
                                    {cameraMode === 'object' ? 'Scan & Find Object' : 'Scan & Recognize Person'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowCamera(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <CameraView
                            isActive={true}
                            buttonLabel={cameraMode === 'object' ? "ACQUIRE OBJECT SNAP" : "ACQUIRE PERSON SNAP"}
                            isProcessing={isTyping}
                            onCapture={(imageSrc) => {
                                onCapture(imageSrc, cameraMode);
                                setShowCamera(false);
                            }}
                            onClose={() => setShowCamera(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
