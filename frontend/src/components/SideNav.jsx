import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Cpu, 
    Sparkles, 
    Gamepad2, 
    Settings, 
    Music, 
    Volume2, 
    VolumeX,
    Menu, 
    X, 
    Home, 
    ShieldCheck, 
    ChevronRight,
    LogIn,
    Radio
} from 'lucide-react';
import neuronLogoIcon from '../assets/neuron-logo-icon.png';
import { formatImageSrc } from '../utils/imageUtils';

const NavBar = ({ 
    onViewChange, 
    currentView, 
    onOpenSettings,
    isMusicPlaying,
    onToggleMusic,
    currentUser
}) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Close drawer when pressing Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsDrawerOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close drawer automatically if viewport resized to desktop (>= 1024px)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsDrawerOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent background scrolling when drawer is open
    useEffect(() => {
        if (isDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isDrawerOpen]);

    const handleTabClick = (viewName) => {
        setIsDrawerOpen(false);
        if (onViewChange) {
            onViewChange(viewName);
        }
    };

    return (
        <>
            {/* ========================================================================= */}
            {/* TOP NAVBAR                                                                */}
            {/* ========================================================================= */}
            <header className="fixed top-0 left-0 w-full h-[60px] sm:h-[68px] bg-[#111318]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.7)] flex items-center justify-between px-3 sm:px-6 lg:px-8 z-40 transition-all duration-300">
                
                {/* Left: Brand Logo & Sanctuary Badge */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                    {/* Mobile Hamburger Drawer Trigger (Shown only when screen width decreases) */}
                    <button
                        type="button"
                        onClick={() => setIsDrawerOpen(true)}
                        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-[#181a20] hover:bg-[#22252c] text-slate-300 hover:text-amber-300 border border-white/[0.08] hover:border-amber-400/40 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                        title="Open navigation menu"
                        aria-label="Open menu drawer"
                    >
                        <Menu size={19} className="text-amber-400" />
                    </button>

                    <div 
                        className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none"
                        onClick={() => handleTabClick(currentUser ? 'patient' : 'landing')}
                    >
                        <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 group-hover:border-amber-400 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] p-1 shrink-0">
                            <img 
                                src={neuronLogoIcon} 
                                alt="Neuron Logo" 
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
                            />
                            <span className="absolute -top-1 -right-1 flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-full w-full bg-amber-500"></span>
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-amber-300 transition-colors">
                                    NEURON
                                </span>
                                <span className="font-mono text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 uppercase tracking-widest font-semibold">
                                    SANCTUARY
                                </span>
                            </div>
                            <p className="hidden xs:block font-sans text-[9px] sm:text-[10px] text-slate-400 tracking-tight leading-tight">
                                Caring Memory Companion
                            </p>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* DESKTOP TABS (Shown on wide screens; moved to drawer when width decreases)*/}
                {/* ========================================================================= */}
                {currentUser ? (
                    <nav className="hidden lg:flex items-center gap-1.5 bg-[#181a20] p-1 rounded-xl border border-white/[0.06] shadow-inner">
                        {/* Assistant tab: Enabled for ALL users (Caregivers have access ONLY to Assistant) */}
                        <button
                            type="button"
                            onClick={() => handleTabClick('patient')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-sans text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                                currentView === 'patient'
                                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                            }`}
                        >
                            <Users size={14} className={currentView === 'patient' ? 'text-amber-400' : ''} />
                            <span>Assistant</span>
                        </button>

                        {/* Hide Memory Gym, Task Coach, and Caregiver portal for caregivers */}
                        {currentUser.role !== 'caregiver' && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleTabClick('game')}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-sans text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                                        currentView === 'game'
                                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <Gamepad2 size={14} className={currentView === 'game' ? 'text-amber-400' : ''} />
                                    <span>Memory Gym</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleTabClick('task_guide')}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-sans text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                                        currentView === 'task_guide'
                                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <Sparkles size={14} className={currentView === 'task_guide' ? 'text-amber-400' : ''} />
                                    <span>Task Coach</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleTabClick('caregiver')}
                                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-sans text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                                        currentView === 'caregiver'
                                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    <Cpu size={14} className={currentView === 'caregiver' ? 'text-amber-400' : ''} />
                                    <span>Caregiver</span>
                                </button>
                            </>
                        )}
                    </nav>
                ) : (
                    <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-400 font-mono text-[11px]">
                        <Sparkles size={13} className="text-amber-400" />
                        <span>SECURE COGNITIVE SANCTUARY PROTOCOL</span>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* RIGHT ACTION CONTROLS (Settings stays directly on navbar on ALL sizes)     */}
                {/* ========================================================================= */}
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                    {currentUser ? (
                        <>
                            {/* User Profile / Status Chip */}
                            <button
                                type="button"
                                onClick={() => onOpenSettings && onOpenSettings('profile')}
                                className="flex items-center gap-2 pl-1.5 pr-2 sm:pr-3 py-1 rounded-xl bg-[#181a20] hover:bg-[#22252c] border border-white/[0.08] hover:border-amber-400/40 transition-all cursor-pointer shadow-sm group"
                                title="View Profile & Security"
                            >
                                {currentUser.photoURL ? (
                                    <div className="relative w-7 h-7 shrink-0">
                                        <img
                                            src={formatImageSrc(currentUser.photoURL)}
                                            alt={currentUser.displayName}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                if (e.currentTarget.nextElementSibling) {
                                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                                }
                                            }}
                                            className="w-7 h-7 rounded-lg object-cover border border-amber-500/40"
                                        />
                                        <div 
                                            style={{ display: 'none' }}
                                            className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs items-center justify-center"
                                        >
                                            {(currentUser.displayName || 'U')[0].toUpperCase()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                                        {(currentUser.displayName || 'U')[0].toUpperCase()}
                                    </div>
                                )}
                                <div className="text-left hidden sm:block">
                                    <span className="block text-xs font-semibold text-white group-hover:text-amber-200 transition-colors leading-none truncate max-w-[90px]">
                                        {(currentUser.displayName || "Member").split(' ')[0]}
                                    </span>
                                    <span className="text-[9px] font-mono text-emerald-400 leading-none">
                                        {currentUser.role === 'caregiver' ? 'CAREGIVER' : 'SECURE'}
                                    </span>
                                </div>
                            </button>

                            {/* SETTINGS BUTTON: STAYS ON NAVBAR AT ALL TIMES AS SPECIFIED */}
                            <button
                                type="button"
                                onClick={() => onOpenSettings && onOpenSettings('settings')}
                                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#181a20] hover:bg-[#22252c] text-slate-300 hover:text-amber-300 border border-white/[0.06] hover:border-amber-400/40 transition-all cursor-pointer shadow-sm active:scale-95"
                                title="Open Settings"
                                aria-label="Open Settings"
                            >
                                <Settings size={17} className="hover:rotate-45 transition-transform duration-300" />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleTabClick('login')}
                                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-sans font-bold text-xs tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer transform hover:-translate-y-0.5 active:scale-95"
                            >
                                <LogIn size={13} />
                                <span>SIGN IN</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* ========================================================================= */}
            {/* RESPONSIVE NAVIGATION DRAWER (Activated when width decreases)             */}
            {/* ========================================================================= */}
            {isDrawerOpen && (
                <div 
                    className="fixed inset-0 z-50 flex animate-drawer-fade"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Navigation Drawer"
                >
                    {/* Backdrop Overlay with blur */}
                    <div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsDrawerOpen(false)}
                    />

                    {/* Sliding Drawer Container */}
                    <div 
                        className="relative w-[300px] sm:w-[340px] max-w-[85vw] h-full bg-[#13151b] border-r border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden z-10 animate-drawer-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#111318]/90 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/40 p-1 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                                    <img 
                                        src={neuronLogoIcon} 
                                        alt="Neuron" 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-sm tracking-wide text-white">NEURON MENU</h3>
                                    <span className="font-mono text-[9px] text-amber-400">COGNITIVE SANCTUARY</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsDrawerOpen(false)}
                                className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                                title="Close Drawer"
                                aria-label="Close Drawer"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {/* Drawer User Status Summary (if logged in) */}
                        {currentUser && (
                            <div className="px-4 py-3 mx-3 mt-3 rounded-2xl bg-[#181a22] border border-white/[0.06] flex items-center gap-3">
                                {currentUser.photoURL ? (
                                    <img
                                        src={formatImageSrc(currentUser.photoURL)}
                                        alt={currentUser.displayName}
                                        className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-sm flex items-center justify-center shrink-0 border border-amber-500/30">
                                        {(currentUser.displayName || 'U')[0].toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <span className="block text-xs font-semibold text-white truncate">
                                        {currentUser.displayName || "Sanctuary Member"}
                                    </span>
                                    <span className="text-[10px] font-mono text-emerald-400 block truncate">
                                        {currentUser.role === 'caregiver' ? 'CAREGIVER PORTAL' : 'SANCTUARY ACTIVE'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDrawerOpen(false);
                                        if (onOpenSettings) onOpenSettings('profile');
                                    }}
                                    className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30 transition-all cursor-pointer"
                                >
                                    Profile
                                </button>
                            </div>
                        )}

                        {/* Drawer Scrollable Navigation Tabs List */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5">
                            <div className="px-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
                                <span>NAVIGATION MODULES</span>
                                <span className="text-[9px] text-amber-400">TOUCH TO SWITCH</span>
                            </div>

                            {currentUser ? (
                                <>
                                    {/* 1. Assistant Tab */}
                                    <button
                                        type="button"
                                        onClick={() => handleTabClick('patient')}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left group ${
                                            currentView === 'patient'
                                                ? 'bg-amber-500/20 border border-amber-500/50 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                                : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                            currentView === 'patient' 
                                                ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50' 
                                                : 'bg-white/[0.05] text-slate-400'
                                        }`}>
                                            <Users size={17} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-semibold ${currentView === 'patient' ? 'text-amber-200' : 'text-slate-200'}`}>
                                                    Assistant
                                                </span>
                                                {currentView === 'patient' && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 truncate">
                                                Caring memory companion &amp; chat
                                            </p>
                                        </div>
                                        <ChevronRight size={14} className={currentView === 'patient' ? 'text-amber-400' : 'text-slate-600'} />
                                    </button>

                                    {/* Tabs for non-caregiver users */}
                                    {currentUser.role !== 'caregiver' && (
                                        <>
                                            {/* 2. Memory Gym */}
                                            <button
                                                type="button"
                                                onClick={() => handleTabClick('game')}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left group ${
                                                    currentView === 'game'
                                                        ? 'bg-amber-500/20 border border-amber-500/50 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                                        : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-slate-300 hover:text-white'
                                                }`}
                                            >
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                                    currentView === 'game' 
                                                        ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50' 
                                                        : 'bg-white/[0.05] text-slate-400'
                                                }`}>
                                                    <Gamepad2 size={17} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-xs font-semibold ${currentView === 'game' ? 'text-amber-200' : 'text-slate-200'}`}>
                                                            Memory Gym
                                                        </span>
                                                        {currentView === 'game' && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 truncate">
                                                        Brain exercises &amp; calming puzzles
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} className={currentView === 'game' ? 'text-amber-400' : 'text-slate-600'} />
                                            </button>

                                            {/* 3. Task Coach */}
                                            <button
                                                type="button"
                                                onClick={() => handleTabClick('task_guide')}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left group ${
                                                    currentView === 'task_guide'
                                                        ? 'bg-amber-500/20 border border-amber-500/50 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                                        : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-slate-300 hover:text-white'
                                                }`}
                                            >
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                                    currentView === 'task_guide' 
                                                        ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50' 
                                                        : 'bg-white/[0.05] text-slate-400'
                                                }`}>
                                                    <Sparkles size={17} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-xs font-semibold ${currentView === 'task_guide' ? 'text-amber-200' : 'text-slate-200'}`}>
                                                            Task Coach
                                                        </span>
                                                        {currentView === 'task_guide' && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 truncate">
                                                        Guided routine activities &amp; steps
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} className={currentView === 'task_guide' ? 'text-amber-400' : 'text-slate-600'} />
                                            </button>

                                            {/* 4. Caregiver Portal */}
                                            <button
                                                type="button"
                                                onClick={() => handleTabClick('caregiver')}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left group ${
                                                    currentView === 'caregiver'
                                                        ? 'bg-amber-500/20 border border-amber-500/50 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                                        : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-slate-300 hover:text-white'
                                                }`}
                                            >
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                                    currentView === 'caregiver' 
                                                        ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50' 
                                                        : 'bg-white/[0.05] text-slate-400'
                                                }`}>
                                                    <Cpu size={17} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-xs font-semibold ${currentView === 'caregiver' ? 'text-amber-200' : 'text-slate-200'}`}>
                                                            Caregiver
                                                        </span>
                                                        {currentView === 'caregiver' && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 truncate">
                                                        Caregiver team &amp; memory cortex
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} className={currentView === 'caregiver' ? 'text-amber-400' : 'text-slate-600'} />
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Logged Out View Tabs in Drawer */}
                                    <button
                                        type="button"
                                        onClick={() => handleTabClick('landing')}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left group ${
                                            currentView === 'landing'
                                                ? 'bg-amber-500/20 border border-amber-500/50 text-white'
                                                : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-slate-300'
                                        }`}
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                                            <Home size={17} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-semibold text-slate-200">Sanctuary Home</span>
                                            <p className="text-[10px] text-slate-400 truncate">Introduction &amp; Overview</p>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-600" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleTabClick('login')}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer text-left group ${
                                            currentView === 'login'
                                                ? 'bg-amber-500/20 border border-amber-500/50 text-white'
                                                : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-slate-300'
                                        }`}
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                                            <LogIn size={17} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-semibold text-slate-200">Sign In / Register</span>
                                            <p className="text-[10px] text-slate-400 truncate">Access your personal memory cortex</p>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-600" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Drawer Footer Controls */}
                        <div className="p-4 border-t border-white/[0.08] bg-[#111318]/90 space-y-2.5">
                            {/* Ambient Music / Soundscape Quick Toggle */}
                            <button
                                type="button"
                                onClick={onToggleMusic}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                                    isMusicPlaying
                                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                        : 'bg-[#181a20] border-white/[0.06] text-slate-400 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {isMusicPlaying ? <Volume2 size={15} className="text-amber-400 animate-pulse" /> : <VolumeX size={15} />}
                                    <span>CALM SOUNDSCAPE</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isMusicPlaying ? 'bg-amber-500/30 text-amber-200' : 'bg-white/[0.05] text-slate-400'}`}>
                                    {isMusicPlaying ? 'PLAYING' : 'MUTED'}
                                </span>
                            </button>

                            {/* Settings Link inside Drawer (in addition to the permanent navbar button) */}
                            {currentUser && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDrawerOpen(false);
                                        if (onOpenSettings) onOpenSettings('settings');
                                    }}
                                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#181a20] hover:bg-[#20232c] border border-white/[0.06] text-slate-300 hover:text-white text-xs font-sans transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <Settings size={15} className="text-amber-400" />
                                        <span>Sanctuary Preferences</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500">Configure</span>
                                </button>
                            )}

                            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                                <span>SECURE v2.1 • 432Hz</span>
                                <span className="flex items-center gap-1 text-emerald-400">
                                    <ShieldCheck size={12} />
                                    <span>PROTECTED</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NavBar;
