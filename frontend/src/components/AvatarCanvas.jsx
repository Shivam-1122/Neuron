import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Sparkles, Volume2, Cpu, Eye } from 'lucide-react';

const AvatarCanvas = ({ isSpeaking, isProcessing, message, processingStatus }) => {
    const avatarSrc = isSpeaking
        ? "/assets/speaking.gif"
        : "/assets/idle.gif";

    return (
        <div className="flex flex-col justify-between items-center h-full w-full bg-[#080d18] relative overflow-hidden border-r border-cyan-500/20 p-6 select-none cyber-dots-bg">
            {/* Ambient Hologram Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-slate-950/40 to-cyan-950/30 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            {/* Top HUD Telemetry Bar */}
            <div className="w-full flex items-center justify-between z-10 font-mono text-[11px] text-slate-400 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-xl border border-cyan-500/20">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span className="text-cyan-300 font-semibold uppercase tracking-wider">HOLO-PROJECTION CORTEX</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                    <span className="hidden sm:inline">FPS: 60</span>
                    <span>RES: 512-D</span>
                </div>
            </div>

            {/* Main Holographic Projection Chamber */}
            <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full my-4">
                {/* Sci-Fi Target Reticle Circles */}
                <div className="absolute w-72 h-72 rounded-full border border-cyan-500/20 border-dashed animate-[spin_30s_linear_infinite] pointer-events-none" />
                <div className="absolute w-84 h-84 rounded-full border border-purple-500/15 animate-[spin_45s_linear_infinite_reverse] pointer-events-none" />
                
                {/* Corner HUD Brackets */}
                <div className="absolute w-72 h-72 pointer-events-none">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400/80"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400/80"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400/80"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400/80"></div>
                </div>

                {/* Avatar Hologram */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                    <img
                        src={avatarSrc}
                        alt="Holographic Avatar"
                        className="max-h-full object-contain filter drop-shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all duration-500"
                    />
                    {/* Live Scan Line */}
                    <div className="scan-line"></div>
                </div>

                {/* Sci-Fi Frequency Equalizer Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-6 mt-3">
                    {[40, 70, 30, 90, 50, 80, 45, 65, 35, 85, 55, 75, 40].map((h, i) => (
                        <div
                            key={i}
                            className={`w-1 rounded-full transition-all duration-150 ${
                                isSpeaking
                                    ? 'bg-gradient-to-t from-emerald-500 to-cyan-400 animate-pulse'
                                    : isProcessing
                                    ? 'bg-gradient-to-t from-purple-600 to-cyan-400 animate-pulse'
                                    : 'bg-cyan-900/50'
                            }`}
                            style={{
                                height: isSpeaking
                                    ? `${Math.max(20, (h * (i % 2 === 0 ? 1 : 0.7)))}%`
                                    : isProcessing
                                    ? `${Math.max(15, (h * 0.4))}%`
                                    : '15%',
                                animationDelay: `${i * 0.08}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Dynamic Status / Caption Area */}
            <div className="relative w-full flex flex-col items-center space-y-3 z-10">
                {/* Status Badge */}
                {isSpeaking ? (
                    <div className="px-4 py-1.5 bg-emerald-950/80 border border-emerald-500/50 rounded-full shadow-[0_0_15px_rgba(0,255,157,0.3)] flex items-center gap-2 font-mono">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                        <Volume2 size={13} className="text-emerald-400" />
                        <span className="text-emerald-300 text-xs font-bold tracking-widest uppercase">VOCAL SYNTHESIS ACTIVE</span>
                    </div>
                ) : isProcessing ? (
                    <div className="px-4 py-1.5 bg-cyan-950/80 border border-cyan-500/50 rounded-full shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center gap-2 font-mono">
                        <Cpu size={13} className="text-cyan-400 animate-spin" />
                        <span className="text-cyan-300 text-xs font-bold tracking-widest uppercase">
                            {processingStatus || "CORTEX COMPUTING"}
                        </span>
                    </div>
                ) : (
                    <div className="px-4 py-1.5 bg-slate-900/80 border border-slate-700/60 rounded-full flex items-center gap-2 font-mono">
                        <Radio size={13} className="text-cyan-400 animate-pulse" />
                        <span className="text-slate-300 text-xs font-bold tracking-widest uppercase">NEURAL SENSORS READY</span>
                    </div>
                )}

                {/* Dynamic Hologram Subtitle */}
                <AnimatePresence mode="wait">
                    {message && (
                        <motion.div
                            key={message}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="w-full max-w-sm bg-slate-900/90 text-cyan-200 text-xs font-mono font-medium px-4 py-3 rounded-xl border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.2)] text-center backdrop-blur-xl"
                        >
                            <span className="text-cyan-400 font-bold mr-1.5">&gt;</span>
                            {message}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AvatarCanvas;
