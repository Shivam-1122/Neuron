import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, Volume2, AlertCircle, Play, Pause, Check } from 'lucide-react';

// Pick the best supported MIME type for this browser
function getSupportedMimeType() {
    const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
    ];
    for (const type of types) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    return '';
}

export default function AudioRecorder({ onRecordingComplete }) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordSecs, setRecordSecs] = useState(0);
    const [volumeLevel, setVolumeLevel] = useState(0); // 0 to 100 for live mic meter
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const audioElRef = useRef(null);
    const timerRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animFrameRef = useRef(null);
    const streamRef = useRef(null);

    // Track recording seconds
    useEffect(() => {
        if (isRecording) {
            setRecordSecs(0);
            timerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    // Clean up Web Audio resources
    const cleanupAudioGraph = () => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setVolumeLevel(0);
    };

    useEffect(() => {
        return () => cleanupAudioGraph();
    }, []);

    const startRecording = async () => {
        try {
            setError(null);
            cleanupAudioGraph();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Initialize Web Audio Analyser for live VU volume meter
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const audioCtx = new AudioCtx();
                audioContextRef.current = audioCtx;
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyserRef.current = analyser;

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const updateMeter = () => {
                    if (!analyserRef.current) return;
                    analyserRef.current.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const avg = sum / dataArray.length;
                    // Scale to 0-100 percentage
                    const scaled = Math.min(100, Math.round((avg / 128) * 100));
                    setVolumeLevel(scaled);
                    animFrameRef.current = requestAnimationFrame(updateMeter);
                };
                updateMeter();
            } catch (graphErr) {
                console.warn("Audio meter note:", graphErr);
            }

            const mimeType = getSupportedMimeType();
            const options = mimeType ? { mimeType } : {};
            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const usedMime = mimeType || 'audio/webm';
                const blob = new Blob(chunksRef.current, { type: usedMime });
                cleanupAudioGraph();

                if (blob.size < 500) {
                    setError("Voice note was too short or empty. Please speak into your microphone and try again.");
                    setAudioBlob(null);
                    setAudioUrl(null);
                    if (onRecordingComplete) onRecordingComplete(null);
                    return;
                }

                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                if (onRecordingComplete) onRecordingComplete(blob);
            };

            recorder.start(100); // collect chunks every 100ms
            setIsRecording(true);
        } catch (err) {
            console.error('Mic access error:', err);
            setError("Microphone permission denied or device unavailable. Please allow microphone access.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.requestData();
            } catch (e) {}
            // Small delay to ensure last chunk is delivered before stopping
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    mediaRecorderRef.current.stop();
                }
                setIsRecording(false);
            }, 80);
        }
    };

    const togglePlayback = () => {
        if (!audioElRef.current) return;
        if (isPlaying) {
            audioElRef.current.pause();
            setIsPlaying(false);
        } else {
            audioElRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.warn("Audio play error:", err);
            });
        }
    };

    const handleReset = () => {
        if (audioElRef.current) {
            audioElRef.current.pause();
        }
        setIsPlaying(false);
        setAudioBlob(null);
        setAudioUrl(null);
        setError(null);
        setRecordSecs(0);
        if (onRecordingComplete) onRecordingComplete(null);
    };

    return (
        <div className="w-full space-y-2.5">
            {error && (
                <div className="flex items-center gap-2 p-2.5 bg-red-950/60 border border-red-500/40 text-red-200 text-xs rounded-xl font-mono">
                    <AlertCircle size={15} className="shrink-0 text-red-400" />
                    <span>{error}</span>
                </div>
            )}

            {!isRecording && !audioBlob && (
                <button
                    type="button"
                    onClick={startRecording}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all cursor-pointer"
                >
                    <Mic size={16} className="text-amber-400" />
                    <span>RECORD VOICE NOTE (OPTIONAL)</span>
                </button>
            )}

            {isRecording && (
                <div className="space-y-2 p-3 bg-red-950/60 border border-red-500/60 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.3)]">
                    {/* Live Mic VU Volume Meter */}
                    <div className="flex items-center justify-between gap-3 px-1">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                            <span className="text-red-300 font-mono text-xs font-bold tracking-wider">
                                RECORDING {fmtTime(recordSecs)}
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-300">
                            {volumeLevel > 8 ? "VOICE DETECTED ✓" : "SPEAK NOW..."}
                        </span>
                    </div>

                    {/* Animated Volume Wave Bars */}
                    <div className="flex items-center justify-center gap-1.5 h-7 bg-black/40 rounded-xl px-3 border border-red-500/30">
                        {[0.4, 0.7, 1.0, 0.8, 1.2, 0.6, 0.9, 1.1, 0.5, 0.8].map((mult, i) => {
                            const barHeight = Math.max(4, Math.min(24, Math.round((volumeLevel * mult) / 3)));
                            return (
                                <div
                                    key={i}
                                    className={`w-1.5 rounded-full transition-all duration-75 ${
                                        volumeLevel > 8 ? 'bg-amber-400' : 'bg-red-400/40'
                                    }`}
                                    style={{ height: `${barHeight}px` }}
                                />
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={stopRecording}
                        className="w-full py-2 rounded-xl font-mono text-xs font-bold bg-red-500 hover:bg-red-400 text-slate-950 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                        <Square size={13} className="fill-slate-950" />
                        <span>DONE — STOP RECORDING</span>
                    </button>
                </div>
            )}

            {audioBlob && audioUrl && (
                <div className="flex items-center justify-between gap-3 w-full bg-[#14161b] border border-amber-500/40 p-3 rounded-2xl shadow-md">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            type="button"
                            onClick={togglePlayback}
                            className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105 cursor-pointer"
                            title={isPlaying ? "Pause" : "Play preview"}
                        >
                            {isPlaying ? <Pause size={15} className="fill-slate-950" /> : <Play size={15} className="ml-0.5 fill-slate-950" />}
                        </button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-amber-300 font-mono text-xs font-semibold">
                                <Volume2 size={13} className="text-amber-400" />
                                <span>VOICE NOTE READY ({fmtTime(recordSecs || 1)})</span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">
                                Tap play to verify voice sample clarity
                            </p>
                        </div>
                    </div>

                    <audio
                        ref={audioElRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={handleReset}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700 shrink-0 cursor-pointer flex items-center gap-1 text-xs font-mono"
                        title="Re-record voice note"
                    >
                        <RotateCcw size={13} />
                        <span className="hidden sm:inline">Retake</span>
                    </button>
                </div>
            )}
        </div>
    );
}
