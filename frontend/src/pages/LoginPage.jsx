import React from 'react';
import { User, HeartHandshake, ShieldCheck, Terminal, Cpu, ArrowRight } from 'lucide-react';

const LoginPage = ({ onSelectRole }) => {
    return (
        <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col items-center justify-center relative overflow-hidden cyber-grid-bg p-6">
            {/* Ambient Background Glows */}
            <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Header Telemetry */}
            <div className="relative z-10 text-center mb-12 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono text-xs shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                    <Terminal size={13} />
                    <span>AUTHENTICATION GATEWAY // SELECT OPERATOR</span>
                </div>
                <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
                    Access Neural Protocol
                </h1>
                <p className="font-mono text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                    Choose your operating mode to interact with the patient memory bank.
                </p>
            </div>

            {/* Role Cards Matrix */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Patient Role Card */}
                <div
                    onClick={() => onSelectRole('patient')}
                    className="group relative bg-[#0c1322]/90 border border-cyan-500/30 hover:border-cyan-400 p-8 rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-2 shadow-[0_0_30px_rgba(0,0,0,0.8)] hover:shadow-[0_0_35px_rgba(0,240,255,0.25)] flex flex-col justify-between tech-bracket overflow-hidden"
                >
                    <div className="scan-line"></div>
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all">
                                <User size={30} />
                            </div>
                            <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                                PROTOCOL 01
                            </span>
                        </div>
                        <h2 className="font-display text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                            Patient / User Core
                        </h2>
                        <p className="font-mono text-xs text-slate-400 leading-relaxed mb-6">
                            Engage interactive memory assistant, optical face & object scanner, and vocal conversation cortex.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-400 group-hover:text-cyan-300 flex items-center gap-2">
                            LAUNCH ASSISTANT <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                    </div>
                </div>

                {/* Caregiver Role Card */}
                <div
                    onClick={() => onSelectRole('caregiver')}
                    className="group relative bg-[#0c1322]/90 border border-purple-500/30 hover:border-purple-400 p-8 rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-2 shadow-[0_0_30px_rgba(0,0,0,0.8)] hover:shadow-[0_0_35px_rgba(168,85,247,0.25)] flex flex-col justify-between tech-bracket overflow-hidden"
                >
                    <div className="scan-line"></div>
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all">
                                <HeartHandshake size={30} />
                            </div>
                            <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30">
                                PROTOCOL 02
                            </span>
                        </div>
                        <h2 className="font-display text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                            Caregiver Architect
                        </h2>
                        <p className="font-mono text-xs text-slate-400 leading-relaxed mb-6">
                            Enroll family identities, configure audio voice signatures, update object locations, and monitor health context.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-purple-400 group-hover:text-purple-300 flex items-center gap-2">
                            OPEN ARCHITECT HUB <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
