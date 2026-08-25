import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Sparkles, AlertTriangle, ChevronRight, ChevronLeft, Volume2, VolumeX,
    Mic, MicOff, Camera, Eye, Clock, ShieldAlert, Check, Flame,
    ArrowRight, Activity, Zap, RefreshCw, CheckCircle, XCircle, Send, Radio, MessageSquare
} from 'lucide-react';

const PRESET_TASKS = [
    {
        id: 'tea',
        title: 'Making a Warm Cup of Tea',
        desc: 'Show tea bag, boil kettle, pour water, steep, and enjoy safely',
        query: 'How to make a warm cup of tea step by step',
        icon: '🫖',
        badge: '5 Mins • Kitchen'
    },
    {
        id: 'meds',
        title: 'Evening Medication Routine',
        desc: 'Verify pill bottle, prepare fresh water, take doses safely',
        query: 'Guide me through taking evening prescribed medication safely with water',
        icon: '💊',
        badge: '3 Mins • Health'
    },
    {
        id: 'toast',
        title: 'Making Breakfast Toast',
        desc: 'Show bread, operate toaster, check golden crust, apply spread',
        query: 'How to safely prepare breakfast toast with toaster and butter',
        icon: '🍞',
        badge: '4 Mins • Kitchen'
    },
    {
        id: 'soup',
        title: 'Making a Warm Bowl of Soup',
        desc: 'Verify soup can/pot, heat safely, stir, and serve in bowl',
        query: 'How to prepare a warm bowl of soup safely step by step',
        icon: '🥣',
        badge: '6 Mins • Cooking'
    }
];

