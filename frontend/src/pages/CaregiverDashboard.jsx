import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
    ArrowRight, 
    Check, 
    Camera, 
    Mic, 
    UploadCloud, 
    Heart, 
    Sparkles, 
    RefreshCw, 
    UserPlus,
    Users,
    Mail,
    Phone,
    Shield,
    Lock,
    Trash2,
    ScanFace,
    AlertCircle,
    Bell,
    CheckCircle2
} from 'lucide-react';
import AudioRecorder from '../components/AudioRecorder';
import CameraView from '../components/CameraView';
import soundManager from '../utils/soundManager';
import { useAuth } from '../context/AuthContext';
import { formatImageSrc } from '../utils/imageUtils';

/*
  Caregiver Dashboard - Warm Cognitive Sanctuary Memory Portal & Caregiver Team Management
*/

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const CaregiverDashboard = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.uid || "default_user";

    // Dashboard View Mode: 'caregivers' | 'memories'
    const [activeTab, setActiveTab] = useState('caregivers');

    // === CAREGIVERS STATE ===
    const [caregivers, setCaregivers] = useState([]);
    const [loadingCaregivers, setLoadingCaregivers] = useState(false);
    const [showAddCaregiver, setShowAddCaregiver] = useState(false);
    
    // New Caregiver Form
    const [cgName, setCgName] = useState('');
    const [cgEmail, setCgEmail] = useState('');
    const [cgPhone, setCgPhone] = useState('');
    const [cgRelation, setCgRelation] = useState('Primary Caregiver');
    const [cgPassword, setCgPassword] = useState('');
    const [cgStatus, setCgStatus] = useState(null); // 'saving' | 'success' | 'error'
    const [cgMessage, setCgMessage] = useState('');

    // Face Photo state for New Caregiver Enrollment
    const [cgPhoto, setCgPhoto] = useState(null);
    const [cgPhotoPreview, setCgPhotoPreview] = useState(null);
    const [useCgCamera, setUseCgCamera] = useState(false);

    // Face Photo update state for Existing Caregivers
    const [updatingCgId, setUpdatingCgId] = useState(null);
    const [updateCgCamera, setUpdateCgCamera] = useState(false);
    const [updateCgLoading, setUpdateCgLoading] = useState(false);
    const [updateCgMessage, setUpdateCgMessage] = useState('');

    // === MEMORIES WIZARD STATE (Remember Loved One) ===
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({ name: '', relation: '', notes: '', age: '' });
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [useLiveCamera, setUseLiveCamera] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [status, setStatus] = useState(null); // 'submitting', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState("");

    const inputRef = useRef(null);

    // Fetch registered caregivers
    const fetchCaregivers = async () => {
        setLoadingCaregivers(true);
        try {
            const res = await axios.get(`${API_BASE}/caregivers`, {
                params: { user_id: userId }
            });
            if (res.data && res.data.caregivers) {
                setCaregivers(res.data.caregivers);
            }
        } catch (err) {
            console.error("Failed to load caregivers:", err);
        } finally {
            setLoadingCaregivers(false);
        }
    };

    useEffect(() => {
        fetchCaregivers();
    }, [userId]);

    // Submit New Caregiver (Email & Password credentials + Optional Face Photo)
    const handleSaveCaregiver = async (e) => {
        if (e) e.preventDefault();
        setCgMessage('');
        
        if (!cgName.trim()) {
            setCgMessage("Please enter the caregiver's name.");
            return;
        }
        if (!cgEmail.trim()) {
            setCgMessage("Please enter an email address for alert notifications and login.");
            return;
        }

        setCgStatus('saving');
        try {
            const data = new FormData();
            data.append('name', cgName.trim());
            data.append('email', cgEmail.trim());
            data.append('phone', cgPhone.trim());
            data.append('relation', cgRelation.trim());
            data.append('password', cgPassword || 'caregiver123');
            data.append('user_id', userId);
            if (cgPhoto) {
                data.append('file', cgPhoto, 'caregiver_face.jpg');
            }

            const res = await axios.post(`${API_BASE}/caregivers`, data);
            if (res.data && res.data.status === 'success') {
                soundManager.playChime('send');
                setCgStatus('success');
                setCgMessage("Caregiver registered successfully with biometric face data! They can now log in via Email and Password.");
                fetchCaregivers();
                setTimeout(() => {
                    setShowAddCaregiver(false);
                    setCgName('');
                    setCgEmail('');
                    setCgPhone('');
                    setCgPassword('');
                    setCgPhoto(null);
                    setCgPhotoPreview(null);
                    setUseCgCamera(false);
                    setCgStatus(null);
                    setCgMessage('');
                }, 1800);
            } else {
                setCgStatus('error');
                setCgMessage(res.data?.message || "Failed to register caregiver.");
            }
        } catch (err) {
            console.error("Caregiver save error:", err);
            setCgStatus('error');
            setCgMessage(err.response?.data?.detail || err.message || "Failed to save caregiver.");
        }
    };

    // Update Face Photo for existing caregiver
    const handleUpdateCaregiverPhoto = async (cgId, fileBlob) => {
        if (!fileBlob) return;
        setUpdateCgLoading(true);
        setUpdateCgMessage('');
        try {
            const data = new FormData();
            data.append('file', fileBlob, 'caregiver_face.jpg');
            data.append('user_id', userId);

            const res = await axios.post(`${API_BASE}/caregivers/${cgId}/photo`, data);
            if (res.data && res.data.status === 'success') {
                soundManager.playChime('send');
                setUpdateCgMessage("Face data indexed in memory successfully!");
                fetchCaregivers();
                setTimeout(() => {
                    setUpdatingCgId(null);
                    setUpdateCgCamera(false);
                    setUpdateCgMessage('');
                }, 1500);
            } else {
                setUpdateCgMessage(res.data?.detail || "Failed to update face data.");
            }
        } catch (err) {
            console.error("Caregiver photo update error:", err);
            setUpdateCgMessage(err.response?.data?.detail || err.message || "Failed to upload photo.");
        } finally {
            setUpdateCgLoading(false);
        }
    };

    // Delete Caregiver
    const handleDeleteCaregiver = async (cgId) => {
        if (!window.confirm("Are you sure you want to remove this caregiver? They will no longer receive alerts or be able to log in.")) {
            return;
        }
        try {
            const res = await axios.delete(`${API_BASE}/caregivers/${cgId}`, {
                params: { user_id: userId }
            });
            soundManager.playChime('click');
            const targetId = res.data?.caregiver_id || cgId;
            setCaregivers(prev => prev.filter(c => c.id !== cgId && c.id !== targetId));

            // Clean up localStorage cached profiles and credentials for this caregiver
            try {
                localStorage.removeItem(`neuron_profile_${cgId}`);
                if (targetId) {
                    localStorage.removeItem(`neuron_profile_${targetId}`);
                }
                const cgObj = caregivers.find(c => c.id === cgId || c.id === targetId);
                const cgEmail = res.data?.email || cgObj?.email;
                const localUsers = JSON.parse(localStorage.getItem("neuron_local_users") || "[]");
                const filtered = localUsers.filter(u => u.uid !== cgId && u.id !== cgId && u.uid !== targetId && u.id !== targetId && (!cgEmail || u.email !== cgEmail));
                localStorage.setItem("neuron_local_users", JSON.stringify(filtered));
            } catch (storageErr) {
                console.warn("Storage cleanup note:", storageErr);
            }
            fetchCaregivers();
        } catch (err) {
            console.error("Delete caregiver error:", err);
            alert("Failed to delete caregiver: " + (err.response?.data?.detail || err.message));
        }
    };

    // === MEMORIES WIZARD HANDLERS ===
    const handleNext = () => {
        setErrorMessage("");
        if (step === 0 && !formData.name.trim()) return setErrorMessage("Please enter their name.");
        if (step === 2 && !file) return setErrorMessage("Please upload or take a clear photo.");
        setStep(prev => prev + 1);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && step !== 3) handleNext();
    };

    const handleSubmitMemory = async () => {
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
        data.append('relation', formData.relation.trim() || 'Family Member');
        data.append('notes', formData.notes || '');
        if (formData.age) data.append('age', formData.age);
        data.append('file', file, file.name || 'enroll.jpg');
        data.append('user_id', userId);
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
                setErrorMessage(res.data?.message || "Failed to store memory. Please verify photo quality.");
            }
        } catch (e) {
            console.error("Enrollment error:", e);
            setStatus('error');
            const detail = e.response?.data?.detail || e.message || "Connection to memory service failed. Please check backend.";
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

    return (
        <div className="w-full flex-1 min-h-0 bg-[#111318] text-[#e2e2e9] flex flex-col items-center justify-start relative p-4 sm:p-8 select-none overflow-y-auto">
            
            {/* Top Navigation Tabs */}
            <div className="w-full max-w-4xl flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white flex items-center gap-3">
                        <Users className="text-amber-400" size={26} />
                        <span>Caregiver Control Sanctuary</span>
                    </h1>
                    <p className="font-sans text-xs text-slate-400 mt-1">
                        Manage authorized caregivers, configure email alert notifications, and enroll family memories.
                    </p>
                </div>

                <div className="flex bg-[#181a20] p-1.5 rounded-2xl border border-white/[0.08] shrink-0">
                    <button
                        onClick={() => setActiveTab('caregivers')}
                        className={`px-4 py-2 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                            activeTab === 'caregivers'
                                ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Shield size={14} />
                        <span>Caregiver Circle &amp; Alerts</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('memories')}
                        className={`px-4 py-2 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                            activeTab === 'memories'
                                ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Heart size={14} />
                        <span>Remember Loved One</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: CAREGIVERS TEAM & EMAIL ALERTS */}
            {activeTab === 'caregivers' && (
                <div className="w-full max-w-4xl space-y-6">
                    {/* Reassurance Banner */}
                    <div className="bg-[#181a20] border border-amber-500/25 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-amber-500/15 rounded-xl border border-amber-500/30 text-amber-400">
                                <Bell size={22} />
                            </div>
                            <div>
                                <h3 className="font-serif font-bold text-white text-sm">Automatic Patient Alert System</h3>
                                <p className="text-slate-400 text-xs mt-0.5">
                                    When the patient asks something the assistant has no data for, you will receive an instant email alert with their exact question.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowAddCaregiver(!showAddCaregiver)}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-sans text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-2 cursor-pointer shrink-0"
                        >
                            <UserPlus size={15} />
                            <span>{showAddCaregiver ? "Close Enrollment" : "+ Add Caregiver"}</span>
                        </button>
                    </div>

                    {/* ENROLL CAREGIVER FORM */}
                    {showAddCaregiver && (
                        <div className="bg-[#181a20] border border-amber-500/40 p-6 rounded-3xl shadow-2xl space-y-4 animate-fadeIn">
                            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                                <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-semibold">
                                    <Shield size={16} />
                                    <span>ENROLL AUTHORIZED CAREGIVER</span>
                                </div>
                                <span className="text-[11px] font-mono text-slate-400">EMAIL ALERTS &amp; SECURE LOGIN</span>
                            </div>

                            {cgMessage && (
                                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                                    cgStatus === 'success' 
                                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200' 
                                        : 'bg-red-950/60 border border-red-500/40 text-red-200'
                                }`}>
                                    {cgStatus === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    <span>{cgMessage}</span>
                                </div>
                            )}

                            <form onSubmit={handleSaveCaregiver} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-mono text-slate-400">Caregiver Full Name *</label>
                                        <input
                                            type="text"
                                            value={cgName}
                                            onChange={e => setCgName(e.target.value)}
                                            placeholder="e.g. Sarah Jenkins"
                                            required
                                            className="w-full px-3.5 py-2.5 bg-[#12141a] border border-white/[0.08] focus:border-amber-400 rounded-xl text-xs text-white outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-mono text-slate-400">Email Address (Alerts &amp; Login) *</label>
                                        <input
                                            type="email"
                                            value={cgEmail}
                                            onChange={e => setCgEmail(e.target.value)}
                                            placeholder="sarah.caregiver@example.com"
                                            required
                                            className="w-full px-3.5 py-2.5 bg-[#12141a] border border-white/[0.08] focus:border-amber-400 rounded-xl text-xs text-white outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-mono text-slate-400">Phone Number (Optional - for contact alerts)</label>
                                        <input
                                            type="tel"
                                            value={cgPhone}
                                            onChange={e => setCgPhone(e.target.value)}
                                            placeholder="+1 555-0199"
                                            className="w-full px-3.5 py-2.5 bg-[#12141a] border border-white/[0.08] focus:border-amber-400 rounded-xl text-xs text-white outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-mono text-slate-400">Relationship / Role</label>
                                        <select
                                            value={cgRelation}
                                            onChange={e => setCgRelation(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-[#12141a] border border-white/[0.08] focus:border-amber-400 rounded-xl text-xs text-white outline-none"
                                        >
                                            <option value="Primary Caregiver">Primary Caregiver</option>
                                            <option value="Daughter / Son">Daughter / Son</option>
                                            <option value="Spouse / Partner">Spouse / Partner</option>
                                            <option value="Home Nurse">Home Nurse</option>
                                            <option value="Family Physician">Family Physician</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1 sm:col-span-2">
                                        <label className="text-xs font-mono text-slate-400">Caregiver Login Password *</label>
                                        <input
                                            type="password"
                                            value={cgPassword}
                                            onChange={e => setCgPassword(e.target.value)}
                                            placeholder="Set a password for email login (e.g. Caregiver2026!)"
                                            required
                                            className="w-full px-3.5 py-2.5 bg-[#12141a] border border-white/[0.08] focus:border-amber-400 rounded-xl text-xs text-white outline-none"
                                        />
                                    </div>

                                    {/* Caregiver Face Photo Biometrics */}
                                    <div className="space-y-2 sm:col-span-2 pt-3 border-t border-white/[0.06]">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-mono text-amber-300 flex items-center gap-1.5 font-semibold">
                                                <ScanFace size={15} className="text-amber-400" />
                                                <span>Caregiver Face Photo (For Patient AI Recognition &amp; Visual Chat)</span>
                                            </label>
                                            <span className="text-[10px] font-mono text-slate-400">CAMERA OR UPLOAD</span>
                                        </div>

                                        {cgPhotoPreview ? (
                                            <div className="flex items-center gap-4 p-3 bg-[#12141a] rounded-2xl border border-amber-500/30">
                                                <img 
                                                    src={cgPhotoPreview} 
                                                    alt="Caregiver Preview" 
                                                    className="w-20 h-20 rounded-xl object-cover border border-amber-400/50 shadow-md"
                                                />
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold flex items-center gap-1 text-emerald-400">
                                                        <CheckCircle2 size={13} />
                                                        <span>Face Data Acquired</span>
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        Neuron will index this facial biometric for immediate caregiver memory &amp; face retrieval in chat.
                                                    </p>
                                                    <div className="flex gap-2 pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setCgPhoto(null); setCgPhotoPreview(null); setUseCgCamera(true); }}
                                                            className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold transition-colors cursor-pointer"
                                                        >
                                                            Retake Photo
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setCgPhoto(null); setCgPhotoPreview(null); setUseCgCamera(false); }}
                                                            className="px-3 py-1 rounded-lg text-slate-400 hover:text-white text-[11px] transition-colors cursor-pointer"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : useCgCamera ? (
                                            <div className="p-3 bg-[#12141a] rounded-2xl border border-amber-500/30 space-y-3">
                                                <CameraView 
                                                    isActive={useCgCamera}
                                                    buttonLabel="CAPTURE CAREGIVER FACE DATA"
                                                    onCapture={(blob) => {
                                                        setCgPhoto(blob);
                                                        setCgPhotoPreview(URL.createObjectURL(blob));
                                                        setUseCgCamera(false);
                                                    }}
                                                />
                                                <div className="flex justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setUseCgCamera(false)}
                                                        className="text-xs text-slate-400 hover:text-white cursor-pointer"
                                                    >
                                                        Cancel Camera
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setUseCgCamera(true)}
                                                    className="p-4 bg-[#12141a] hover:bg-amber-500/10 border border-white/[0.08] hover:border-amber-400/40 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-amber-300 transition-all cursor-pointer group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                                                        <Camera size={20} />
                                                    </div>
                                                    <span className="text-xs font-semibold">Take Face Photo (Live Camera)</span>
                                                    <span className="text-[10px] text-slate-400">Capture face using webcam</span>
                                                </button>

                                                <label className="p-4 bg-[#12141a] hover:bg-amber-500/10 border border-white/[0.08] hover:border-amber-400/40 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-amber-300 transition-all cursor-pointer group">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const f = e.target.files?.[0];
                                                            if (f) {
                                                                setCgPhoto(f);
                                                                setCgPhotoPreview(URL.createObjectURL(f));
                                                            }
                                                        }}
                                                    />
                                                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                                                        <UploadCloud size={20} />
                                                    </div>
                                                    <span className="text-xs font-semibold">Upload Photo File</span>
                                                    <span className="text-[10px] text-slate-400">JPEG, PNG portrait photo</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCaregiver(false)}
                                        className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={cgStatus === 'saving'}
                                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50"
                                    >
                                        {cgStatus === 'saving' ? (
                                            <>
                                                <RefreshCw size={14} className="animate-spin" />
                                                <span>Enrolling Caregiver...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check size={14} />
                                                <span>Register Caregiver</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* CAREGIVER LIST */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                            <span>REGISTERED CAREGIVERS ({caregivers.length})</span>
                            <span>EMAIL ALERT RECIPIENTS</span>
                        </div>

                        {loadingCaregivers ? (
                            <div className="p-8 bg-[#181a20] rounded-2xl border border-white/[0.06] text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                <RefreshCw size={15} className="animate-spin text-amber-400" />
                                <span>Loading caregiver circle...</span>
                            </div>
                        ) : caregivers.length === 0 ? (
                            <div className="p-8 bg-[#181a20] rounded-2xl border border-white/[0.06] text-center space-y-2">
                                <p className="text-sm font-semibold text-white">No Caregivers Registered Yet</p>
                                <p className="text-xs text-slate-400 max-w-md mx-auto">
                                    Add your email or family contact above so Neuron can send alert notifications whenever the patient asks questions about unknown items or people.
                                </p>
                                <button
                                    onClick={() => setShowAddCaregiver(true)}
                                    className="mt-2 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-all cursor-pointer"
                                >
                                    + Add First Caregiver
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {caregivers.map(cg => (
                                    <div 
                                        key={cg.id}
                                        className="p-5 bg-[#181a20] border border-white/[0.08] hover:border-amber-400/40 rounded-2xl flex flex-col justify-between transition-all shadow-md group relative"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-14 h-14 shrink-0">
                                                    {cg.image_base64 ? (
                                                        <img 
                                                            src={formatImageSrc(cg.image_base64)} 
                                                            alt={cg.name} 
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                if (e.currentTarget.nextElementSibling) {
                                                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                }
                                                            }}
                                                            className="w-14 h-14 rounded-2xl object-cover border border-amber-500/40 shadow-sm" 
                                                        />
                                                    ) : null}
                                                    <div 
                                                        style={{ display: cg.image_base64 ? 'none' : 'flex' }}
                                                        className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-300 font-bold text-lg items-center justify-center border border-amber-500/30"
                                                    >
                                                        {(cg.name || 'C')[0].toUpperCase()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-serif font-bold text-white text-base">{cg.name}</h4>
                                                        <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
                                                            {cg.relation || "Caregiver"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                                                        <Mail size={12} className="text-amber-400" />
                                                        <span>{cg.email}</span>
                                                    </div>
                                                    {cg.phone && (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                                                            <Phone size={12} className="text-slate-500" />
                                                            <span>{cg.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleDeleteCaregiver(cg.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                title="Remove caregiver"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>

                                        {/* Inline Photo Update Panel for this Caregiver */}
                                        {updatingCgId === cg.id && (
                                            <div className="my-3 p-4 bg-[#12141a] rounded-2xl border border-amber-500/40 space-y-3 animate-fadeIn">
                                                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                                                    <span className="text-xs font-mono text-amber-300 font-semibold flex items-center gap-1.5">
                                                        <Camera size={13} />
                                                        <span>Update Face Data for {cg.name}</span>
                                                    </span>
                                                    <button 
                                                        onClick={() => { setUpdatingCgId(null); setUpdateCgCamera(false); setUpdateCgMessage(''); }}
                                                        className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                                                    >
                                                        Close
                                                    </button>
                                                </div>

                                                {updateCgMessage && (
                                                    <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-1.5">
                                                        <CheckCircle2 size={13} />
                                                        <span>{updateCgMessage}</span>
                                                    </div>
                                                )}

                                                {updateCgLoading ? (
                                                    <div className="p-4 text-center text-xs text-amber-300 flex items-center justify-center gap-2">
                                                        <RefreshCw size={14} className="animate-spin" />
                                                        <span>Processing biometrics &amp; indexing in memory...</span>
                                                    </div>
                                                ) : updateCgCamera ? (
                                                    <div className="space-y-2">
                                                        <CameraView 
                                                            isActive={updateCgCamera}
                                                            buttonLabel="CAPTURE FACE DATA"
                                                            onCapture={(blob) => handleUpdateCaregiverPhoto(cg.id, blob)}
                                                        />
                                                        <div className="flex justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => setUpdateCgCamera(false)}
                                                                className="text-xs text-slate-400 hover:text-white cursor-pointer"
                                                            >
                                                                Back to options
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setUpdateCgCamera(true)}
                                                            className="p-3 bg-[#181a20] hover:bg-amber-500/10 border border-white/[0.08] hover:border-amber-400/40 rounded-xl flex items-center justify-center gap-2 text-xs text-amber-300 font-semibold cursor-pointer"
                                                        >
                                                            <Camera size={14} />
                                                            <span>Take Snapshot</span>
                                                        </button>

                                                        <label className="p-3 bg-[#181a20] hover:bg-amber-500/10 border border-white/[0.08] hover:border-amber-400/40 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-300 hover:text-white font-semibold cursor-pointer">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const f = e.target.files?.[0];
                                                                    if (f) handleUpdateCaregiverPhoto(cg.id, f);
                                                                }}
                                                            />
                                                            <UploadCloud size={14} />
                                                            <span>Upload Photo</span>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                                            <span className="flex items-center gap-1.5 text-emerald-400">
                                                <CheckCircle2 size={13} />
                                                <span>EMAIL ALERTS ACTIVE</span>
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (updatingCgId === cg.id) {
                                                            setUpdatingCgId(null);
                                                            setUpdateCgCamera(false);
                                                        } else {
                                                            setUpdatingCgId(cg.id);
                                                            setUpdateCgCamera(false);
                                                            setUpdateCgMessage('');
                                                        }
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <Camera size={12} />
                                                    <span>{cg.image_base64 ? "Update Face" : "Take Face Data"}</span>
                                                </button>

                                                <span className="text-slate-400 flex items-center gap-1">
                                                    <Lock size={12} className="text-slate-500" />
                                                    <span>Password</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: REMEMBER LOVED ONE (4-Step Wizard) */}
            {activeTab === 'memories' && (
                <div className="w-full max-w-2xl bg-[#181a20] border border-amber-500/25 p-8 sm:p-10 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative z-10 my-4">
                    {/* Ambient Progress HUD Top Bar */}
                    <div className="w-full h-1 bg-[#12141a] rounded-full mb-6 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]"
                            style={{ width: `${(step + 1) * 25}%` }}
                        />
                    </div>

                    {status === 'success' ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 mx-auto bg-amber-500/20 border border-amber-400/50 rounded-3xl flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-bounce">
                                <Check size={36} />
                            </div>
                            <h2 className="font-serif font-bold text-2xl text-amber-300">Memory Safely Enrolled!</h2>
                            <p className="font-sans text-xs text-slate-400 max-w-sm mx-auto">
                                {formData.name} is now stored in Neuron. The patient can now ask questions about them.
                            </p>
                        </div>
                    ) : (
                        <div>
                            {step === 0 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 font-mono text-amber-400 text-xs font-semibold tracking-wider uppercase">
                                        <span>STEP 01 // LOVED ONE'S IDENTITY</span>
                                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    </div>
                                    <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white">What is their name?</h2>
                                    <p className="font-sans text-xs text-slate-400">Enter the name of your family member, loved one, or close friend.</p>
                                    {errorMessage && <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs">{errorMessage}</div>}
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="e.g. Sarah, Grandma Rose, Dr. Robert"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        onKeyDown={handleKeyDown}
                                        className="w-full bg-[#1f222a] border border-white/[0.08] focus:border-amber-400/60 rounded-2xl p-4 font-sans text-base text-white placeholder:text-slate-500 outline-none"
                                    />
                                    <div className="flex justify-end pt-2">
                                        <button onClick={handleNext} className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg">
                                            <span>Continue</span>
                                            <ArrowRight size={15} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 font-mono text-amber-400 text-xs font-semibold tracking-wider uppercase">
                                        <span>STEP 02 // RELATIONSHIP</span>
                                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    </div>
                                    <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white">How are they related?</h2>
                                    <input
                                        type="text"
                                        placeholder="e.g. Daughter, Best Friend, Sister, Doctor"
                                        value={formData.relation}
                                        onChange={e => setFormData({ ...formData, relation: e.target.value })}
                                        onKeyDown={handleKeyDown}
                                        className="w-full bg-[#1f222a] border border-white/[0.08] focus:border-amber-400/60 rounded-2xl p-4 font-sans text-base text-white placeholder:text-slate-500 outline-none"
                                    />
                                    <div className="flex justify-between pt-2">
                                        <button onClick={() => setStep(0)} className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer">Back</button>
                                        <button onClick={handleNext} className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg">
                                            <span>Continue</span>
                                            <ArrowRight size={15} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 font-mono text-amber-400 text-xs font-semibold tracking-wider uppercase">
                                        <span>STEP 03 // PHOTO CAPTURE</span>
                                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    </div>
                                    <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white">Provide a Clear Face Photo</h2>
                                    {errorMessage && <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs">{errorMessage}</div>}

                                    {useLiveCamera ? (
                                        /* LIVE CAMERA VIEW */
                                        <div className="space-y-3">
                                            <div className="w-full rounded-2xl overflow-hidden border border-amber-500/40 bg-[#0a0f1d] shadow-[0_0_25px_rgba(245,158,11,0.2)]">
                                                <CameraView
                                                    isActive={true}
                                                    onCapture={handleCameraCapture}
                                                    buttonLabel="Snap Photo Now"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setUseLiveCamera(false)}
                                                className="w-full py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs text-slate-300 hover:text-white font-mono border border-white/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <span>✕ Cancel Camera</span>
                                            </button>
                                        </div>
                                    ) : filePreview ? (
                                        /* PREVIEW */
                                        <div className="relative w-full h-52 rounded-2xl bg-black border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center">
                                            <img src={filePreview} alt="Preview" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-full h-full object-cover" />
                                            <div className="absolute top-2 left-2 bg-black/70 text-emerald-300 text-[9px] font-mono px-2 py-0.5 rounded-md border border-emerald-500/40">PHOTO READY ✓</div>
                                            <button
                                                type="button"
                                                onClick={() => { setFile(null); setFilePreview(null); }}
                                                className="absolute bottom-2 right-2 px-3 py-1 bg-black/80 hover:bg-black text-slate-300 text-xs font-mono rounded-lg border border-white/20 cursor-pointer"
                                            >
                                                Change Photo
                                            </button>
                                        </div>
                                    ) : (
                                        /* UPLOAD OR CAMERA CHOICE */
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-[#1f222a] hover:bg-[#282c37] border border-white/[0.08] hover:border-amber-500/40 text-xs font-semibold text-center cursor-pointer transition-all">
                                                <UploadCloud size={24} className="text-amber-400" />
                                                <span className="text-white">Upload Image</span>
                                                <span className="text-slate-500 text-[10px]">JPG, PNG, WEBP</span>
                                                <input type="file" accept="image/*" onChange={e => {
                                                    if (e.target.files[0]) {
                                                        setFile(e.target.files[0]);
                                                        setFilePreview(URL.createObjectURL(e.target.files[0]));
                                                        setUseLiveCamera(false);
                                                    }
                                                }} hidden />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setUseLiveCamera(true)}
                                                className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl bg-[#1f222a] hover:bg-[#282c37] border border-white/[0.08] hover:border-amber-500/40 text-xs font-semibold text-center cursor-pointer transition-all"
                                            >
                                                <Camera size={24} className="text-amber-400" />
                                                <span className="text-white">Live Camera</span>
                                                <span className="text-slate-500 text-[10px]">Take a photo</span>
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-2">
                                        <button onClick={() => setStep(1)} className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer">Back</button>
                                        <button onClick={handleNext} disabled={!file} className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50">
                                            <span>Continue</span>
                                            <ArrowRight size={15} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 font-mono text-amber-400 text-xs font-semibold tracking-wider uppercase">
                                        <span>STEP 04 // MEMORIES &amp; VOICE SAMPLE</span>
                                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    </div>
                                    <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white">Memories &amp; Gentle Context</h2>

                                    {/* Error display */}
                                    {errorMessage && status === 'error' && (
                                        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
                                            <span className="shrink-0 mt-0.5">⚠️</span>
                                            <span>{errorMessage}</span>
                                        </div>
                                    )}

                                    {/* Success banner */}
                                    {status === 'success' && (
                                        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-3">
                                            <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />
                                            <div>
                                                <p className="font-semibold text-white">Memory Saved Successfully!</p>
                                                <p className="text-xs text-emerald-400 mt-0.5">{formData.name} has been stored in the Neural Memory Cortex.</p>
                                            </div>
                                        </div>
                                    )}

                                    <textarea
                                        className="w-full bg-[#1f222a] border border-white/[0.08] focus:border-amber-400/60 rounded-2xl p-4 font-sans text-xs text-white placeholder:text-slate-500 outline-none h-24 resize-none"
                                        placeholder="e.g. Loves gardening, brings fresh cookies on weekends, lives two streets away..."
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                    <div className="bg-[#1f222a] border border-white/[0.08] p-4 rounded-2xl flex items-center justify-between gap-3 text-xs">
                                        <span className="text-slate-300 shrink-0">Voice Note (Optional):</span>
                                        <AudioRecorder onRecordingComplete={setAudioBlob} />
                                    </div>

                                    <div className="flex justify-between pt-2">
                                        <button onClick={() => setStep(2)} disabled={status === 'submitting'} className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer disabled:opacity-40">Back</button>
                                        <button 
                                            onClick={handleSubmitMemory} 
                                            disabled={status === 'submitting' || status === 'success'}
                                            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-60 transition-all"
                                        >
                                            {status === 'submitting' ? (
                                                <>
                                                    <RefreshCw size={15} className="animate-spin" />
                                                    <span>Saving Memory...</span>
                                                </>
                                            ) : status === 'success' ? (
                                                <>
                                                    <CheckCircle2 size={15} />
                                                    <span>Memory Saved ✓</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Heart size={15} />
                                                    <span>Remember Loved One</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CaregiverDashboard;
