import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, ShieldCheck, X, Film, CheckCircle2, Play } from 'lucide-react';
import sound from './soundSynth';

export default function AdRewardModal({ isOpen, onClose, onRewardEarned, rewardDescription }) {
    const [secondsLeft, setSecondsLeft] = useState(5);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        sound.playTone(440, 'sine', 0.15, 0.1);
        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsCompleted(true);
                    sound.playMatchSuccess();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
            setSecondsLeft(5);
            setIsCompleted(false);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleClaim = () => {
        sound.playVictory();
        onRewardEarned();
    };

    const progressPercent = ((5 - secondsLeft) / 5) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-[#0a1120] to-[#060b14] border-2 border-cyan-500/50 p-6 md:p-8 shadow-[0_0_60px_rgba(0,240,255,0.25)] text-center overflow-hidden">
                {/* Decorative Top Ambient Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

                {/* Header Sponsor Badge */}
                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                        <Film size={14} className="text-cyan-400 animate-pulse" />
                        <span>Sponsor Message • Rewarded Second Chance</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Cancel"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Simulated Video Ad Screen Viewport */}
                <div className="relative w-full aspect-video rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-slate-700/80 overflow-hidden flex flex-col items-center justify-center p-6 mb-5 shadow-inner">
                    {/* Futuristic Grid Overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08)_0%,transparent_70%)] pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 mb-3 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-cyan-300">
                                <Sparkles size={28} className="animate-spin" style={{ animationDuration: '6s' }} />
                            </div>
                        </div>

                        <h4 className="font-display font-extrabold text-base sm:text-lg text-white mb-1">
                            SYNAPSE CARE™ HYDRATION
                        </h4>
                        <p className="text-slate-300 text-xs max-w-xs leading-relaxed">
                            Optimal hydration supports memory retention and neural firing speed. Take a gentle sip of water today!
                        </p>

                        <div className="flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono">
                            <ShieldCheck size={12} />
                            <span>CLINICALLY BACKED DEMENTIA WELLNESS</span>
                        </div>
                    </div>

                    {/* Bottom Video Progress HUD */}
                    <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 border-t border-slate-800 p-2.5 px-4 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2 text-slate-300">
                            <Clock size={13} className="text-cyan-400" />
                            {isCompleted ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Ad Finished!
                                </span>
                            ) : (
                                <span>Reward unlocks in: <strong className="text-cyan-300">{secondsLeft}s</strong></span>
                            )}
                        </div>

                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">HD 1080p</span>
                    </div>

                    {/* Progress Fill Bar */}
                    <div
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-1000 ease-linear"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Reward Info */}
                <div className="mb-6 p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center gap-2 text-xs font-mono text-cyan-200">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Reward: <strong>{rewardDescription || 'Resume game from current state with bonus moves/time!'}</strong></span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {isCompleted ? (
                        <button
                            onClick={handleClaim}
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold font-mono text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer flex items-center justify-center gap-2"
                        >
                            <Play size={16} fill="currentColor" />
                            <span>Claim Reward & Continue Playing</span>
                        </button>
                    ) : (
                        <button
                            disabled
                            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800/60 text-slate-500 font-mono text-sm cursor-not-allowed flex items-center justify-center gap-2 border border-slate-700/50"
                        >
                            <Clock size={16} />
                            <span>Please wait {secondsLeft}s to claim reward...</span>
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition cursor-pointer"
                    >
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
}
