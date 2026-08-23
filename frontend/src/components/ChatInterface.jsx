import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, User, Package, UserPlus, PackagePlus, Sparkles, Camera, X, Mic, MicOff, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CameraView from './CameraView';

function ChatInterface({
    messages,
    currentPerson = null,
    onSendMessage,
    suggestions = [],
    onSuggestionClick,
    onPlayAudio,
    onCapture,
    onScanFace,
    onScanObject,
    onEnroll,
    onEnrollObject,
    isTyping,
    typingStatus,
    captureTrigger,
    enrollType
}) {
    const [input, setInput] = useState("");
    const [showCamera, setShowCamera] = useState(false);
    const [cameraMode, setCameraMode] = useState('person');
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [showPersonCard, setShowPersonCard] = useState(false);
    
    // Wake Word & Speech-to-Text State
    const [isMicEnabled, setIsMicEnabled] = useState(true); // Master toggle
    const [isListening, setIsListening] = useState(false); // Browser recognition running
    const [isAwake, setIsAwake] = useState(false); // Wake word triggered & capturing command
    const [isRecordingAudio, setIsRecordingAudio] = useState(false); // Direct Whisper recording active
    const [speechStatus, setSpeechStatus] = useState("Listening for \"Hey Neuron\" or tap 🎙️");

    const endRef = useRef(null);
    const containerRef = useRef(null);
    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const isAwakeRef = useRef(false);
    const inputRef = useRef("");
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const vadIntervalRef = useRef(null);

    // Keep inputRef in sync with state
    useEffect(() => {
        inputRef.current = input;
    }, [input]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping, showCamera]);

    // Handle External Capture Trigger (e.g. Enrollment)
    useEffect(() => {
        if (captureTrigger && captureTrigger > 0) {
            setCameraMode(enrollType || 'person');
            setShowCamera(true);
        }
    }, [captureTrigger, enrollType]);

    const lastSentRef = useRef({ text: '', time: 0 });

    const safeSendMessage = (rawText) => {
        const trimmed = (rawText || "").trim();
        if (!trimmed || trimmed.length < 2) return;
        const now = Date.now();
        // Prevent duplicate send of identical text within 3.5 seconds
        if (trimmed.toLowerCase() === lastSentRef.current.text.toLowerCase() && (now - lastSentRef.current.time < 3500)) {
            return;
        }
        lastSentRef.current = { text: trimmed, time: now };
        setInput("");
        inputRef.current = "";
        onSendMessage(trimmed);
    };

    // Initialize Web Speech Recognition with Wake Word Engine
    const isListeningRef = useRef(false);
    const restartTimeoutRef = useRef(null);

    const startRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSpeechStatus("Tap 🎙️ to record voice");
            return;
        }

        if (recognitionRef.current && isListeningRef.current) {
            return;
        }

        try {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) {}
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                isListeningRef.current = true;
                setIsListening(true);
                if (!isAwakeRef.current && !isRecordingAudio) {
                    setSpeechStatus("Listening for \"Hey Neuron\" or tap 🎙️");
                }
            };

            recognition.onerror = (event) => {
                console.warn("Speech recognition error:", event.error);
                if (event.error === 'not-allowed') {
                    setIsListening(false);
                    isListeningRef.current = false;
                    setSpeechStatus("Tap 🎙️ to speak");
                }
            };

            recognition.onend = () => {
                isListeningRef.current = false;
                setIsListening(false);
                if (isMicEnabled && !isRecordingAudio && !isTyping) {
                    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
                    restartTimeoutRef.current = setTimeout(() => {
                        if (isMicEnabled && !isRecordingAudio && !isTyping) {
                            try {
                                recognition.start();
                            } catch (e) {}
                        }
                    }, 400);
                }
            };

            recognition.onresult = (event) => {
                if (isTyping || (window.speechSynthesis && window.speechSynthesis.speaking) || isRecordingAudio) {
                    return;
                }

                let currentChunk = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    currentChunk += event.results[i][0].transcript;
                }

                const spokenText = currentChunk.trim();
                const lowerSpoken = spokenText.toLowerCase();

                const wakePatterns = [
                    "hey neuron",
                    "hello neuron",
                    "hi neuron",
                    "okay neuron",
                    "ok neuron",
                    "hey newron",
                    "hey nerom",
                    "neuron"
                ];

                // Check wake word if not awake
                if (!isAwakeRef.current) {
                    for (const pattern of wakePatterns) {
                        const idx = lowerSpoken.indexOf(pattern);
                        if (idx !== -1) {
                            isAwakeRef.current = true;
                            setIsAwake(true);
                            setSpeechStatus("🟢 'Hey Neuron' heard! Listening...");
                            break;
                        }
                    }
                }

                // If awake, capture the command
                if (isAwakeRef.current) {
                    let cleanCommand = spokenText;
                    for (const pattern of wakePatterns) {
                        const re = new RegExp(`^.*?${pattern}\\s*[,:]?\\s*`, 'i');
                        if (re.test(cleanCommand)) {
                            cleanCommand = cleanCommand.replace(re, '');
                        }
                    }

                    if (cleanCommand.trim()) {
                        setInput(cleanCommand);
                        setSpeechStatus(`🗣️ "${cleanCommand}"`);
                    }

                    if (silenceTimerRef.current) {
                        clearTimeout(silenceTimerRef.current);
                    }

                    silenceTimerRef.current = setTimeout(() => {
                        const textToSend = inputRef.current.trim() || cleanCommand.trim();
                        isAwakeRef.current = false;
                        setIsAwake(false);
                        
                        // Abort current recognition instance to clear internal buffers
                        try { recognition.abort(); } catch (e) {}

                        if (textToSend && textToSend.length > 1) {
                            setSpeechStatus("🚀 Sending...");
                            safeSendMessage(textToSend);
                        }
                        setSpeechStatus("Listening for \"Hey Neuron\" or tap 🎙️");
                    }, 1400);
                }
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error("Error starting SpeechRecognition:", err);
        }
    };

    useEffect(() => {
        if (isMicEnabled) {
            startRecognition();
        } else {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) {}
            }
            if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
            isListeningRef.current = false;
            setIsListening(false);
            setSpeechStatus("Mic muted");
        }

        return () => {
            if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) {}
            }
            stopMediaRecording();
        };
    }, [isMicEnabled]);

    // Direct Whisper Voice Recording (100% Reliable Cross-Browser)
    const startMediaRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
            audioChunksRef.current = [];

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                setIsRecordingAudio(false);
                setIsAwake(false);
                isAwakeRef.current = false;

                if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
                if (audioContextRef.current) {
                    try { audioContextRef.current.close(); } catch (e) {}
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (audioBlob.size > 1000) {
                    setSpeechStatus("⚡ Transcribing audio via Whisper...");
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'voice.webm');

                    try {
                        const res = await fetch("http://localhost:8000/api/v1/voice/transcribe", {
                            method: "POST",
                            body: formData
                        });
                        const data = await res.json();
                        let text = (data.text || "").trim();

                        if (text) {
                            // Strip any leading wake word
                            const wakePatterns = ["hey neuron", "hello neuron", "hi neuron", "okay neuron", "ok neuron", "neuron"];
                            for (const pattern of wakePatterns) {
                                const re = new RegExp(`^.*?${pattern}\\s*[,:]?\\s*`, 'i');
                                if (re.test(text)) {
                                    text = text.replace(re, '');
                                }
                            }
                            if (text) {
                                setSpeechStatus("🚀 Sending...");
                                safeSendMessage(text);
                            }
                        } else {
                            setSpeechStatus("No speech detected. Tap 🎙️ to try again.");
                        }
                    } catch (err) {
                        console.error("Whisper transcription error:", err);
                        setSpeechStatus("Failed to transcribe audio.");
                    }
                }

                // Resume background wake listener
                setTimeout(() => {
                    setSpeechStatus("Listening for \"Hey Neuron\" or tap 🎙️");
                    if (isMicEnabled) startRecognition();
                }, 1000);
            };

            mediaRecorder.start(250);
            setIsRecordingAudio(true);
            setIsAwake(true);
            isAwakeRef.current = true;
            setSpeechStatus("🔴 Listening... Speak now (tap 🎙️ or pause to send)");

            // Setup VAD (Voice Activity Detection) via Web Audio API to detect when user stops talking
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                audioContextRef.current = audioContext;
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                let speechDetected = false;
                let silenceStart = null;

                vadIntervalRef.current = setInterval(() => {
                    analyser.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / dataArray.length;

                    if (average > 18) {
                        // User is speaking
                        speechDetected = true;
                        silenceStart = null;
                    } else if (speechDetected) {
                        // User was speaking and is now silent
                        if (!silenceStart) {
                            silenceStart = Date.now();
                        } else if (Date.now() - silenceStart > 1500) {
                            // 1.5s of silence detected -> auto-stop and transcribe
                            clearInterval(vadIntervalRef.current);
                            stopMediaRecording();
                        }
                    }
                }, 100);
            } catch (e) {
                console.warn("VAD setup error:", e);
            }

        } catch (err) {
            console.error("Failed to start media recorder:", err);
            setSpeechStatus("Microphone access denied. Please allow microphone in browser.");
        }
    };

    const stopMediaRecording = () => {
        if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try { mediaRecorderRef.current.stop(); } catch (e) {}
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(t => t.stop());
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        isAwakeRef.current = false;
        setIsAwake(false);
        if (isRecordingAudio) stopMediaRecording();
        safeSendMessage(input);
        setSpeechStatus("Listening for \"Hey Neuron\" or tap 🎙️");
    };

    const triggerManualMic = () => {
        if (isRecordingAudio) {
            stopMediaRecording();
        } else {
            startMediaRecording();
        }
    };

    const handleCameraCapture = (blob) => {
        onCapture(blob);
        setShowCamera(false);
    };

    const openCamera = (mode) => {
        if (mode === 'person') onScanFace();
        else onScanObject();
        setCameraMode(mode);
        setShowCamera(true);
    };

    return (
        <div className="flex flex-col h-full bg-[#080d1a] border-l border-cyan-500/20 relative shadow-2xl cyber-grid-bg">
            {/* Cyber Header */}
            <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-[#060a12]/80 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                        <Sparkles size={16} className="animate-pulse" />
                    </div>
                    <div>
                        <h2 className="font-display font-bold text-slate-100 text-sm tracking-wider uppercase flex items-center gap-2">
                            <span>MEMORY CORTEX TERMINAL</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                        </h2>
                        <p className="font-mono text-[10px] text-cyan-400/70">VECTOR RETRIEVAL & CONVERSATION</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMicEnabled(!isMicEnabled)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-semibold transition-all flex items-center gap-1.5 border ${
                            isMicEnabled
                                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title={isMicEnabled ? "Mute Wake Word" : "Enable Wake Word"}
                    >
                        {isMicEnabled ? <Mic size={13} className="text-cyan-400 animate-pulse" /> : <MicOff size={13} />}
                        <span>{isMicEnabled ? "WAKE: ACTIVE" : "WAKE: MUTED"}</span>
                    </button>
                </div>
            </div>

            {/* Messages Stream Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-gradient-to-b from-[#080d1a] to-[#050811]" ref={containerRef}>
                {messages.length === 0 && !showCamera && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 my-auto">
                        <div className="p-5 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl animate-glow-pulse shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                            <Sparkles size={36} className="text-cyan-400" />
                        </div>
                        <div className="text-center font-mono">
                            <h2 className="text-base font-bold text-slate-200 uppercase tracking-wider">NEURAL TERMINAL READY</h2>
                            <p className="text-xs text-slate-400 mt-1">Speak "Hey Neuron" or issue a memory query</p>
                        </div>
                    </div>
                )}

                <AnimatePresence mode="popLayout">
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.25 }}
                            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Hologram Avatar Icon */}
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border ${
                                    msg.role === 'user'
                                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400/50 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                                        : 'bg-gradient-to-br from-cyan-600 to-emerald-600 border-cyan-400/50 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                                }`}>
                                    {msg.role === 'user' ? <User size={15} className="text-white" /> : <Sparkles size={15} className="text-white" />}
                                </div>

                                {/* Cyber Content Bubble */}
                                <div className={`flex flex-col space-y-2.5 p-4 rounded-2xl border backdrop-blur-md shadow-xl ${
                                    msg.role === 'user'
                                        ? 'bg-gradient-to-br from-indigo-950/80 to-purple-950/80 text-indigo-100 rounded-tr-none border-indigo-500/40 shadow-[0_4px_20px_rgba(99,102,241,0.2)]'
                                        : 'bg-[#0c1322]/90 text-slate-200 rounded-tl-none border-cyan-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                                }`}>
                                    <div className="flex items-center justify-between text-[10px] font-mono opacity-60 pb-1 border-b border-white/5">
                                        <span>{msg.role === 'user' ? '[USER.INPUT]' : '[CORTEX.RESPONSE]'}</span>
                                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-sans font-normal">{msg.text}</p>
                                    {msg.image && (
                                        <motion.img
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            src={msg.image.startsWith('data:') ? msg.image : `data:image/jpeg;base64,${msg.image}`}
                                            alt="Visual Memory"
                                            className="rounded-xl max-h-64 w-full object-contain border border-cyan-500/30 bg-black/50 shadow-inner"
                                        />
                                    )}
                                    {msg.gallery && msg.gallery.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto py-2 scroll-smooth no-scrollbar">
                                            {msg.gallery.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`}
                                                    className="w-16 h-16 rounded-lg object-cover border border-cyan-500/40 hover:border-cyan-300 hover:scale-105 transition-all cursor-pointer shadow-md"
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {msg.audioUrl && (
                                        <button
                                            onClick={() => onPlayAudio(msg.audioUrl)}
                                            className="flex items-center gap-2 bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 text-xs font-mono font-semibold px-3 py-2 rounded-xl w-fit transition-all border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                                        >
                                            <Volume2 size={14} className="text-cyan-400" />
                                            <span>PLAY VOCAL SAMPLE</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Inline Camera HUD */}
                    {showCamera && (
                        <motion.div
                            key="camera-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex justify-end w-full"
                        >
                            <div className="bg-[#0c1322] border border-cyan-500/40 p-3 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] relative w-full max-w-md tech-bracket">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-xs text-cyan-400 font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                                        <Camera size={14} />
                                        <span>OPTICAL SCAN // {cameraMode === 'object' ? 'OBJECT MODE' : 'FACIAL BIOMETRICS'}</span>
                                    </span>
                                    <button
                                        onClick={() => setShowCamera(false)}
                                        className="text-slate-400 hover:text-cyan-300 p-1 rounded-lg hover:bg-slate-800 transition"
                                        title="Close Camera"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="rounded-xl overflow-hidden bg-black relative">
                                    <CameraView
                                        isActive={true}
                                        onCapture={handleCameraCapture}
                                        trigger={captureTrigger}
                                        isProcessing={false}
                                        buttonLabel={`EXECUTE SCAN [${cameraMode === 'object' ? 'OBJECT' : 'FACE'}]`}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Thinking / Neural Encoding Telemetry */}
                    {isTyping && (
                        <motion.div
                            key="typing-indicator"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start w-full"
                        >
                            <div className="flex flex-row gap-3 items-center">
                                <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)] animate-pulse">
                                    <Sparkles size={15} className="text-cyan-400" />
                                </div>
                                <div className="bg-[#0c1322]/90 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 border border-cyan-500/30 shadow-lg font-mono">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                                    </div>
                                    <span className="text-xs font-semibold text-cyan-300 tracking-wider uppercase ml-1">
                                        {typingStatus || "CONSULTING NEURAL CORTEX..."}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={endRef} />
                </AnimatePresence>
            </div>

            {/* Input & Cyber Controls Dock */}
            <div className="p-4 md:p-5 bg-[#060a12]/95 border-t border-cyan-500/20 space-y-3 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                
                {/* Active Subject Identity Telemetry & Voice Status HUD */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-mono">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {isAwake ? (
                            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                        ) : isMicEnabled ? (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0"></span>
                        ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0"></span>
                        )}
                        <span className={`truncate ${isAwake ? 'text-emerald-300 font-bold' : 'text-slate-400'}`}>
                            {isMicEnabled ? speechStatus : "Voice recognition standby"}
                        </span>
                    </div>

                    {/* Who's The Person / Active Subject Hover Dossier Chip */}
                    {currentPerson && (
                        <div 
                            className="relative flex items-center"
                            onMouseEnter={() => setShowPersonCard(true)}
                            onMouseLeave={() => setShowPersonCard(false)}
                        >
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 hover:text-white hover:border-cyan-300 text-[11px] font-bold cursor-pointer transition-all shadow-[0_0_10px_rgba(0,240,255,0.25)]">
                                <User size={13} className="text-cyan-400 animate-pulse" />
                                <span>WHO'S THIS: {currentPerson.name?.toUpperCase()}</span>
                                <span className="text-[10px] text-cyan-400/80 font-normal">({currentPerson.relation || 'Subject'})</span>
                            </div>

                            {/* Holographic Person Identity Dossier Card */}
                            <AnimatePresence>
                                {showPersonCard && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute bottom-full right-0 mb-2 w-72 bg-[#0a101d] border-2 border-cyan-400/80 rounded-2xl p-4 shadow-[0_0_35px_rgba(0,240,255,0.35)] backdrop-blur-xl z-50 tech-bracket font-mono pointer-events-auto"
                                    >
                                        <div className="flex items-center justify-between pb-2 border-b border-cyan-500/30 mb-3">
                                            <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">
                                                [BIOMETRIC DOSSIER]
                                            </span>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                                                512-D SYNCED
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-400/60 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                                                {currentPerson.image ? (
                                                    <img src={`data:image/jpeg;base64,${currentPerson.image}`} alt={currentPerson.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={24} className="text-cyan-400" />
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="font-display font-bold text-sm text-white truncate">
                                                    {currentPerson.name}
                                                </h4>
                                                <p className="text-[11px] text-cyan-300 font-semibold">
                                                    {currentPerson.relation || 'Known Person'}
                                                </p>
                                                {currentPerson.age && (
                                                    <p className="text-[10px] text-slate-400">
                                                        Age: {currentPerson.age}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {currentPerson.notes && (
                                            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 mb-3 leading-relaxed">
                                                <span className="text-cyan-400 font-bold block text-[9px] mb-0.5">CONTEXT / MEMORY:</span>
                                                "{currentPerson.notes}"
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    onSendMessage(`Tell me more about ${currentPerson.name}`);
                                                    setShowPersonCard(false);
                                                }}
                                                className="flex-1 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 hover:text-white rounded-lg border border-cyan-500/40 text-[10px] font-bold tracking-wider transition cursor-pointer"
                                            >
                                                ASK DETAILS
                                            </button>
                                            <button
                                                onClick={() => {
                                                    openCamera('person');
                                                    setShowPersonCard(false);
                                                }}
                                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 text-[10px] font-bold transition cursor-pointer"
                                                title="Rescan face"
                                            >
                                                <Camera size={12} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Clean Unobstructed Suggestion Chips */}
                {suggestions.length > 0 && !showCamera && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 noscroll">
                        <span className="text-[10px] font-mono text-cyan-500/80 font-bold uppercase tracking-wider flex-shrink-0">
                            SUGGESTIONS:
                        </span>
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => onSuggestionClick(s)}
                                className="whitespace-nowrap px-3 py-1 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-100 text-xs font-mono rounded-lg border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-[0_0_8px_rgba(0,240,255,0.1)] cursor-pointer"
                            >
                                &gt; {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Quick Action Tools Toolbar (Placed directly with textbox, NO floating overlay blocking suggestions) */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <ActionButton icon={<User size={13} />} label="Scan Face" onClick={() => openCamera('person')} color="text-cyan-400 bg-cyan-950/30 hover:bg-cyan-900/50 border-cyan-500/30 hover:border-cyan-400" />
                    <ActionButton icon={<Package size={13} />} label="Scan Object" onClick={() => openCamera('object')} color="text-blue-400 bg-blue-950/30 hover:bg-blue-900/50 border-blue-500/30 hover:border-blue-400" />
                    <div className="w-px h-5 bg-slate-800"></div>
                    <ActionButton icon={<UserPlus size={13} />} label="Enroll Person" onClick={onEnroll} color="text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/50 border-emerald-500/30 hover:border-emerald-400" />
                    <ActionButton icon={<PackagePlus size={13} />} label="Enroll Item" onClick={onEnrollObject} color="text-amber-400 bg-amber-950/30 hover:bg-amber-900/50 border-amber-500/30 hover:border-amber-400" />
                </div>

                {/* Input Terminal Bar */}
                <div className="relative">
                    <div className={`flex items-center gap-2 rounded-2xl p-2 border transition-all shadow-inner ${
                        (isAwake || isRecordingAudio)
                            ? 'bg-red-950/40 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                            : 'bg-slate-900/70 border-slate-800 focus-within:border-cyan-500/60 focus-within:bg-slate-900 focus-within:shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                    }`}>
                        {/* Direct Voice Toggle Button */}
                        <button
                            type="button"
                            onClick={triggerManualMic}
                            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                                isRecordingAudio
                                    ? 'bg-red-600 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)] scale-105'
                                    : isAwake
                                    ? 'bg-emerald-600 text-white animate-pulse shadow-[0_0_20px_rgba(0,255,157,0.6)]'
                                    : 'text-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                            }`}
                            title={isRecordingAudio ? "Tap to finish recording" : "Direct Neural Voice Input"}
                        >
                            <Mic size={18} />
                        </button>

                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isRecordingAudio ? "[RECORDING VOCAL STREAM...]" : (isAwake ? "[LISTENING FOR COMMAND...]" : "Query memory cortex or say 'Hey Neuron'...")}
                            disabled={showCamera}
                            className="flex-1 bg-transparent text-slate-100 font-mono text-xs md:text-sm px-2 py-2 outline-none placeholder:text-slate-500 disabled:opacity-50"
                        />
                        
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() && !isRecordingAudio}
                            className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 px-1">
                    <span>WAKE TRIGGER: "HEY NEURON"</span>
                    <span>QDRANT // GROQ MULTIMODAL</span>
                </div>
            </div>
        </div>
    );
}

const ActionButton = ({ icon, onClick, color = "text-slate-400", label }) => (
    <button
        onClick={onClick}
        title={label}
        className={`px-2.5 py-1.5 rounded-lg transition-all font-mono text-xs flex items-center gap-1.5 cursor-pointer border ${color}`}
    >
        {icon}
        <span className="text-[10px] font-semibold">{label}</span>
    </button>
);

export default ChatInterface;
