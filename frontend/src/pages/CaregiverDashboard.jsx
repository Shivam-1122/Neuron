import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ArrowRight, Check, Camera, Mic, UploadCloud, Cpu, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import AudioRecorder from '../components/AudioRecorder';
import CameraView from '../components/CameraView';

/*
  Caregiver Dashboard - High-Tech Memory Architect Terminal
*/

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const CaregiverDashboard = () => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({ name: '', relation: '', notes: '', age: '' });
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [useLiveCamera, setUseLiveCamera] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [status, setStatus] = useState(null); // 'submitting', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState("");

    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, [step]);

    const handleNext = () => {
        setErrorMessage("");
        if (step === 0 && !formData.name.trim()) return setErrorMessage("Please enter subject name.");
        if (step === 2 && !file) return setErrorMessage("Please upload or acquire an optical photo of the subject.");
        setStep(prev => prev + 1);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && step !== 3) handleNext();
    };

    const handleSubmit = async () => {
        setErrorMessage("");
        if (!formData.name.trim()) {
            setStep(0);
            setErrorMessage("Please enter a name first.");
            return;
        }
        if (!file) {
            setStep(2);
            setErrorMessage("Please upload or capture a photo first.");
            return;
        }

        setStatus('submitting');
        const data = new FormData();
        data.append('name', formData.name.trim());
        data.append('relation', formData.relation.trim() || 'Acquaintance');
        data.append('notes', formData.notes || '');
        if (formData.age) data.append('age', formData.age);
        data.append('file', file, file.name || 'enroll.jpg');
        if (audioBlob) data.append('audio_file', audioBlob, 'voice.webm');

        try {
            const res = await axios.post(`${API_BASE}/remember/patient`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 30000
            });
            if (res.data && res.data.status === 'stored') {
                setStatus('success');
                setTimeout(() => {
                    setStep(0);
                    setFormData({ name: '', relation: '', notes: '', age: '' });
                    setFile(null);
                    setFilePreview(null);
                    setUseLiveCamera(false);
                    setAudioBlob(null);
                    setStatus(null);
                    setErrorMessage("");
                }, 3000);
            } else {
                setStatus('error');
                setErrorMessage(res.data?.message || "Failed to store memory vector. Please verify image.");
            }
        } catch (e) {
            console.error("Enrollment error:", e);
            setStatus('error');
            const detail = e.response?.data?.detail || e.message || "Connection to vector memory failed. Ensure backend is running.";
            setErrorMessage(detail);
        }
    };

    const handleCameraCapture = (blob) => {
        if (blob) {
            setFile(blob);
            setFilePreview(URL.createObjectURL(blob));
            setUseLiveCamera(false);
            setErrorMessage("");
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 font-mono text-cyan-400 text-xs font-bold tracking-widest uppercase">
                            <span>STEP 01 // IDENTITY PROTOCOL</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                        </div>
                        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">
                            What is the person's name?
                        </h1>
                        <p className="font-mono text-xs text-slate-400">
                            This identifier will index their 512-D visual & conversational vectors.
                        </p>
                        {errorMessage && (
                            <div className="bg-red-950/60 border border-red-500/50 text-red-300 font-mono text-xs px-4 py-2.5 rounded-xl">
                                ⚠️ [ALERT]: {errorMessage}
                            </div>
                        )}
                        <input
                            ref={inputRef}
                            className="w-full bg-transparent border-b-2 border-cyan-500/40 focus:border-cyan-400 text-cyan-300 font-mono text-2xl sm:text-3xl font-bold py-2 outline-none transition-all placeholder:text-slate-700"
                            placeholder="TYPE NAME..."
                            value={formData.name}
                            onChange={e => { setFormData({ ...formData, name: e.target.value }); setErrorMessage(""); }}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="pt-4 flex justify-end">
                            <button
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold tracking-wider px-6 py-3 rounded-xl border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                                onClick={handleNext}
                            >
                                <span>PROCEED</span>
                                <Check size={16} />
                            </button>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 font-mono text-cyan-400 text-xs font-bold tracking-widest uppercase">
                            <span>STEP 02 // RELATIONSHIP LINK</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                        </div>
                        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">
                            What is their relationship?
                        </h1>
                        <p className="font-mono text-xs text-slate-400">
                            e.g. Sister, Primary Physician, Neighbor, Grandchild...
                        </p>
                        <input
                            ref={inputRef}
                            className="w-full bg-transparent border-b-2 border-cyan-500/40 focus:border-cyan-400 text-cyan-300 font-mono text-2xl sm:text-3xl font-bold py-2 outline-none transition-all placeholder:text-slate-700"
                            placeholder="TYPE RELATIONSHIP..."
                            value={formData.relation}
                            onChange={e => setFormData({ ...formData, relation: e.target.value })}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="pt-4 flex justify-end">
                            <button
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold tracking-wider px-6 py-3 rounded-xl border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                                onClick={handleNext}
                            >
                                <span>PROCEED</span>
                                <Check size={16} />
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 font-mono text-cyan-400 text-xs font-bold tracking-widest uppercase">
                            <span>STEP 03 // OPTICAL ENCODING</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                        </div>
                        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">
                            Provide an Optical Portrait
                        </h1>
                        <p className="font-mono text-xs text-slate-400">
                            A clear facial profile ensures 99.8% precision vector matching.
                        </p>
                        {errorMessage && (
                            <div className="bg-red-950/60 border border-red-500/50 text-red-300 font-mono text-xs px-4 py-2.5 rounded-xl">
                                ⚠️ [ALERT]: {errorMessage}
                            </div>
                        )}

                        {useLiveCamera ? (
                            <div className="space-y-3 bg-black/90 p-4 rounded-2xl border border-cyan-500/40 shadow-2xl">
                                <CameraView isActive={true} onCapture={handleCameraCapture} />
                                <button
                                    type="button"
                                    onClick={() => setUseLiveCamera(false)}
                                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs rounded-xl border border-slate-700 cursor-pointer"
                                >
                                    DISENGAGE CAMERA
                                </button>
                            </div>
                        ) : filePreview ? (
                            <div className="text-center p-6 bg-slate-900/60 rounded-2xl border border-emerald-500/40">
                                <img src={filePreview} className="max-h-64 mx-auto rounded-xl border-2 border-emerald-400 shadow-[0_0_20px_rgba(0,255,157,0.3)] object-cover" alt="Preview" />
                                <div className="mt-4 flex gap-3 justify-center font-mono">
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('file-upload').click()}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 cursor-pointer"
                                    >
                                        REPLACE FILE
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUseLiveCamera(true)}
                                        className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs rounded-xl border border-cyan-500/40 cursor-pointer"
                                    >
                                        LIVE CAMERA
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div
                                    onClick={() => document.getElementById('file-upload').click()}
                                    className="border border-dashed border-cyan-500/30 hover:border-cyan-400 bg-slate-900/60 hover:bg-cyan-950/30 p-8 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group text-center shadow-inner"
                                >
                                    <UploadCloud size={32} className="text-cyan-400 group-hover:scale-110 mb-2 transition" />
                                    <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-cyan-300">UPLOAD LOCAL PHOTO</span>
                                    <span className="font-mono text-[10px] text-slate-500 mt-1">JPG, PNG, WEBP</span>
                                </div>
                                <div
                                    onClick={() => setUseLiveCamera(true)}
                                    className="border border-dashed border-emerald-500/30 hover:border-emerald-400 bg-slate-900/60 hover:bg-emerald-950/30 p-8 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group text-center shadow-inner"
                                >
                                    <Camera size={32} className="text-emerald-400 group-hover:scale-110 mb-2 transition" />
                                    <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-emerald-300">ACQUIRE LIVE SNAP</span>
                                    <span className="font-mono text-[10px] text-slate-500 mt-1">OPTICAL VIEWPORT</span>
                                </div>
                            </div>
                        )}

                        <input id="file-upload" type="file" accept="image/*" onChange={e => {
                            const f = e.target.files[0];
                            if (f) {
                                setFile(f);
                                setFilePreview(URL.createObjectURL(f));
                                setUseLiveCamera(false);
                                setErrorMessage("");
                            }
                        }} hidden />

                        {file && (
                            <div className="pt-4 flex justify-end">
                                <button
                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold tracking-wider px-6 py-3 rounded-xl border border-cyan-400/50 shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                                    onClick={handleNext}
                                >
                                    <span>PROCEED</span>
                                    <Check size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 font-mono text-cyan-400 text-xs font-bold tracking-widest uppercase">
                            <span>STEP 04 // CONTEXT & VOCAL DATA</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                        </div>
                        <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">
                            Memory Context & Audio Signature
                        </h1>
                        <p className="font-mono text-xs text-slate-400">
                            Add key memories ("Loves classical piano", "Visited on Sunday") and optional voice sample.
                        </p>
                        {errorMessage && (
                            <div className="bg-red-950/60 border border-red-500/50 text-red-300 font-mono text-xs px-4 py-2.5 rounded-xl">
                                ⚠️ [ALERT]: {errorMessage}
                            </div>
                        )}
                        <textarea
                            ref={inputRef}
                            className="w-full bg-slate-900/80 border border-slate-800 focus:border-cyan-500/60 rounded-2xl p-4 font-mono text-sm text-slate-100 placeholder:text-slate-600 outline-none h-28 resize-none transition-all shadow-inner"
                            placeholder="TYPE CONTEXTUAL MEMORIES..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />

                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
                            <span className="text-slate-400">Vocal Biometric (Optional):</span>
                            <div className="w-full sm:w-auto">
                                <AudioRecorder onRecordingComplete={setAudioBlob} />
                            </div>
                        </div>

                        <button
                            className="w-full py-4 rounded-2xl font-mono text-xs sm:text-sm font-bold tracking-wider text-white shadow-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 border border-emerald-400/50 shadow-[0_0_30px_rgba(0,255,157,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                            onClick={handleSubmit}
                            disabled={status === 'submitting'}
                        >
                            {status === 'submitting' ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" />
                                    <span>ENCODING & COMMIT TO QDRANT MEMORY...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={18} />
                                    <span>COMMIT MEMORY PROTOCOL</span>
                                </>
                            )}
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col justify-center items-center text-center p-6 cyber-grid-bg">
                <div className="p-5 bg-emerald-950/80 border border-emerald-400 rounded-3xl shadow-[0_0_40px_rgba(0,255,157,0.4)] mb-6 animate-bounce">
                    <Check size={48} className="text-emerald-400" />
                </div>
                <h1 className="font-display font-extrabold text-4xl text-emerald-400 tracking-wide uppercase mb-2">
                    MEMORY VECTOR COMMITTED!
                </h1>
                <p className="font-mono text-xs sm:text-sm text-slate-400 max-w-md">
                    Subject data, facial embeddings, and conversational facts are securely vectorized in Neuron.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col items-center justify-center relative p-6 cyber-grid-bg">
            {/* Cyber Progress HUD Top Bar */}
            <div className="fixed top-[70px] left-0 w-full h-1 bg-slate-900 z-40">
                <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
                    style={{ width: `${(step + 1) * 25}%` }}
                />
            </div>

            <div className="w-full max-w-2xl bg-[#0c1322]/90 border border-cyan-500/30 p-8 sm:p-10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl tech-bracket relative z-10 my-8">
                {renderStep()}
            </div>
        </div>
    );
};

export default CaregiverDashboard;
