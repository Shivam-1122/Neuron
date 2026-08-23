import React, { useState, useRef } from 'react';
import { Mic, Square, Play, RotateCcw } from 'lucide-react';

export default function AudioRecorder({ onRecordingComplete }) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                onRecordingComplete(blob);

                // Stop tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic access denied", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="w-full">
            {!isRecording && !audioBlob && (
                <button
                    type="button"
                    onClick={startRecording}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all cursor-pointer"
                >
                    <Mic size={16} className="text-cyan-400" />
                    <span>RECORD VOCAL BIOMETRIC</span>
                </button>
            )}

            {isRecording && (
                <button
                    type="button"
                    onClick={stopRecording}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider bg-red-950/80 hover:bg-red-900/90 text-red-300 border border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse transition-all cursor-pointer"
                >
                    <Square size={16} className="text-red-400" />
                    <span>STOP VOCAL RECORDING</span>
                </button>
            )}

            {audioBlob && (
                <div className="flex items-center gap-2 w-full bg-slate-900/80 border border-emerald-500/30 p-2 rounded-xl">
                    <audio src={audioUrl} controls className="flex-1 h-7 opacity-80" />
                    <button
                        type="button"
                        onClick={() => {
                            setAudioBlob(null);
                            setAudioUrl(null);
                            onRecordingComplete(null);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
                        title="Re-record"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
