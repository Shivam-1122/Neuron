import React, { useState, useRef } from 'react';
import AudioRecorder from './AudioRecorder';
import CameraView from './CameraView';
import { UserPlus, PackagePlus, Save, X, Mic, Image as ImageIcon, Camera, Upload, RefreshCw } from 'lucide-react';

function EnrollmentForm({ type = 'person', onCancel, onSave }) {
    const [name, setName] = useState("");
    const [relation, setRelation] = useState("Acquaintance");
    const [age, setAge] = useState("");
    const [notes, setNotes] = useState("");
    const [audioBlob, setAudioBlob] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [useLiveCamera, setUseLiveCamera] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const fileInputRef = useRef(null);
    const isPerson = type === 'person';

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            setUseLiveCamera(false);
            setErrorMessage("");
        }
    };

    const handleCameraCapture = (blob) => {
        if (blob) {
            setPhotoFile(blob);
            setPhotoPreview(URL.createObjectURL(blob));
            setUseLiveCamera(false);
            setErrorMessage("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (!name.trim()) {
            setErrorMessage("Please provide a name.");
            return;
        }

        if (!photoFile) {
            setErrorMessage(isPerson ? "Please upload or capture a photo of the person." : "Please upload or capture a photo of the object.");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await onSave({
                name: name.trim(),
                relation: relation.trim(),
                age: age ? parseInt(age) : null,
                notes: notes.trim(),
                audioBlob,
                file: photoFile,
                type
            });

            if (result && result.success) {
                if (result.avatar_url) {
                    setAvatarUrl(result.avatar_url);
                } else {
                    setAvatarUrl(photoPreview); // Fallback to captured preview
                }
            } else if (result && result.error) {
                setErrorMessage(result.error);
            }
        } catch (err) {
            setErrorMessage("An unexpected error occurred during enrollment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="enrollment-container overflow-y-auto bg-[#080d1a] text-slate-100 p-6 cyber-grid-bg h-full flex flex-col">
            <div className="enrollment-header flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-5">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${isPerson ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-amber-950/80 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`}>
                        {isPerson ? <UserPlus size={22} /> : <PackagePlus size={22} />}
                    </div>
                    <div>
                        <h3 className="font-display text-lg font-bold text-slate-100 uppercase tracking-wider">
                            {avatarUrl ? "BIOMETRIC ENROLLMENT COMPLETE" : (isPerson ? "ENROLL NEW BIOMETRIC PROFILE" : "ENROLL NEW OBJECT TELEMETRY")}
                        </h3>
                        <p className="font-mono text-[10px] text-cyan-400/70 tracking-widest uppercase">
                            {isPerson ? "FACIAL & VOCAL VECTOR ENCODING" : "VECTOR MEMORY SPATIAL TRACKING"}
                        </p>
                    </div>
                </div>
                <button onClick={onCancel} className="close-btn p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer">
                    <X size={18} />
                </button>
            </div>

            {errorMessage && (
                <div className="bg-red-950/60 border border-red-500/50 text-red-300 font-mono text-xs px-4 py-3 rounded-xl mb-4 flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <span>⚠️ [ERROR]:</span>
                    <span>{errorMessage}</span>
                </div>
            )}

            {!avatarUrl ? (
                <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                        {/* Name Field */}
                        <div>
                            <label className="block font-mono text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
                                {isPerson ? "SUBJECT NAME / IDENTIFIER *" : "OBJECT IDENTIFIER *"}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={isPerson ? "e.g., Sarah (Daughter)" : "e.g., Car Keys, Reading Glasses"}
                                required
                                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-xs md:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all"
                            />
                        </div>

                        {/* Person Specific: Relation & Age */}
                        {isPerson && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-mono text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
                                        RELATIONSHIP PROTOCOL
                                    </label>
                                    <input
                                        type="text"
                                        value={relation}
                                        onChange={(e) => setRelation(e.target.value)}
                                        placeholder="e.g., Daughter, Physician, Friend"
                                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-xs md:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block font-mono text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
                                        AGE (OPTIONAL)
                                    </label>
                                    <input
                                        type="number"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        placeholder="e.g., 45"
                                        className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-xs md:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Notes / Description */}
                        <div>
                            <label className="block font-mono text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
                                {isPerson ? "CONTEXT & KEY MEMORIES" : "LOCATION TELEMETRY & NOTES"}
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder={isPerson
                                    ? "e.g., Lives in Chicago. Loves gardening. Has two golden retrievers."
                                    : "e.g., Stored on the bedside table or office desk."
                                }
                                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 font-mono text-xs md:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/80 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all resize-none"
                            />
                        </div>

                        {/* Photo Attachment Section */}
                        <div>
                            <label className="block font-mono text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                <span>{isPerson ? "FACIAL BIOMETRIC VISUAL *" : "OBJECT VISUAL SCAN *"}</span>
                                {photoFile && <span className="text-emerald-400 text-[10px] font-bold">[ATTACHED ✓]</span>}
                            </label>
                            
                            {useLiveCamera ? (
                                <div className="bg-black/90 rounded-2xl overflow-hidden border border-cyan-500/40 p-3 space-y-3 shadow-2xl">
                                    <CameraView isActive={true} onCapture={handleCameraCapture} />
                                    <button
                                        type="button"
                                        onClick={() => setUseLiveCamera(false)}
                                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-mono text-xs font-semibold transition cursor-pointer border border-slate-700"
                                    >
                                        DISENGAGE CAMERA
                                    </button>
                                </div>
                            ) : photoPreview ? (
                                <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-emerald-950/20 p-3 flex items-center gap-4 shadow-[0_0_20px_rgba(0,255,157,0.15)]">
                                    <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-emerald-400/60 shadow-lg" />
                                    <div className="flex-1 font-mono">
                                        <p className="text-xs font-bold text-emerald-400">BIOMETRIC VISUAL READY ✓</p>
                                        <p className="text-[10px] text-slate-400">Target ready for 512-D vectorization</p>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
                                        >
                                            REPLACE
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUseLiveCamera(true)}
                                            className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-mono rounded-lg border border-cyan-500/40 transition flex items-center gap-1 cursor-pointer"
                                        >
                                            <Camera size={12} /> RETAKE
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border border-dashed border-cyan-500/30 hover:border-cyan-400 bg-slate-900/60 hover:bg-cyan-950/30 p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group text-center shadow-inner"
                                    >
                                        <Upload size={22} className="text-cyan-400 group-hover:scale-110 mb-1.5 transition" />
                                        <span className="font-mono text-xs font-semibold text-slate-200 group-hover:text-cyan-300">UPLOAD IMAGE</span>
                                        <span className="font-mono text-[10px] text-slate-500">JPG, PNG, WEBP</span>
                                    </div>

                                    <div
                                        onClick={() => setUseLiveCamera(true)}
                                        className="border border-dashed border-cyan-500/30 hover:border-cyan-400 bg-slate-900/60 hover:bg-cyan-950/30 p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group text-center shadow-inner"
                                    >
                                        <Camera size={22} className="text-cyan-400 group-hover:scale-110 mb-1.5 transition" />
                                        <span className="font-mono text-xs font-semibold text-slate-200 group-hover:text-cyan-300">LIVE CAMERA</span>
                                        <span className="font-mono text-[10px] text-slate-500">OPTICAL SENSOR</span>
                                    </div>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {/* Person Specific: Audio Voice Sample */}
                        {isPerson && (
                            <div>
                                <label className="block font-mono text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span>VOCAL BIOMETRIC SAMPLE (OPTIONAL)</span>
                                    {audioBlob && <span className="text-emerald-400 text-[10px] font-bold">[RECORDED ✓]</span>}
                                </label>
                                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                                        <Mic size={16} className="text-cyan-400 animate-pulse" />
                                        <span>{audioBlob ? "Vocal telemetry attached" : "Record voice signature"}</span>
                                    </div>
                                    <div className="max-w-[200px]">
                                        <AudioRecorder onRecordingComplete={(blob) => setAudioBlob(blob)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-cyan-500/20 mt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-3.5 rounded-xl font-mono text-xs md:text-sm font-bold tracking-wider text-white shadow-xl flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
                                ${isPerson
                                    ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 border border-cyan-400/50 shadow-[0_0_25px_rgba(0,240,255,0.4)]'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="animate-spin" size={18} />
                                    <span>SYNTHESIZING & ENCODING VECTORS...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>{isPerson ? "COMMIT SUBJECT TO MEMORY CORTEX" : "COMMIT OBJECT TELEMETRY"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="avatar-result flex flex-col items-center justify-center p-8 space-y-5 my-auto">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full"></div>
                        <img
                            src={avatarUrl}
                            alt="Generated Avatar"
                            className="w-40 h-40 rounded-full object-cover border-4 border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.5)] relative z-10"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-cyan-950 border border-cyan-400 text-cyan-300 p-2.5 rounded-full z-20 shadow-xl">
                            <ImageIcon size={18} />
                        </div>
                    </div>
                    <div className="text-center font-mono">
                        <h4 className="font-display text-2xl font-bold text-slate-100 uppercase tracking-wider">ENROLLMENT COMMITTED! 🎉</h4>
                        <p className="text-slate-400 text-xs mt-2 max-w-sm">
                            {isPerson
                                ? `[${name}] has been successfully vectorized in Qdrant memory. Visual and conversational recall is active.`
                                : `[${name}] object telemetry has been stored in memory cortex.`
                            }
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 px-8 py-3 rounded-xl font-mono text-xs font-bold tracking-wider transition-all w-full max-w-xs shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer"
                    >
                        RETURN TO CORTEX
                    </button>
                </div>
            )}
        </div>
    );
}

export default EnrollmentForm;
