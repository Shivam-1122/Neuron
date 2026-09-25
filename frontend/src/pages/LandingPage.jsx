import React from 'react';
import { ArrowRight, Brain, Heart, Sparkles, Eye, Database, Gamepad2, Users, ShieldCheck } from 'lucide-react';
import neuronLogoIcon from '../assets/neuron-logo-icon.png';

const LandingPage = ({ onGetStarted, onPlayGame }) => {
    return (
        <div className="w-full min-h-full bg-[#111318] text-[#e2e2e9] font-sans relative overflow-x-hidden pb-24 select-none">
            {/* Ambient Sanctuary Radial Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-amber-600/6 rounded-full blur-[180px] pointer-events-none" />

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 pt-6 sm:pt-14 pb-8 sm:pb-16 flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12">
                <div className="flex-1 space-y-4 sm:space-y-6 text-left">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <img 
                            src={neuronLogoIcon} 
                            alt="Neuron" 
                            className="w-9 h-9 sm:w-12 sm:h-12 object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:scale-105 transition-transform" 
                        />
                        <span className="font-serif font-black tracking-widest text-xl sm:text-2xl text-white">NEURON</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 sm:py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] sm:text-xs font-semibold shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="truncate">AI MEMORY COMPANION &amp; SANCTUARY</span>
                    </div>

                    <h1 className="font-serif font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-white">
                        Your Caring <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400">
                            Memory Companion
                        </span>
                    </h1>

                    <p className="text-slate-400 font-sans text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
                        Neuron helps Alzheimer's and Dementia patients recognize loved ones, find everyday items, and exercise memory in a calm, stress-free environment.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2">
                        <button
                            onClick={onGetStarted}
                            className="relative group bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-sans text-xs sm:text-sm font-bold tracking-wide px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.25)] flex items-center gap-2.5 sm:gap-3 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
                        >
                            <span>LAUNCH ASSISTANT</span>
                            <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={onPlayGame}
                            className="relative group bg-[#181a20] hover:bg-[#22252c] text-amber-300 font-sans text-xs sm:text-sm font-semibold tracking-wide px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl border border-amber-500/30 hover:border-amber-400/60 shadow-sm flex items-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
                        >
                            <Gamepad2 size={17} className="text-amber-400" />
                            <span>MEMORY GYM</span>
                        </button>

                        <div className="flex items-center gap-2 px-3.5 py-2.5 sm:py-3 rounded-xl bg-[#181a20] border border-white/[0.06] font-mono text-[11px] sm:text-xs text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>READY &amp; SERENE</span>
                        </div>
                    </div>
                </div>

                {/* Sanctuary Simulation Terminal Card */}
                <div className="flex-1 w-full max-w-md lg:max-w-lg flex justify-center">
                    <div className="w-full bg-[#181a20] border border-amber-500/25 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_15px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl relative">
                        {/* Terminal Header */}
                        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.08] mb-3 sm:mb-4 text-xs font-mono">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                                <span className="text-slate-300 font-serif font-semibold text-xs sm:text-sm">Neuron Companion</span>
                            </div>
                            <span className="text-amber-400 font-mono text-[10px] sm:text-[11px]">CALM PRESENCE</span>
                        </div>

                        {/* Live Assistant Visual */}
                        <div className="flex items-center gap-3 sm:gap-4 bg-[#111318] p-3 sm:p-3.5 rounded-2xl border border-white/[0.06] mb-3 sm:mb-4">
                            <img src="/assets/speaking.gif" alt="Avatar" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)] shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="font-serif font-bold text-xs sm:text-sm text-white truncate">Caring Memory Companion</div>
                                <div className="font-sans text-[11px] sm:text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                    <span className="truncate">Gentle Voice &amp; Vision Ready</span>
                                </div>
                            </div>
                        </div>

                        {/* Dialogue Bubbles */}
                        <div className="space-y-2.5 sm:space-y-3 font-sans text-xs">
                            <div className="p-3 sm:p-3.5 bg-[#1f222a] border border-white/[0.06] text-slate-200 rounded-2xl rounded-tl-sm leading-relaxed text-xs">
                                <span className="text-amber-400 font-semibold font-mono block text-[10px] uppercase mb-1">Neuron</span>
                                "Good day! Here is your gentle reminder for today's routine and peaceful moments."
                            </div>
                            <div className="p-3 sm:p-3.5 bg-amber-500/15 border border-amber-500/30 text-amber-100 rounded-2xl rounded-tr-sm ml-auto max-w-[85%] text-right leading-relaxed text-xs">
                                <span className="text-amber-300 font-semibold font-mono block text-[10px] uppercase mb-1">You</span>
                                "Where did I leave my reading glasses?"
                            </div>
                            <div className="p-3 sm:p-3.5 bg-[#1f222a] border border-white/[0.06] text-slate-200 rounded-2xl rounded-tl-sm leading-relaxed text-xs">
                                <span className="text-amber-400 font-semibold font-mono block text-[10px] uppercase mb-1">Neuron</span>
                                "Your glasses are safely resting on the bedside table next to your favorite book."
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Reassuring Stats Strip */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 my-3 sm:my-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 p-4 sm:p-6 bg-[#181a20] border border-white/[0.08] rounded-2xl shadow-sm font-sans">
                    <div className="text-center p-1 sm:p-2">
                        <div className="text-amber-300 font-serif font-bold text-xl sm:text-2xl md:text-3xl">Instant</div>
                        <div className="text-slate-400 text-[11px] sm:text-xs mt-1">Loved Ones Recall</div>
                    </div>
                    <div className="text-center p-1 sm:p-2">
                        <div className="text-amber-300 font-serif font-bold text-xl sm:text-2xl md:text-3xl">Gentle</div>
                        <div className="text-slate-400 text-[11px] sm:text-xs mt-1">Item Locating</div>
                    </div>
                    <div className="text-center p-1 sm:p-2">
                        <div className="text-amber-300 font-serif font-bold text-xl sm:text-2xl md:text-3xl">432 Hz</div>
                        <div className="text-slate-400 text-[11px] sm:text-xs mt-1">Calming Soundscapes</div>
                    </div>
                    <div className="text-center p-1 sm:p-2">
                        <div className="text-amber-300 font-serif font-bold text-xl sm:text-2xl md:text-3xl">100%</div>
                        <div className="text-slate-400 text-[11px] sm:text-xs mt-1">Private &amp; Secure</div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12">
                <div className="text-center space-y-2 sm:space-y-3 mb-6 sm:mb-10">
                    <h2 className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl text-white">
                        Simple, Reassuring Memory Support
                    </h2>
                    <p className="font-sans text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                        Helping you remember faces, locate daily items, and keep your mind active every day without stress.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <FeatureCard
                        icon={<Eye className="text-amber-400" size={26} />}
                        title="Familiar Faces"
                        desc="Easily recognizes family members, caregivers, and doctors when they visit."
                        tag="PEOPLE RECALL"
                    />
                    <FeatureCard
                        icon={<Database className="text-amber-400" size={26} />}
                        title="Item Finder"
                        desc="Quickly helps locate keys, glasses, wallet, and medication in your home."
                        tag="EVERYDAY OBJECTS"
                    />
                    <FeatureCard
                        icon={<Gamepad2 className="text-amber-400" size={26} />}
                        title="Memory Gym"
                        desc="Gentle, relaxing brain exercises (Card Match, Light Sequence, Wood Block Puzzle) with soothing harmonium music."
                        tag="COGNITIVE TRAINING"
                        actionButton={
                            <button
                                onClick={onPlayGame}
                                className="mt-4 w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 hover:bg-amber-500/30 text-xs font-sans font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Gamepad2 size={15} />
                                <span>PLAY MEMORY GYM</span>
                            </button>
                        }
                    />
                    <FeatureCard
                        icon={<Users className="text-amber-400" size={26} />}
                        title="Caregiver Portal"
                        desc="Stay connected with daily updates, reminders, and gentle reassurance for the whole family."
                        tag="FAMILY CIRCLE"
                    />
                </div>
            </section>

            {/* Clean Footer with generous padding so nothing is cut off */}
            <footer className="max-w-7xl mx-auto px-6 md:px-12 pt-10 pb-16 border-t border-white/[0.08] text-center font-sans text-xs text-slate-500">
                <p>© 2026 Neuron Sanctuary • Multimodal Caring Memory Assistant • Designed with Love for Families</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc, tag, actionButton }) => (
    <div className="bg-[#181a20] border border-white/[0.08] hover:border-amber-400/40 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 shadow-md flex flex-col justify-between">
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#111318] rounded-xl border border-white/[0.06]">{icon}</div>
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {tag}
                </span>
            </div>
            <h3 className="font-serif font-bold text-lg text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{desc}</p>
        </div>
        {actionButton && <div>{actionButton}</div>}
    </div>
);

export default LandingPage;
