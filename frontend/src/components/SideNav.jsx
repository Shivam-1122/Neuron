import React from 'react';
import { Home, Users, Cpu, Brain, Sparkles, Gamepad2, Settings, Music, Volume2 } from 'lucide-react';
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
    return (
        <header className="fixed top-0 left-0 w-full h-[68px] bg-[#111318]/95 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.7)] flex items-center justify-between px-4 sm:px-8 z-50">
            
            {/* Logo & Cognitive Sanctuary Badge */}
            <div 
                className="flex items-center gap-3 cursor-pointer group select-none"
                onClick={() => onViewChange(currentUser ? 'patient' : 'landing')}
            >
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 group-hover:border-amber-400 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] p-1">
                    <img 
                        src={neuronLogoIcon} 
                        alt="Neuron Logo" 
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" 
                    />
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-lg tracking-tight text-white group-hover:text-amber-300 transition-colors">
                            NEURON
                        </span>
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 uppercase tracking-widest font-semibold">
                            SANCTUARY
                        </span>
                    </div>
                    <p className="font-sans text-[10px] text-slate-400 tracking-tight">Caring Memory Companion</p>
                </div>
            </div>

            {/* Navigation Links - Shown ONLY when user is logged in */}
            {currentUser ? (
                <nav className="hidden md:flex items-center gap-1.5 bg-[#181a20] p-1 rounded-xl border border-white/[0.06] shadow-inner">
                    {/* Assistant tab: Enabled for ALL users (Caregivers have access ONLY to Assistant) */}
                    <button
                        onClick={() => onViewChange('patient')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-sans text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                            currentView === 'patient'
                                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                        }`}
                    >
                        <Users size={14} className={currentView === 'patient' ? 'text-amber-400' : ''} />
                        <span>Assistant</span>
                    </button>

                    {/* Hide Memory Gym, Task Coach, and Caregiver portal for caregivers (Caregiver has ONLY Assistant) */}
                    {currentUser.role !== 'caregiver' && (
                        <>
                            <button
                                onClick={() => onViewChange('game')}
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
                                onClick={() => onViewChange('task_guide')}
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
                                onClick={() => onViewChange('caregiver')}
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
                <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-400 font-mono text-[11px]">
                    <Sparkles size={13} className="text-amber-400" />
                    <span>SECURE COGNITIVE SANCTUARY PROTOCOL</span>
                </div>
            )}

            {/* Right Action Controls */}
            <div className="flex items-center gap-2.5">
                {currentUser ? (
                    <>
                        <button
                            onClick={() => onOpenSettings && onOpenSettings('profile')}
                            className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl bg-[#181a20] hover:bg-[#22252c] border border-white/[0.08] hover:border-amber-400/40 transition-all cursor-pointer shadow-sm group"
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
                                <span className="block text-xs font-semibold text-white group-hover:text-amber-200 transition-colors leading-none truncate max-w-[100px]">
                                    {(currentUser.displayName || "Member").split(' ')[0]}
                                </span>
                                <span className="text-[9px] font-mono text-emerald-400 leading-none">
                                    {currentUser.role === 'caregiver' ? 'CAREGIVER' : 'SECURE'}
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => onOpenSettings && onOpenSettings('settings')}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#181a20] hover:bg-[#22252c] text-slate-300 hover:text-amber-300 border border-white/[0.06] hover:border-amber-400/40 transition-all cursor-pointer shadow-sm"
                            title="Open Settings"
                        >
                            <Settings size={17} />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => onViewChange('login')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-sans font-bold text-xs tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer transform hover:-translate-y-0.5 active:scale-95"
                    >
                        <span>SIGN IN</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default NavBar;