export default function TaskGuideView({ apiBase = "http://localhost:8000/api/v1", onBackToPatient }) {
    const [activeSession, setActiveSession] = useState(null);
    const [customQuery, setCustomQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    // Multimodal & AI state
    const [isProcessingFrame, setIsProcessingFrame] = useState(false);
    const [currentPhase, setCurrentPhase] = useState('verify_ingredient'); // verify_ingredient | perform_action | verify_result
    const [ingredientStatus, setIngredientStatus] = useState(null); // 'yes' | 'no' | null
    const [ingredientDetectedName, setIngredientDetectedName] = useState('');
    const [detectedObjects, setDetectedObjects] = useState([]);
    const [warningAlert, setWarningAlert] = useState(null);
    const [feedbackBadge, setFeedbackBadge] = useState('Initializing Cortex...');
    const [spokenSubtitles, setSpokenSubtitles] = useState('');

    // Audio & Continuous Voice loop
    const [isVoiceCoachActive, setIsVoiceCoachActive] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [launcherTranscript, setLauncherTranscript] = useState('');
    const [manualQuestion, setManualQuestion] = useState('');

    // Conversation History Feed
    const [conversationLog, setConversationLog] = useState([]);
    const [activeRightTab, setActiveRightTab] = useState('checklist'); // 'checklist' | 'convo'

    // Step Timer
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const frameLoopRef = useRef(null);
    const timerRef = useRef(null);
    const speechRecRef = useRef(null);
    const isSpeakingRef = useRef(false);
    const isMicDesiredRef = useRef(false);
    const restartTimerRef = useRef(null);
    const lastSpokenMsgRef = useRef('');
    const silenceTimerRef = useRef(null);
    const activeSessionRef = useRef(null);
    const handleStartTaskRef = useRef(null);
    const captureAndAnalyzeFrameRef = useRef(null);
    const latestTranscriptRef = useRef('');

    useEffect(() => {
        activeSessionRef.current = activeSession;
    }, [activeSession]);

    // Speech Synthesis helper
    const speakAloud = (text, onFinished = null) => {
        if (!text || !('speechSynthesis' in window)) return;
        setSpokenSubtitles(text);
        lastSpokenMsgRef.current = text;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.92;
        utterance.pitch = 1.05;

        utterance.onstart = () => {
            isSpeakingRef.current = true;
            setIsSpeakingTTS(true);
            // Cancel any pending speech auto-send timer
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            // Temporarily abort recognition while coach is talking to prevent self-echo
            if (speechRecRef.current) {
                try { speechRecRef.current.abort(); } catch (e) {}
            }
        };

        const finishHandler = () => {
            isSpeakingRef.current = false;
            setIsSpeakingTTS(false);
            // Resume speech recognition if user wants mic active
            if (speechRecRef.current && isMicDesiredRef.current) {
                setTimeout(() => {
                    if (isMicDesiredRef.current && speechRecRef.current && !isSpeakingRef.current) {
                        try {
                            speechRecRef.current.start();
                            setIsListening(true);
                        } catch (e) {}
                    }
                }, 200);
            }
            if (onFinished) onFinished();
        };

        utterance.onend = finishHandler;
        utterance.onerror = finishHandler;

        window.speechSynthesis.speak(utterance);
    };

    // Continuous Speech Recognition initialization with Auto-Send on Silence
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';

            rec.onstart = () => {
                setIsListening(true);
            };

            rec.onresult = (event) => {
                // Ignore recognized speech if the bot is currently talking
                if (isSpeakingRef.current) return;

                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    transcript += event.results[i][0].transcript;
                }

                const trimmed = transcript.trim();
                if (!trimmed) return;

                latestTranscriptRef.current = trimmed;

                if (!activeSessionRef.current) {
                    // On launcher screen
                    setCustomQuery(trimmed);
                    setLauncherTranscript(trimmed);
                } else {
                    // On active task HUD
                    setLiveTranscript(trimmed);
                }

                // Reset and schedule auto-send on silence (when user stops speaking)
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

                const lastResult = event.results[event.results.length - 1];
                // If browser reports final result, use shorter 600ms pause, else 1100ms pause
                const silenceDelay = lastResult.isFinal ? 600 : 1100;

                silenceTimerRef.current = setTimeout(() => {
                    const textToSend = latestTranscriptRef.current.trim();
                    if (!textToSend || isSpeakingRef.current) return;

                    if (!activeSessionRef.current) {
                        // AUTO-SEND ON LAUNCHER: Automatically start task guidance
                        if (handleStartTaskRef.current) {
                            handleStartTaskRef.current(textToSend);
                        }
                        setLauncherTranscript('');
                        latestTranscriptRef.current = '';
                    } else {
                        // AUTO-SEND ON TASK HUD: Automatically send question & inspect frame
                        if (captureAndAnalyzeFrameRef.current) {
                            captureAndAnalyzeFrameRef.current(textToSend);
                        }
                        setLiveTranscript('');
                        latestTranscriptRef.current = '';
                    }
                }, silenceDelay);
            };

            rec.onerror = (err) => {
                if (err.error === 'no-speech' || err.error === 'aborted') {
                    return;
                }
                console.warn('Speech recognition warning:', err.error);
                if (err.error === 'not-allowed') {
                    isMicDesiredRef.current = false;
                    setIsListening(false);
                    setErrorMsg('Microphone access blocked. Please enable microphone permissions in your browser.');
                }
            };

            rec.onend = () => {
                // If a final utterance was buffered, trigger it before restarting
                if (latestTranscriptRef.current.trim() && !isSpeakingRef.current) {
                    const textToSend = latestTranscriptRef.current.trim();
                    if (!activeSessionRef.current && handleStartTaskRef.current) {
                        handleStartTaskRef.current(textToSend);
                    } else if (activeSessionRef.current && captureAndAnalyzeFrameRef.current) {
                        captureAndAnalyzeFrameRef.current(textToSend);
                        setLiveTranscript('');
                    }
                    latestTranscriptRef.current = '';
                }

                if (isMicDesiredRef.current && !isSpeakingRef.current) {
                    setIsListening(true);
                    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
                    restartTimerRef.current = setTimeout(() => {
                        if (isMicDesiredRef.current && speechRecRef.current && !isSpeakingRef.current) {
                            try {
                                speechRecRef.current.start();
                                setIsListening(true);
                            } catch (e) {}
                        }
                    }, 100);
                } else {
                    setIsListening(false);
                }
            };

            speechRecRef.current = rec;
        }

        return () => {
            stopCamera();
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (frameLoopRef.current) clearInterval(frameLoopRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
            if (speechRecRef.current) {
                try { speechRecRef.current.stop(); } catch (e) {}
            }
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        };
    }, [isVoiceCoachActive]);

    // Start/Stop Camera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setErrorMsg('Camera access needed to verify items.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    // Step Timer
    useEffect(() => {
        if (activeSession && activeSession.status === 'in_progress') {
            timerRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeSession]);

    // Continuous Frame Analyzer Loop (runs every 3 seconds)
    useEffect(() => {
        if (activeSession && activeSession.status === 'in_progress') {
            frameLoopRef.current = setInterval(() => {
                if (!isProcessingFrame && !isSpeakingRef.current) {
                    captureAndAnalyzeFrame('');
                }
            }, 2800);
        } else {
            if (frameLoopRef.current) clearInterval(frameLoopRef.current);
        }
        return () => {
            if (frameLoopRef.current) clearInterval(frameLoopRef.current);
        };
    }, [activeSession, isProcessingFrame, elapsedSeconds, currentPhase]);

    // Start Task Session
    const handleStartTask = async (queryText) => {
        const query = (queryText || customQuery).trim();
        if (!query) return;

        setIsLoading(true);
        setErrorMsg(null);
        setIngredientStatus(null);
        setIngredientDetectedName('');
        setDetectedObjects([]);
        setWarningAlert(null);
        setElapsedSeconds(0);
        setCurrentPhase('verify_ingredient');
        isMicDesiredRef.current = true;
        setIsListening(true);

        try {
            const res = await axios.post(`${apiBase}/task/start`, { query });
            const session = res.data.session;
            setActiveSession(session);

            await startCamera();

            // Start Speech Recognition
            if (speechRecRef.current) {
                try { speechRecRef.current.start(); } catch (e) {}
            }

            // Speak initial guidance
            const firstStep = session.steps && session.steps[0];
            const initialNarration = firstStep
                ? (firstStep.narration || firstStep.verify_prompt || `First, please show me your ${firstStep.expected_item} so I can verify it.`)
                : `Starting ${session.task_title}.`;

            speakAloud(initialNarration);
        } catch (err) {
            console.error('Error starting task:', err);
            setErrorMsg('Failed to initialize task guide.');
        } finally {
            setIsLoading(false);
        }
    };
    handleStartTaskRef.current = handleStartTask;

    // Capture & Send Live Frame to Backend
    const captureAndAnalyzeFrame = async (userSpeech = '') => {
        if (!activeSession || isProcessingFrame || !videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        // Log user speech immediately for zero perceived latency
        if (userSpeech.trim()) {
            setConversationLog(prev => [
                ...prev,
                {
                    id: 'user-' + Date.now(),
                    sender: 'user',
                    text: userSpeech.trim(),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        }

        setIsProcessingFrame(true);

        try {
            const canvas = canvasRef.current;
            canvas.width = 640;
            canvas.height = 360;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageB64 = canvas.toDataURL('image/jpeg', 0.65);

            const res = await axios.post(`${apiBase}/task/live-frame`, {
                session_id: activeSession.session_id,
                image_b64: imageB64,
                speech_text: userSpeech,
                elapsed_seconds: elapsedSeconds
            });

            const data = res.data.data;

            if (data.detected_objects && data.detected_objects.length > 0) {
                setDetectedObjects(data.detected_objects);
            }

            // Update ingredient confirmation status
            if (data.ingredient_confirmed === true) {
                setIngredientStatus('yes');
            } else if (data.ingredient_confirmed === false) {
                setIngredientStatus('no');
            } else {
                setIngredientStatus(null);
            }

            if (data.ingredient_detected_name) {
                setIngredientDetectedName(data.ingredient_detected_name);
            }

            if (data.feedback_badge) {
                setFeedbackBadge(data.feedback_badge);
            }

            if (data.current_step_phase) {
                setCurrentPhase(data.current_step_phase);
            }

            // Warning Watchdog Alert
            if (data.warning_alert) {
                setWarningAlert(data.warning_alert);
                speakAloud(`Warning: ${data.warning_alert}`);
                setConversationLog(prev => [
                    ...prev,
                    {
                        id: 'alert-' + Date.now(),
                        sender: 'watchdog',
                        text: data.warning_alert,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        badge: 'SAFETY ALERT'
                    }
                ]);
            } else {
                setWarningAlert(null);
            }

            // If spoken advice provided and new
            if (data.spoken_response && data.spoken_response !== lastSpokenMsgRef.current && !data.warning_alert) {
                speakAloud(data.spoken_response);
                setConversationLog(prev => [
                    ...prev,
                    {
                        id: 'coach-' + Date.now(),
                        sender: 'coach',
                        text: data.spoken_response,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        badge: data.feedback_badge
                    }
                ]);
            }

            // If step advanced
            if (data.current_step_index !== activeSession.current_step_index) {
                setActiveSession(prev => ({
                    ...prev,
                    current_step_index: data.current_step_index,
                    status: data.status
                }));
                setElapsedSeconds(0);
                setIngredientStatus(null);
            } else if (data.status === 'completed' && activeSession.status !== 'completed') {
                setActiveSession(prev => ({ ...prev, status: 'completed' }));
                const doneMsg = `Great job! You have safely completed ${activeSession.task_title}.`;
                speakAloud(doneMsg);
                setConversationLog(prev => [
                    ...prev,
                    {
                        id: 'coach-done-' + Date.now(),
                        sender: 'coach',
                        text: doneMsg,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        badge: 'COMPLETED'
                    }
                ]);
            }
        } catch (err) {
            console.warn('Frame analysis cycle note:', err);
        } finally {
            setIsProcessingFrame(false);
        }
    };
    captureAndAnalyzeFrameRef.current = captureAndAnalyzeFrame;

    // Mic Toggle & Push-to-Talk Question Asking
    const handleToggleMic = () => {
        if (liveTranscript.trim()) {
            captureAndAnalyzeFrame(liveTranscript.trim());
            setLiveTranscript('');
            return;
        }

        if (isListening || isMicDesiredRef.current) {
            isMicDesiredRef.current = false;
            setIsListening(false);
            if (speechRecRef.current) {
                try { speechRecRef.current.stop(); } catch (e) {}
            }
        } else {
            isMicDesiredRef.current = true;
            setIsListening(true);
            if (speechRecRef.current) {
                try { speechRecRef.current.start(); } catch (e) {}
            }
        }
    };

    const handleSendQuestion = (e) => {
        if (e) e.preventDefault();
        const query = (manualQuestion || liveTranscript).trim();
        if (!query) return;
        captureAndAnalyzeFrame(query);
        setLiveTranscript('');
        setManualQuestion('');
    };

    // Manual Step Advancement / Navigation
    const handleSetStep = async (stepIdx, phase = 'verify_ingredient') => {
        if (!activeSession) return;
        try {
            const res = await axios.post(`${apiBase}/task/step`, {
                session_id: activeSession.session_id,
                step_index: stepIdx
            });
            const data = res.data.data;
            setActiveSession(prev => ({
                ...prev,
                current_step_index: data.current_step_index,
                status: data.status
            }));
            setElapsedSeconds(0);
            setIngredientStatus(null);
            setCurrentPhase(phase);

            const curr = activeSession.steps[data.current_step_index];
            if (curr) {
                const prompt = curr.narration || curr.verify_prompt || curr.action_instruction;
                speakAloud(prompt);
                setConversationLog(prev => [
                    ...prev,
                    {
                        id: 'step-nav-' + Date.now(),
                        sender: 'coach',
                        text: `Step ${data.current_step_index + 1}: ${curr.title}. ${prompt}`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        badge: `Step ${data.current_step_index + 1}`
                    }
                ]);
            }
        } catch (err) {
            console.error('Error changing step:', err);
        }
    };

    // End Session
    const handleEndSession = async () => {
        isMicDesiredRef.current = false;
        setIsListening(false);
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (activeSession) {
            try {
                await axios.post(`${apiBase}/task/end`, { session_id: activeSession.session_id });
            } catch (e) {}
        }
        stopCamera();
        if (speechRecRef.current) {
            try { speechRecRef.current.stop(); } catch (e) {}
        }
        window.speechSynthesis.cancel();
        setActiveSession(null);
    };

    const currentStep = activeSession && activeSession.steps
        ? activeSession.steps[activeSession.current_step_index]
        : null;

    const progressPercent = activeSession && activeSession.total_steps > 0
        ? Math.round(((activeSession.current_step_index + (activeSession.status === 'completed' ? 1 : 0)) / activeSession.total_steps) * 100)
        : 0;

    return (
        <div className="w-full h-full flex flex-col bg-[#060a12] text-slate-100 overflow-hidden font-sans select-none">
            <canvas ref={canvasRef} className="hidden" />

            {/* TOP HEADER */}
            <div className="px-6 py-3 bg-[#0a0f1d]/90 border-b border-cyan-500/20 backdrop-blur-md flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.25)]">
                        <Sparkles size={18} className="text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-mono text-sm font-bold tracking-wider text-cyan-300 uppercase">
                                NEURON LIVE COGNITIVE TASK COACH
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                                CONTINUOUS MULTIMODAL VOICE
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">Real-time object recognition, ingredient verification & voice-guided assistance</p>
                    </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2.5">
                    {/* Continuous Voice Indicator / Clickable Toggle */}
                    <button
                        onClick={handleToggleMic}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSpeakingTTS
                                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 animate-pulse'
                                : isListening
                                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                                : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                        title="Click to toggle microphone / ask question"
                    >
                        {isSpeakingTTS ? (
                            <Volume2 size={15} className="text-emerald-400" />
                        ) : isListening ? (
                            <Mic size={15} className="text-cyan-400 animate-pulse" />
                        ) : (
                            <MicOff size={15} className="text-slate-400" />
                        )}
                        <span>
                            {isSpeakingTTS
                                ? 'COACH SPEAKING...'
                                : isListening
                                ? 'MIC ACTIVE • LISTENING'
                                : 'MIC PAUSED (CLICK TO START)'}
                        </span>
                    </button>

                    {activeSession && (
                        <button
                            onClick={handleEndSession}
                            className="px-3.5 py-1.5 rounded-lg border border-red-500/40 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-mono font-bold tracking-wider transition-all cursor-pointer"
                        >
                            END TASK
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {!activeSession ? (
                    /* TASK LAUNCHER SCREEN */
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1427] via-[#091124] to-[#060a12] border border-cyan-500/30 p-6 md:p-8 shadow-[0_0_35px_rgba(0,240,255,0.08)]">
                            <div className="relative z-10 max-w-2xl">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono mb-3">
                                    <Activity size={12} className="text-cyan-400 animate-spin" />
                                    <span>VOICE-FIRST MULTIMODAL ASSISTANT</span>
                                </div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-purple-300">
                                    What activity would you like me to guide you through?
                                </h1>
                                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                                    I will continuously speak aloud with you. Before each step, show me your ingredients or tools so I can verify them ("Yes, that's it!" or "No, that's not it"). Then I'll guide you through each action and check your results before moving on.
                                </p>
                            </div>

                            {/* Custom Task Input */}
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleStartTask(); }}
                                className="relative z-10 mt-6 flex items-center gap-2 bg-[#060a12]/80 border border-cyan-500/40 rounded-xl p-1.5 focus-within:border-cyan-400 focus-within:shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all"
                            >
                                <input
                                    type="text"
                                    value={customQuery}
                                    onChange={(e) => setCustomQuery(e.target.value)}
                                    placeholder="Speak your task into the mic or type here (e.g. 'let's make coffee')..."
                                    className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
                                />

                                {/* Voice Microphone Button */}
                                <button
                                    type="button"
                                    onClick={handleToggleMic}
                                    className={`px-3.5 py-2 rounded-lg border font-mono text-xs font-bold flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
                                        isListening
                                            ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.4)] animate-pulse'
                                            : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50'
                                    }`}
                                    title={isListening ? "Listening active - speak and it will auto-start" : "Click to speak your task by voice"}
                                >
                                    <Mic size={16} className={isListening ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'} />
                                    <span className="hidden sm:inline">
                                        {isListening ? 'LISTENING...' : 'MIC'}
                                    </span>
                                </button>

                                {/* Start Guidance Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading || !customQuery.trim()}
                                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.3)] flex-shrink-0"
                                >
                                    {isLoading ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            <span>INITIALIZING CORTEX...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>START GUIDANCE</span>
                                            <ArrowRight size={14} />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Voice Feedback Banner with Auto-Launch Indicator */}
                            {(isListening || launcherTranscript) && (
                                <div className="relative z-10 mt-3 p-3 rounded-xl bg-gradient-to-r from-[#061826] via-[#091f33] to-[#0a1826] border border-cyan-400/70 shadow-[0_0_20px_rgba(0,240,255,0.2)] flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                        <div className="flex items-center gap-1">
                                            <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                            <span className="w-1 h-4 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                            <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                        </div>
                                        <div className="text-xs font-mono truncate">
                                            <span className="text-cyan-400 font-bold mr-1">🎙️ VOICE CAPTURE:</span>
                                            <span className="text-slate-200">
                                                {launcherTranscript || customQuery ? `"${launcherTranscript || customQuery}"` : "Listening... Speak your task (auto-starts when you stop speaking)"}
                                            </span>
                                            {launcherTranscript && (
                                                <span className="ml-2 text-[10px] text-emerald-400 animate-pulse font-bold">
                                                    (Auto-starting...)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {customQuery.trim() && (
                                        <button
                                            type="button"
                                            onClick={() => handleStartTask(customQuery)}
                                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.4)] cursor-pointer flex-shrink-0"
                                        >
                                            <ArrowRight size={12} />
                                            <span>START NOW</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Quick Presets */}
                        <div>
                            <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Zap size={14} className="text-cyan-400" />
                                <span>POPULAR GUIDED ACTIVITIES</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {PRESET_TASKS.map((preset) => (
                                    <div
                                        key={preset.id}
                                        onClick={() => handleStartTask(preset.query)}
                                        className="group relative bg-[#0a1020]/70 hover:bg-[#0f172a] border border-cyan-500/20 hover:border-cyan-400/60 rounded-xl p-4 transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_rgba(0,240,255,0.15)] flex items-start gap-4"
                                    >
                                        <div className="text-3xl p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                                            {preset.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition-colors">
                                                    {preset.title}
                                                </h4>
                                                <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                                                    {preset.badge}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                                                {preset.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ACTIVE VOICE-FIRST MULTIMODAL HUD */
                    <div className="h-full flex flex-col lg:flex-row gap-5 max-w-7xl mx-auto">
                        
                        {/* LEFT COLUMN: LIVE OPTICAL CAMERA + DIRECT MIC/RE-SCAN CONTROLS */}
                        <div className="w-full lg:w-[48%] flex flex-col gap-3">
                            
                            {/* Camera Viewfinder */}
                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />

                                {/* Targeting Reticle */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-56 h-56 border border-cyan-400/40 rounded-2xl flex items-center justify-center">
                                        <div className="w-28 h-28 border border-cyan-300/60 rounded-xl flex items-center justify-center animate-pulse">
                                            <Eye size={28} className="text-cyan-400/70" />
                                        </div>
                                    </div>
                                    <div className="scan-line" />
                                </div>

                                {/* Top Left Status Tag */}
                                <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/40 font-mono text-[11px] text-cyan-300">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                    <span>EYE SENSOR ACTIVE</span>
                                    {isProcessingFrame && (
                                        <span className="text-[10px] text-cyan-300 animate-pulse font-semibold">
                                            • INSPECTING...
                                        </span>
                                    )}
                                </div>

                                {/* Top Right Step Phase Badge */}
                                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/40 font-mono text-[11px]">
                                    {currentPhase === 'verify_ingredient' && (
                                        <span className="text-amber-300 font-bold flex items-center gap-1">
                                            🔍 1. SHOW INGREDIENT
                                        </span>
                                    )}
                                    {currentPhase === 'perform_action' && (
                                        <span className="text-cyan-300 font-bold flex items-center gap-1">
                                            ⚡ 2. PERFORM STEP
                                        </span>
                                    )}
                                    {currentPhase === 'verify_result' && (
                                        <span className="text-emerald-300 font-bold flex items-center gap-1">
                                            ✓ 3. SHOW RESULT
                                        </span>
                                    )}
                                </div>

                                {/* INGREDIENT YES / NO RECOGNITION POPUP OVERLAY */}
                                {ingredientStatus === 'yes' && (
                                    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 px-4 py-1.5 rounded-full font-mono text-xs font-extrabold tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-pulse">
                                        <CheckCircle size={16} className="text-emerald-400" />
                                        <span>YES! {ingredientDetectedName || currentStep?.expected_item} VERIFIED</span>
                                    </div>
                                )}

                                {ingredientStatus === 'no' && (
                                    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-red-950/95 border-2 border-red-500 text-red-200 px-4 py-1.5 rounded-full font-mono text-xs font-extrabold tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-bounce">
                                        <XCircle size={16} className="text-red-400" />
                                        <span>NO: WRONG ITEM ({ingredientDetectedName || 'Not Expected Item'})</span>
                                    </div>
                                )}

                                {/* Bottom Live Detected Objects Chips */}
                                {detectedObjects.length > 0 && (
                                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 pointer-events-none">
                                        {detectedObjects.map((obj, i) => (
                                            <span
                                                key={i}
                                                className="bg-cyan-950/90 backdrop-blur-md text-cyan-300 border border-cyan-400/40 px-2.5 py-0.5 rounded-full text-[10px] font-mono shadow"
                                            >
                                                👁️ {obj}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Safety Hazard Warning */}
                            {warningAlert && (
                                <div className="p-3.5 rounded-xl bg-red-950/80 border-2 border-red-500 text-red-200 text-xs font-mono flex items-start gap-3 shadow-[0_0_25px_rgba(239,68,68,0.3)] animate-bounce">
                                    <ShieldAlert size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold uppercase tracking-wider text-red-300">
                                            [SAFETY WATCHDOG ALERT]
                                        </p>
                                        <p className="mt-0.5">{warningAlert}</p>
                                    </div>
                                </div>
                            )}

                            {/* LIVE SPOKEN SUBTITLES (WHAT THE AI COACH IS SAYING) */}
                            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0a1426] to-[#0d1b33] border-2 border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.15)] flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Volume2 size={16} className="text-cyan-300 animate-pulse" />
                                </div>
                                <div className="flex-1">
                                    <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-0.5">
                                        COACH'S LIVE VOICE ADVICE:
                                    </span>
                                    <p className="text-sm font-semibold text-white leading-relaxed">
                                        {spokenSubtitles || "Hold your item up to the camera..."}
                                    </p>
                                </div>
                            </div>

                            {/* LIVE SPEECH LISTENING & REAL-TIME TRANSCRIPT CARD */}
                            <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                                isListening || liveTranscript
                                    ? 'bg-gradient-to-r from-[#061826] via-[#091f33] to-[#0a1826] border-cyan-400/80 shadow-[0_0_25px_rgba(0,240,255,0.25)]'
                                    : 'bg-[#0a1020] border-cyan-500/30'
                            }`}>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${
                                            isListening ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'
                                        }`} />
                                        <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                                            <Radio size={14} className={isListening ? 'text-cyan-400 animate-pulse' : 'text-slate-500'} />
                                            <span>{isListening ? 'VOICE LISTENING ACTIVE' : 'VOICE CAPTURE'}</span>
                                        </span>
                                    </div>

                                    {/* Animated Waveform Visualizer */}
                                    {isListening && (
                                        <div className="flex items-center gap-1">
                                            <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                            <span className="w-1 h-5 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                            <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                            <span className="w-1 h-6 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                            <span className="w-1 h-3 bg-cyan-300 rounded-full animate-bounce" style={{ animationDelay: '0.25s' }} />
                                        </div>
                                    )}
                                </div>

                                {/* Spoken Words Display */}
                                <div className="min-h-[38px] flex items-center justify-between gap-2 bg-[#050b14] border border-cyan-500/20 rounded-xl px-3 py-2">
                                    <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                        <Mic size={15} className={`flex-shrink-0 ${isListening ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                                        <p className="text-xs font-medium text-slate-200 truncate">
                                            {liveTranscript ? (
                                                <span className="text-cyan-200 font-semibold">
                                                    "{liveTranscript}"
                                                    <span className="ml-2 text-[10px] text-emerald-400 animate-pulse font-mono font-bold">
                                                        (Auto-answering...)
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">
                                                    {isListening
                                                        ? 'Listening... Speak anytime (auto-answers when you pause)'
                                                        : 'Mic paused. Click "Ask Question (Mic)" to speak.'}
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {liveTranscript && (
                                        <button
                                            onClick={() => handleSendQuestion()}
                                            disabled={isProcessingFrame}
                                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.4)] cursor-pointer transition-all flex-shrink-0"
                                        >
                                            <Send size={12} />
                                            <span>SEND</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* DUAL ACTION BUTTONS: MIC & RE-SCAN */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* 1. DIRECT MIC / ASK BUTTON */}
                                <button
                                    onClick={handleToggleMic}
                                    className={`py-3 px-4 rounded-xl font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 border transition-all duration-300 cursor-pointer shadow-lg ${
                                        liveTranscript.trim()
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse'
                                            : isListening
                                            ? 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 border-cyan-300 text-white shadow-[0_0_20px_rgba(0,240,255,0.35)]'
                                            : 'bg-slate-900/90 hover:bg-slate-800 border-cyan-500/40 text-cyan-300 hover:text-white'
                                    }`}
                                >
                                    <Mic size={18} className={isListening ? 'text-cyan-200 animate-pulse' : 'text-cyan-400'} />
                                    <span>
                                        {liveTranscript.trim()
                                            ? 'SEND QUESTION ➔'
                                            : isListening
                                            ? 'MIC ACTIVE (SPEAK)'
                                            : 'ASK QUESTION (MIC)'}
                                    </span>
                                </button>

                                {/* 2. RE-SCAN CAMERA BUTTON */}
                                <button
                                    onClick={() => captureAndAnalyzeFrame('')}
                                    disabled={isProcessingFrame}
                                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#0b1b36] to-[#0c2447] hover:from-[#0e2245] hover:to-[#0f2d57] border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 hover:text-white font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.15)] disabled:opacity-50"
                                >
                                    <RefreshCw size={18} className={`text-cyan-400 ${isProcessingFrame ? 'animate-spin' : ''}`} />
                                    <span>{isProcessingFrame ? 'INSPECTING...' : 'RE-SCAN CAMERA'}</span>
                                </button>
                            </div>

                            {/* DIRECT TEXT QUESTION INPUT */}
                            <form
                                onSubmit={handleSendQuestion}
                                className="flex items-center gap-2 bg-[#0a1020]/90 border border-cyan-500/30 rounded-xl p-1.5 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all"
                            >
                                <input
                                    type="text"
                                    value={manualQuestion}
                                    onChange={(e) => setManualQuestion(e.target.value)}
                                    placeholder="Type a question directly (e.g. 'Is this mug clean?', 'What next?')..."
                                    className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
                                />
                                <button
                                    type="submit"
                                    disabled={!manualQuestion.trim() || isProcessingFrame}
                                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                                >
                                    <Send size={13} />
                                    <span>SEND</span>
                                </button>
                            </form>
                        </div>

                        {/* RIGHT COLUMN: STEP-BY-STEP CHECKLIST & LIVE CONVERSATION TABS */}
                        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                            
                            {/* Task Progress Header */}
                            <div className="bg-[#0a1020]/90 border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_25px_rgba(0,0,0,0.6)]">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30 uppercase">
                                            STEP {activeSession.current_step_index + 1} OF {activeSession.total_steps}
                                        </span>
                                        {activeSession.status === 'completed' && (
                                            <span className="font-mono text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                                                ✓ TASK COMPLETED
                                            </span>
                                        )}
                                    </div>

                                    {/* Progress */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                        <span className="font-mono text-xs text-slate-400">{progressPercent}%</span>
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-slate-100">
                                    {activeSession.task_title}
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    {activeSession.task_summary}
                                </p>
                            </div>

                            {/* TAB SELECTOR: CHECKLIST VS CONVERSATION LOG */}
                            <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-1">
                                <button
                                    onClick={() => setActiveRightTab('checklist')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold tracking-wider transition-all cursor-pointer border ${
                                        activeRightTab === 'checklist'
                                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    <span>📋 CHECKLIST ({activeSession.total_steps})</span>
                                </button>

                                <button
                                    onClick={() => setActiveRightTab('convo')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold tracking-wider transition-all cursor-pointer border ${
                                        activeRightTab === 'convo'
                                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    <MessageSquare size={14} className={activeRightTab === 'convo' ? 'text-emerald-400' : 'text-slate-400'} />
                                    <span>LIVE CONVERSATION ({conversationLog.length})</span>
                                </button>
                            </div>

                            {/* TAB 1: STEP CHECKLIST VIEW */}
                            {activeRightTab === 'checklist' ? (
                                <div className="space-y-4">
                                    {/* ACTIVE STEP CARD */}
                                    {currentStep && (
                                        <div className="bg-gradient-to-br from-cyan-950/40 via-[#0a1426] to-[#060a12] border-2 border-cyan-400/60 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,240,255,0.15)] relative overflow-hidden">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-cyan-500 text-black font-extrabold flex items-center justify-center text-base font-mono shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                                                        {activeSession.current_step_index + 1}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-cyan-200">
                                                            {currentStep.title}
                                                        </h3>
                                                        <p className="text-xs text-slate-300 mt-0.5">
                                                            Ingredient / Tool to show: <strong className="text-cyan-400 font-mono">{currentStep.expected_item}</strong>
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => speakAloud(currentStep.narration || currentStep.action_instruction)}
                                                    className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 cursor-pointer"
                                                    title="Repeat instruction"
                                                >
                                                    <Volume2 size={16} />
                                                </button>
                                            </div>

                                            {/* Action Instruction Box */}
                                            <div className="mt-4 p-4 rounded-xl bg-[#060a12]/80 border border-cyan-500/30 text-slate-100 font-medium text-sm leading-relaxed">
                                                <span className="font-mono text-xs text-cyan-400 block mb-1 font-bold">ACTION TO DO:</span>
                                                {currentStep.action_instruction || currentStep.instruction}
                                            </div>

                                            {/* Verification Prompts */}
                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                                                {currentStep.verify_prompt && (
                                                    <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 flex items-center gap-2">
                                                        <span>🔍 Before Step: {currentStep.verify_prompt}</span>
                                                    </div>
                                                )}
                                                {currentStep.result_check && (
                                                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                                                        <span>✓ After Step: {currentStep.result_check}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Step Navigation Controls */}
                                            <div className="mt-5 pt-4 border-t border-cyan-500/20 flex items-center justify-between">
                                                <button
                                                    onClick={() => handleSetStep(Math.max(0, activeSession.current_step_index - 1))}
                                                    disabled={activeSession.current_step_index === 0}
                                                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 font-mono text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all disabled:opacity-30 cursor-pointer"
                                                >
                                                    <ChevronLeft size={16} />
                                                    <span>PREVIOUS</span>
                                                </button>

                                                <button
                                                    onClick={() => handleSetStep(Math.min(activeSession.total_steps - 1, activeSession.current_step_index + 1))}
                                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono text-xs font-bold tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                                                >
                                                    <span>
                                                        {activeSession.current_step_index === activeSession.total_steps - 1
                                                            ? 'FINISH TASK'
                                                            : 'NEXT STEP'}
                                                    </span>
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* FULL STEP LIST */}
                                    <div className="bg-[#0a1020]/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                                        <h4 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                            ACTIVITY CHECKLIST ({activeSession.total_steps} STEPS)
                                        </h4>

                                        {activeSession.steps.map((st, idx) => {
                                            const isDone = idx < activeSession.current_step_index || activeSession.status === 'completed';
                                            const isCurrent = idx === activeSession.current_step_index && activeSession.status !== 'completed';

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleSetStep(idx)}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                                        isCurrent
                                                            ? 'bg-cyan-950/50 border-cyan-500/60 text-cyan-200'
                                                            : isDone
                                                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                                                            : 'bg-slate-900/30 border-slate-800/80 text-slate-400 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                                                            isCurrent
                                                                ? 'bg-cyan-500 text-black'
                                                                : isDone
                                                                ? 'bg-emerald-500/30 text-emerald-300'
                                                                : 'bg-slate-800 text-slate-400'
                                                        }`}>
                                                            {isDone ? '✓' : idx + 1}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-sm block">
                                                                {st.title}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 font-mono">
                                                                Required: {st.expected_item}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {st.duration_seconds > 0 && (
                                                        <span className="font-mono text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
                                                            {st.duration_seconds}s
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                /* TAB 2: LIVE CONVERSATION HISTORY LOG */
                                <div className="bg-[#0a1020]/90 border border-cyan-500/30 rounded-2xl p-4 flex flex-col gap-3 min-h-[450px]">
                                    <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare size={16} className="text-cyan-400" />
                                            <h4 className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">
                                                DIALOGUE & QUESTION LOG
                                            </h4>
                                        </div>
                                        <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                                            {conversationLog.length} exchanges
                                        </span>
                                    </div>

                                    {/* Scrollable Conversation Stream */}
                                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
                                        {conversationLog.length === 0 ? (
                                            <div className="text-center py-10 text-slate-500 font-mono text-xs">
                                                No questions asked yet. Speak or type below to start conversation!
                                            </div>
                                        ) : (
                                            conversationLog.map((msg) => {
                                                const isUser = msg.sender === 'user';
                                                const isAlert = msg.sender === 'watchdog';

                                                return (
                                                    <div
                                                        key={msg.id}
                                                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                                                    >
                                                        {/* Sender Name & Time */}
                                                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-slate-400">
                                                            <span>{isUser ? '👤 YOU' : isAlert ? '⚠️ WATCHDOG' : '🤖 AI COACH'}</span>
                                                            <span>•</span>
                                                            <span>{msg.time}</span>
                                                            {msg.badge && (
                                                                <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[9px]">
                                                                    {msg.badge}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Speech Bubble */}
                                                        <div
                                                            className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                                                                isUser
                                                                    ? 'bg-gradient-to-r from-cyan-900 to-blue-900 border border-cyan-400/50 text-white rounded-tr-none shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                                                                    : isAlert
                                                                    ? 'bg-red-950/80 border-2 border-red-500 text-red-200 rounded-tl-none shadow-[0_0_15px_rgba(239,68,68,0.3)] font-bold'
                                                                    : 'bg-[#0e192e] border border-cyan-500/30 text-slate-200 rounded-tl-none shadow'
                                                            }`}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="flex-1">{msg.text}</p>
                                                                {!isUser && !isAlert && (
                                                                    <button
                                                                        onClick={() => speakAloud(msg.text)}
                                                                        className="text-cyan-400 hover:text-cyan-200 p-1 rounded hover:bg-cyan-950 cursor-pointer"
                                                                        title="Play voice again"
                                                                    >
                                                                        <Volume2 size={13} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
