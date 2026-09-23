import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    X, 
    Volume2, 
    VolumeX, 
    Music, 
    Sparkles, 
    Cpu, 
    UserPlus, 
    PackagePlus, 
    Camera, 
    Eye, 
    Package, 
    Check, 
    Shield,
    Pencil,
    Trash2,
    Database,
    AlertCircle,
    Save,
    RotateCcw,
    User,
    LogOut,
    ShieldAlert,
    CheckCircle2,
    KeyRound,
    Copy,
    Calendar,
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatImageSrc } from '../utils/imageUtils';

export default function SettingsModal({
    isOpen,
    onClose,
    isMusicPlaying,
    isMusicEnabled,
    onToggleMusic,
    soundFxEnabled,
    onToggleSoundFx,
    speechEnabled,
    onToggleSpeech,
    llmProvider,
    onToggleLLM,
    onScanFace,
    onScanObject,
    onEnrollPerson,
    onEnrollObject,
    onDataChanged,
    initialSection = 'profile',
    onLoggedOut
}) {
    const { currentUser, logout, deleteAccount } = useAuth();

    const [activeSection, setActiveSection] = useState(initialSection || 'profile'); // 'profile' | 'settings' | 'data'
    const [dataTab, setDataTab] = useState('people'); // 'people' | 'objects'
    const [storedPeople, setStoredPeople] = useState([]);
    const [storedObjects, setStoredObjects] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // { type, originalName, name, relation, notes, location }
    const [statusBanner, setStatusBanner] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Stored Item Delete Assurity Modal
    const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null); // { type: 'person' | 'object', name: string }
    const [isDeleting, setIsDeleting] = useState(false);

    // Logout Assurity Modal
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Delete Account Assurity Modal
    const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [copiedUid, setCopiedUid] = useState(false);

    const getFaceImageSrc = (img) => {
        return formatImageSrc(img);
    };

    const loadStoredData = async () => {
        setLoadingData(true);
        try {
            const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
            const uid = currentUser?.uid;
            const [pRes, oRes] = await Promise.all([
                axios.get(`${apiBase}/people`, { params: uid ? { user_id: uid } : {} }),
                axios.get(`${apiBase}/objects`, { params: uid ? { user_id: uid } : {} })
            ]);
            if (pRes.data && Array.isArray(pRes.data.people)) {
                setStoredPeople(pRes.data.people);
            }
            if (oRes.data && Array.isArray(oRes.data.objects)) {
                setStoredObjects(oRes.data.objects);
            }
        } catch (err) {
            console.error("Error loading stored data:", err);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            if (initialSection) {
                setActiveSection(initialSection);
            }
            loadStoredData();
            setEditingItem(null);
            setStatusBanner(null);
            setDeleteConfirmTarget(null);
            setShowLogoutConfirm(false);
            setShowDeleteAccountConfirm(false);
        }
    }, [isOpen, initialSection]);

    const showStatus = (type, text) => {
        setStatusBanner({ type, text });
        setTimeout(() => {
            setStatusBanner(null);
        }, 4500);
    };

    const executePermanentDelete = async () => {
        if (!deleteConfirmTarget || isDeleting) return;
        setIsDeleting(true);
        const { type, name } = deleteConfirmTarget;
        const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
        try {
            const endpoint = type === 'person' ? `${apiBase}/people` : `${apiBase}/objects`;
            const res = await axios.delete(endpoint, { 
                params: { 
                    name, 
                    user_id: currentUser?.uid 
                } 
            });
            if (res.data && res.data.status === 'error') {
                showStatus('error', res.data.message || `Failed to permanently delete "${name}".`);
            } else {
                showStatus('success', `Permanently deleted "${name}" from memory cortex.`);
                await loadStoredData();
                if (onDataChanged) onDataChanged();
            }
        } catch (e) {
            showStatus('error', `Failed to delete "${name}": ${e.response?.data?.detail || e.message}`);
        } finally {
            setIsDeleting(false);
            setDeleteConfirmTarget(null);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingItem || isSaving) return;
        setIsSaving(true);
        const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
        try {
            const endpoint = editingItem.type === 'person' ? `${apiBase}/people` : `${apiBase}/objects`;
            const payload = editingItem.type === 'person' ? {
                name: editingItem.name,
                relation: editingItem.relation,
                notes: editingItem.notes
            } : {
                name: editingItem.name,
                location: editingItem.location,
                notes: editingItem.notes
            };
            const res = await axios.put(endpoint, payload, { 
                params: { 
                    name: editingItem.originalName, 
                    user_id: currentUser?.uid 
                } 
            });
            if (res.data && res.data.status === 'error') {
                showStatus('error', res.data.message || `Failed to save "${editingItem.name}".`);
                return;
            }
            showStatus('success', `Saved changes to "${editingItem.name}".`);
            setEditingItem(null);
            await loadStoredData();
            if (onDataChanged) onDataChanged();
        } catch (e) {
            showStatus('error', `Failed to save changes: ${e.response?.data?.detail || e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExecuteLogout = () => {
        logout();
        setShowLogoutConfirm(false);
        onClose();
        if (onLoggedOut) onLoggedOut();
    };

    const handleExecuteDeleteAccount = async () => {
        setIsDeletingAccount(true);
        try {
            await deleteAccount();
            setShowDeleteAccountConfirm(false);
            onClose();
            if (onLoggedOut) onLoggedOut();
        } catch (err) {
            showStatus('error', err.message || "Failed to delete account.");
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleCopyUid = () => {
        if (currentUser?.uid) {
            navigator.clipboard.writeText(currentUser.uid);
            setCopiedUid(true);
            setTimeout(() => setCopiedUid(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
            <div 
                className="relative w-full max-w-xl rounded-2xl bg-[#16181e] border border-amber-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#111318]/80">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                            <Sparkles size={17} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white font-serif tracking-tight">Sanctuary Control Center</h2>
                            <p className="text-xs text-slate-400 font-sans">Settings, User Profile &amp; Memory Vault</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                        title="Close Settings"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Top Section Nav Tabs */}
                <div className="flex border-b border-white/[0.08] bg-[#14161b] px-6">
                    <button
                        onClick={() => { setActiveSection('profile'); setEditingItem(null); }}
                        className={`py-3 px-3 sm:px-4 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                            activeSection === 'profile'
                                ? 'border-amber-400 text-amber-300'
                                : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        <User size={14} />
                        <span>Profile &amp; Security</span>
                    </button>

                    <button
                        onClick={() => { setActiveSection('settings'); setEditingItem(null); }}
                        className={`py-3 px-3 sm:px-4 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                            activeSection === 'settings'
                                ? 'border-amber-400 text-amber-300'
                                : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        <Cpu size={14} />
                        <span>Preferences &amp; Audio</span>
                    </button>

                    <button
                        onClick={() => { setActiveSection('data'); setEditingItem(null); }}
                        className={`py-3 px-3 sm:px-4 text-xs font-mono font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                            activeSection === 'data'
                                ? 'border-amber-400 text-amber-300'
                                : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                    >
                        <Database size={14} />
                        <span>Vault ({storedPeople.length + storedObjects.length})</span>
                    </button>
                </div>

                {/* Status Notification Banner */}
                {statusBanner && (
                    <div className={`px-6 py-2.5 text-xs font-mono flex items-center gap-2 animate-fadeIn ${
                        statusBanner.type === 'success' 
                            ? 'bg-emerald-950/70 border-b border-emerald-500/30 text-emerald-200' 
                            : 'bg-rose-950/70 border-b border-rose-500/30 text-rose-200'
                    }`}>
                        {statusBanner.type === 'success' ? <Check size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-rose-400" />}
                        <span>{statusBanner.text}</span>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-200">
                    
                    {/* SECTION 0: PROFILE & SECURITY */}
                    {activeSection === 'profile' && (
                        <div className="space-y-6">
                            {/* Profile Overview Card */}
                            <div className="bg-[#1b1e24] p-5 rounded-2xl border border-white/[0.06] shadow-sm">
                                <div className="flex items-center gap-4">
                                    {/* Avatar Photo (Taken via Camera on Signup) */}
                                    {currentUser?.photoURL ? (
                                        <div className="relative w-16 h-16 shrink-0">
                                            <img 
                                                src={getFaceImageSrc(currentUser.photoURL)} 
                                                alt={currentUser.displayName || "User"} 
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    if (e.currentTarget.nextElementSibling) {
                                                        e.currentTarget.nextElementSibling.style.display = 'flex';
                                                    }
                                                }}
                                                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                                            />
                                            <div 
                                                style={{ display: 'none' }}
                                                className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 items-center justify-center text-amber-300 font-display text-2xl font-bold"
                                            >
                                                {(currentUser?.displayName || 'U')[0]?.toUpperCase()}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-300 font-display text-2xl font-bold shrink-0">
                                            {(currentUser?.displayName || 'U')[0]?.toUpperCase()}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-white tracking-tight truncate">
                                                {currentUser?.displayName || "Sanctuary Member"}
                                            </h3>
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active Session" />
                                        </div>
                                        <p className="text-xs text-slate-400 font-mono truncate">
                                            {currentUser?.email || "Sanctuary Member"}
                                        </p>
                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-[10px]">
                                            <ShieldCheck size={11} />
                                            <span>BIOMETRIC PROFILE ENROLLED</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Telemetry Badges */}
                                <div className="mt-5 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-3 text-xs">
                                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/[0.04]">
                                        <span className="text-[10px] font-mono text-slate-400 block mb-0.5">MEMBER SINCE</span>
                                        <span className="font-mono text-slate-200 text-xs">
                                            {currentUser?.createdAt || "Recent Registration"}
                                        </span>
                                    </div>

                                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/[0.04]">
                                        <span className="text-[10px] font-mono text-slate-400 block mb-0.5">SANCTUARY UID</span>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-slate-300 text-[11px] truncate max-w-[130px]">
                                                {currentUser?.uid || "Local Token"}
                                            </span>
                                            <button 
                                                onClick={handleCopyUid}
                                                className="text-slate-400 hover:text-amber-300 p-0.5"
                                                title="Copy UID"
                                            >
                                                {copiedUid ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Session Sign Out Button */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-wider text-slate-400">Session Management</label>
                                <button
                                    onClick={() => setShowLogoutConfirm(true)}
                                    className="w-full p-3.5 rounded-xl bg-[#1b1e24] hover:bg-[#22262e] border border-white/[0.08] hover:border-amber-400/40 text-amber-200 font-mono text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm"
                                >
                                    <LogOut size={16} className="text-amber-400" />
                                    <span>SIGN OUT OF SANCTUARY</span>
                                </button>
                            </div>

                            {/* Danger Zone: Permanent Account Deletion */}
                            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                                <div className="flex items-center gap-2 text-rose-300 font-mono text-xs font-bold">
                                    <ShieldAlert size={16} className="text-rose-400" />
                                    <span>DANGER ZONE // PERMANENT ACCOUNT DELETION</span>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Permanently wipe your account, biometric face profile, recognized objects, scheduled routines, and all semantic memories from the neural cortex.
                                </p>
                                <button
                                    onClick={() => setShowDeleteAccountConfirm(true)}
                                    className="px-4 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                                >
                                    <Trash2 size={14} />
                                    <span>DELETE ACCOUNT &amp; PURGE ALL MEMORIES</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SECTION 1: SETTINGS & PREFERENCES */}
                    {activeSection === 'settings' && (
                        <div className="space-y-6">
                            {/* Audio & Music Settings */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-400/90">
                                    <Music size={14} />
                                    <span>Audio &amp; Ambience</span>
                                </div>

                                <div className="space-y-2 bg-[#1b1e24] p-4 rounded-xl border border-white/[0.06]">
                                    {/* Background Music */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium text-white block">Calming Background Music</span>
                                            <span className="text-xs text-slate-400">Plays automatically in Memory Gym (muted permanently if turned off)</span>
                                        </div>
                                        <button
                                            onClick={onToggleMusic}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all border cursor-pointer flex items-center gap-1.5 ${
                                                isMusicPlaying || isMusicEnabled
                                                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                                                    : 'bg-white/[0.05] text-slate-400 border-white/[0.08] hover:bg-white/[0.1]'
                                            }`}
                                        >
                                            <Music size={13} />
                                            <span>{(isMusicPlaying || isMusicEnabled) ? 'ENABLED' : 'MUTED'}</span>
                                        </button>
                                    </div>

                                    <div className="w-full h-px bg-white/[0.05]" />

                                    {/* Sound Feedback */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium text-white block">Sound Effects</span>
                                            <span className="text-xs text-slate-400">Soft chimes when tapping or sending</span>
                                        </div>
                                        <button
                                            onClick={onToggleSoundFx}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all border cursor-pointer ${
                                                soundFxEnabled
                                                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                                                    : 'bg-white/[0.05] text-slate-400 border-white/[0.08]'
                                            }`}
                                        >
                                            {soundFxEnabled ? 'ENABLED' : 'MUTED'}
                                        </button>
                                    </div>

                                    <div className="w-full h-px bg-white/[0.05]" />

                                    {/* Voice Reading */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium text-white block">Voice Responses</span>
                                            <span className="text-xs text-slate-400">Read assistant messages aloud automatically</span>
                                        </div>
                                        <button
                                            onClick={onToggleSpeech}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all border cursor-pointer ${
                                                speechEnabled
                                                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                                                    : 'bg-white/[0.05] text-slate-400 border-white/[0.08]'
                                            }`}
                                        >
                                            {speechEnabled ? 'SPEAKING' : 'QUIET'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* AI Engine Provider */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-400/90">
                                    <Cpu size={14} />
                                    <span>AI Assistant Engine</span>
                                </div>

                                <div className="flex gap-2 bg-[#1b1e24] p-2 rounded-xl border border-white/[0.06]">
                                    <button
                                        onClick={() => onToggleLLM && onToggleLLM('groq')}
                                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                                            llmProvider === 'groq'
                                                ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                                : 'bg-transparent text-slate-400 border-transparent hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <Sparkles size={14} className={llmProvider === 'groq' ? 'text-amber-400' : ''} />
                                        <span>Groq (Instant Speed)</span>
                                    </button>

                                    <button
                                        onClick={() => onToggleLLM && onToggleLLM('gemini')}
                                        className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                                            llmProvider === 'gemini'
                                                ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                                : 'bg-transparent text-slate-400 border-transparent hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <Cpu size={14} className={llmProvider === 'gemini' ? 'text-amber-400' : ''} />
                                        <span>Gemini (Deep Memory)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Quick Actions Shortcuts */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-400/90">
                                        <Shield size={14} />
                                        <span>Quick Vision Shortcuts</span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-mono">Camera</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        onClick={() => { onClose(); onScanFace(); }}
                                        className="p-3 rounded-xl bg-[#1b1e24] hover:bg-[#232730] border border-white/[0.06] hover:border-amber-400/40 text-left transition-all cursor-pointer flex items-center gap-3 group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-300 flex items-center justify-center transition-colors">
                                            <Eye size={16} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-white block">Scan Face</span>
                                            <span className="text-[11px] text-slate-400">Recognize person</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { onClose(); onScanObject(); }}
                                        className="p-3 rounded-xl bg-[#1b1e24] hover:bg-[#232730] border border-white/[0.06] hover:border-amber-400/40 text-left transition-all cursor-pointer flex items-center gap-3 group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-300 flex items-center justify-center transition-colors">
                                            <Package size={16} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-white block">Scan Item</span>
                                            <span className="text-[11px] text-slate-400">Locate keys, glasses</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { onClose(); onEnrollPerson(); }}
                                        className="p-3 rounded-xl bg-[#1b1e24] hover:bg-[#232730] border border-white/[0.06] hover:border-amber-400/40 text-left transition-all cursor-pointer flex items-center gap-3 group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-300 flex items-center justify-center transition-colors">
                                            <UserPlus size={16} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-white block">Enroll Person</span>
                                            <span className="text-[11px] text-slate-400">Add family/caregiver</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { onClose(); onEnrollObject(); }}
                                        className="p-3 rounded-xl bg-[#1b1e24] hover:bg-[#232730] border border-white/[0.06] hover:border-amber-400/40 text-left transition-all cursor-pointer flex items-center gap-3 group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-300 flex items-center justify-center transition-colors">
                                            <PackagePlus size={16} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-white block">Enroll Object</span>
                                            <span className="text-[11px] text-slate-400">Store location</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: STORED DATA VAULT */}
                    {activeSection === 'data' && (
                        <div className="space-y-4">
                            {/* Inner Tab Selector (People vs Objects) */}
                            <div className="flex items-center justify-between bg-[#1b1e24] p-1.5 rounded-xl border border-white/[0.06]">
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => { setDataTab('people'); setEditingItem(null); }}
                                        className={`py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                            dataTab === 'people'
                                                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <User size={13} />
                                        <span>Enrolled People ({storedPeople.length})</span>
                                    </button>

                                    <button
                                        onClick={() => { setDataTab('objects'); setEditingItem(null); }}
                                        className={`py-1.5 px-3 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                            dataTab === 'objects'
                                                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <Package size={13} />
                                        <span>Enrolled Items ({storedObjects.length})</span>
                                    </button>
                                </div>

                                <button
                                    onClick={loadStoredData}
                                    className="p-1.5 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                                    title="Refresh Data"
                                >
                                    <RotateCcw size={14} className={loadingData ? "animate-spin text-amber-400" : ""} />
                                </button>
                            </div>

                            {/* INLINE EDIT FORM */}
                            {editingItem && (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-3 animate-fadeIn">
                                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300">
                                            <Pencil size={13} />
                                            <span>Editing: {editingItem.originalName}</span>
                                        </div>
                                        <button 
                                            onClick={() => setEditingItem(null)}
                                            className="text-xs text-slate-400 hover:text-white cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    <div className="space-y-2.5 text-xs">
                                        <div>
                                            <label className="block text-[11px] font-mono text-slate-300 mb-1">Name / Title</label>
                                            <input
                                                type="text"
                                                value={editingItem.name}
                                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                className="w-full px-3 py-1.5 bg-[#14161b] border border-white/[0.1] rounded-lg text-white font-medium focus:border-amber-400 outline-none"
                                            />
                                        </div>

                                        {editingItem.type === 'person' ? (
                                            <div>
                                                <label className="block text-[11px] font-mono text-slate-300 mb-1">Relationship</label>
                                                <input
                                                    type="text"
                                                    value={editingItem.relation || ''}
                                                    onChange={(e) => setEditingItem({ ...editingItem, relation: e.target.value })}
                                                    placeholder="e.g. Daughter, Caregiver, Doctor"
                                                    className="w-full px-3 py-1.5 bg-[#14161b] border border-white/[0.1] rounded-lg text-white focus:border-amber-400 outline-none"
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-[11px] font-mono text-slate-300 mb-1">Item Location</label>
                                                <input
                                                    type="text"
                                                    value={editingItem.location || ''}
                                                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                                                    placeholder="e.g. Top bedside drawer, Kitchen counter"
                                                    className="w-full px-3 py-1.5 bg-[#14161b] border border-white/[0.1] rounded-lg text-white focus:border-amber-400 outline-none"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-[11px] font-mono text-slate-300 mb-1">Notes &amp; Context</label>
                                            <textarea
                                                rows={2}
                                                value={editingItem.notes || ''}
                                                onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                                                placeholder="Key memory triggers, context, or instructions..."
                                                className="w-full px-3 py-1.5 bg-[#14161b] border border-white/[0.1] rounded-lg text-white focus:border-amber-400 outline-none resize-none"
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                disabled={isSaving}
                                                onClick={() => setEditingItem(null)}
                                                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isSaving}
                                                onClick={handleSaveEdit}
                                                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer disabled:opacity-60"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <RotateCcw size={13} className="animate-spin" />
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save size={13} />
                                                        <span>Save Changes</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* LIST OF STORED ITEMS */}
                            {loadingData ? (
                                <div className="py-8 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
                                    <RotateCcw size={14} className="animate-spin text-amber-400" />
                                    <span>Querying Neural Vector Store...</span>
                                </div>
                            ) : dataTab === 'people' ? (
                                storedPeople.length === 0 ? (
                                    <div className="py-10 text-center text-xs font-mono text-slate-500 bg-[#14161b] rounded-xl border border-white/[0.04]">
                                        No registered people in your memory vault yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {storedPeople.map((person) => {
                                            const photoSrc = getFaceImageSrc(person.avatar || person.image || person.image_base64);
                                            return (
                                                <div 
                                                    key={person.name} 
                                                    className="p-3 rounded-xl bg-[#1b1e24] border border-white/[0.06] hover:border-amber-400/30 flex items-center justify-between gap-3 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        {photoSrc ? (
                                                            <div className="relative w-10 h-10 shrink-0">
                                                                <img 
                                                                    src={photoSrc} 
                                                                    alt={person.name} 
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        if (e.currentTarget.nextElementSibling) {
                                                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                        }
                                                                    }}
                                                                    className="w-10 h-10 rounded-xl object-cover border border-amber-500/30" 
                                                                />
                                                                <div 
                                                                    style={{ display: 'none' }}
                                                                    className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 items-center justify-center font-bold text-xs"
                                                                >
                                                                    {(person.name || 'P')[0]?.toUpperCase()}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                                                                <User size={18} />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-white text-xs truncate">{person.name}</span>
                                                                {person.relation && (
                                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                                                                        {person.relation}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {person.notes && (
                                                                <p className="text-[11px] text-slate-400 truncate max-w-xs">{person.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                            onClick={() => setEditingItem({
                                                                type: 'person',
                                                                originalName: person.name,
                                                                name: person.name,
                                                                relation: person.relation || '',
                                                                notes: person.notes || ''
                                                            })}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                                                            title="Edit Details"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirmTarget({ type: 'person', name: person.name })}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                            title="Delete Permanently"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            ) : (
                                storedObjects.length === 0 ? (
                                    <div className="py-10 text-center text-xs font-mono text-slate-500 bg-[#14161b] rounded-xl border border-white/[0.04]">
                                        No registered objects in your memory vault yet.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {storedObjects.map((obj) => (
                                            <div 
                                                key={obj.name} 
                                                className="p-3 rounded-xl bg-[#1b1e24] border border-white/[0.06] hover:border-amber-400/30 flex items-center justify-between gap-3 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                                                        <Package size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-white text-xs truncate">{obj.name}</span>
                                                            {obj.location && (
                                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shrink-0">
                                                                    📍 {obj.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {obj.notes && (
                                                            <p className="text-[11px] text-slate-400 truncate max-w-xs">{obj.notes}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <button
                                                        onClick={() => setEditingItem({
                                                            type: 'object',
                                                            originalName: obj.name,
                                                            name: obj.name,
                                                            location: obj.location || '',
                                                            notes: obj.notes || ''
                                                        })}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                                                        title="Edit Location/Notes"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmTarget({ type: 'object', name: obj.name })}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                        title="Delete Permanently"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#111318]/90 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-slate-500">
                        {activeSection === 'profile' ? "USER IDENTIFIER & ACCESS" : activeSection === 'settings' ? "SYSTEM CONFIGURATION" : "QDRANT NEURAL ARCHIVE"}
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                    >
                        Done
                    </button>
                </div>
            </div>

            {/* MODAL 1: PERMANENT ITEM DELETE RE-VERIFY ASSURITY */}
            {deleteConfirmTarget && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="relative w-full max-w-sm rounded-2xl bg-[#181a20] border-2 border-rose-500/40 p-5 shadow-[0_10px_40px_rgba(225,29,72,0.3)] space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                                <Trash2 size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-semibold text-white font-serif tracking-tight">
                                    Permanently Delete {deleteConfirmTarget.type === 'person' ? 'Person' : 'Object'}?
                                </h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Do you want to permanently delete <span className="font-semibold text-rose-300 font-mono">"{deleteConfirmTarget.name}"</span> from the memory cortex?
                                </p>
                                <p className="text-[11px] text-rose-400/80 font-mono">
                                    ⚠️ This action cannot be undone and will erase this data permanently.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeleteConfirmTarget(null)}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={executePermanentDelete}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white font-semibold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all cursor-pointer"
                            >
                                {isDeleting ? (
                                    <>
                                        <RotateCcw size={14} className="animate-spin" />
                                        <span>Erasing Memory...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={14} />
                                        <span>Yes, Delete Permanently</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: LOGOUT ASSURITY CONFIRMATION */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="relative w-full max-w-sm rounded-2xl bg-[#181a20] border-2 border-amber-500/40 p-5 shadow-[0_10px_40px_rgba(245,158,11,0.25)] space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                                <LogOut size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-semibold text-white font-serif tracking-tight">
                                    Sign Out of Cognitive Sanctuary?
                                </h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Are you sure you want to log out? You will need to sign back in with your password or biometric face scan to access your memories.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/[0.08] transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleExecuteLogout}
                                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                            >
                                <LogOut size={14} />
                                <span>Yes, Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: DELETE ACCOUNT ASSURITY CONFIRMATION */}
            {showDeleteAccountConfirm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
                    <div className="relative w-full max-w-md rounded-2xl bg-[#181a20] border-2 border-rose-500/60 p-6 shadow-[0_10px_50px_rgba(225,29,72,0.4)] space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0">
                                <ShieldAlert size={26} />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-lg font-bold text-white font-serif tracking-tight">
                                    Permanently Delete Account &amp; Wipe Memories?
                                </h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Are you absolutely sure? This action is <span className="font-bold text-rose-400">IRREVERSIBLE</span>.
                                </p>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 space-y-1">
                            <p className="font-semibold">The following data will be permanently wiped:</p>
                            <ul className="list-disc list-inside text-[11px] text-rose-300/90 space-y-0.5">
                                <li>All enrolled faces, loved ones &amp; relations in Qdrant</li>
                                <li>All recognized items and object location memories</li>
                                <li>All scheduled gentle anchors and daily routines</li>
                                <li>Your biometric neural face profile and authentication account</li>
                            </ul>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                            <button
                                type="button"
                                disabled={isDeletingAccount}
                                onClick={() => setShowDeleteAccountConfirm(false)}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancel / Keep Account
                            </button>
                            <button
                                type="button"
                                disabled={isDeletingAccount}
                                onClick={handleExecuteDeleteAccount}
                                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.5)] transition-all cursor-pointer"
                            >
                                {isDeletingAccount ? (
                                    <>
                                        <RotateCcw size={14} className="animate-spin" />
                                        <span>Purging All Data...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={14} />
                                        <span>Yes, Delete Everything</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
