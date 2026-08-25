import React from 'react';
import { Home, Users, Cpu, Brain, Activity, ShieldCheck, Sparkles } from 'lucide-react';

const NavBar = ({ onViewChange, currentView }) => {
    return (
        <header className="fixed top-0 left-0 w-full h-[70px] bg-[#060a12]/90 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.8)] flex items-center justify-between px-6 md:px-10 z-50">
            {/* Holographic Logo */}
            <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => onViewChange('landing')}
            >
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 group-hover:border-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
                    <Brain size={22} className="text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                    </span>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-display font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 group-hover:from-cyan-300 group-hover:to-purple-300 transition-all">
                            NEURON
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest font-semibold">
                            CORTEX v2.6
                        </span>
                    </div>
                    <p className="font-mono text-[10px] text-slate-400 tracking-tight">NEURAL MEMORY PROTOCOL</p>
                </div>
            </div>

            {/* Live Telemetry Pill */}
            <div className="hidden lg:flex items-center gap-4 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-emerald-400">
                    <Activity size={13} className="animate-pulse" />
                    <span>SYS.ONLINE</span>
                </div>
                <div className="w-px h-3 bg-slate-700"></div>
                <div className="flex items-center gap-1.5 text-cyan-400">
                    <Cpu size={13} />
                    <span>QDRANT: SYNCED</span>
                </div>
                <div className="w-px h-3 bg-slate-700"></div>
                <div className="flex items-center gap-1 text-purple-400">
                    <ShieldCheck size={13} />
                    <span>GROQ: READY</span>
                </div>
            </div>

            {/* Navigation Nodes */}
            <nav className="flex items-center gap-2">
                <button
                    onClick={() => onViewChange('landing')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all duration-300 border cursor-pointer ${
                        currentView === 'landing'
                            ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                >
                    <Home size={15} />
                    <span>OVERVIEW</span>
                </button>

                <button
                    onClick={() => onViewChange('patient')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all duration-300 border cursor-pointer ${
                        currentView === 'patient'
                            ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(0,255,157,0.25)]'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                >
                    <Users size={15} />
                    <span>PATIENT CORTEX</span>
                </button>

                <button
                    onClick={() => onViewChange('task_guide')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all duration-300 border cursor-pointer ${
                        currentView === 'task_guide'
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_20px_rgba(0,240,255,0.35)]'
                            : 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-900/40 hover:border-cyan-400'
                    }`}
                >
                    <Sparkles size={15} className="text-cyan-400" />
                    <span>TASK GUIDE</span>
                </button>

                <button
                    onClick={() => onViewChange('caregiver')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold tracking-wider transition-all duration-300 border cursor-pointer ${
                        currentView === 'caregiver'
                            ? 'bg-purple-500/15 border-purple-500/60 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                >
                    <Cpu size={15} />
                    <span>CAREGIVER ARCHITECT</span>
                </button>
            </nav>
        </header>
    );
};

export default NavBar;
