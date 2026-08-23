import React from 'react';
import { ArrowRight, Brain, Shield, Heart, Cpu, Zap, Activity, Eye, Database } from 'lucide-react';

const LandingPage = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen bg-[#060a12] text-slate-100 font-sans relative overflow-x-hidden cyber-grid-bg pb-16">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-20 flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="flex-1 space-y-6 text-left">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                        <span>NEXT-GEN AI MEMORY AUGMENTATION</span>
                    </div>

                    <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight text-white">
                        Your External <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 neon-text-cyan">
                            Neural Cortex
                        </span>
                    </h1>

                    <p className="text-slate-400 font-sans text-base sm:text-lg max-w-xl leading-relaxed">
                        Neuron acts as an intelligent sensory extension for Alzheimer's & Dementia patients — identifying faces, tracking misplaced objects, and conversing with context-aware memory recall.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <button
                            onClick={onGetStarted}
                            className="relative group bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono text-sm font-bold tracking-wider px-8 py-4 rounded-xl border border-cyan-400/50 shadow-[0_0_30px_rgba(0,240,255,0.4)] flex items-center gap-3 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
                        >
                            <span>INITIALIZE CORTEX</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>STATUS: LIVE & OPERATIONAL</span>
                        </div>
                    </div>
                </div>

                {/* Holographic Simulation Terminal Card */}
                <div className="flex-1 w-full max-w-md lg:max-w-lg flex justify-center">
                    <div className="w-full bg-[#0c1322]/90 border border-cyan-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl tech-bracket relative">
                        {/* Terminal Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20 mb-4 font-mono text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                                <span className="text-slate-400 ml-2 font-bold text-[11px]">NEURON_KERNEL // v2.6</span>
                            </div>
                            <span className="text-cyan-400 text-[10px]">QDRANT_ONLINE</span>
                        </div>

                        {/* Live Assistant Visual */}
                        <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 mb-4">
                            <img src="/assets/speaking.gif" alt="Avatar" className="w-12 h-12 rounded-xl object-cover border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.3)]" />
                            <div>
                                <div className="font-display font-bold text-sm text-slate-100">Neuron Companion Core</div>
                                <div className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                    <span>Vocal & Vision Cortex Synchronized</span>
                                </div>
                            </div>
                        </div>

                        {/* Dialogue Bubbles */}
                        <div className="space-y-3 font-mono text-xs">
                            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 rounded-xl rounded-tl-none">
                                <span className="text-cyan-400 font-bold block text-[10px] mb-1">[NEURAL RECALL]</span>
                                "I identified Dr. Miller entering the room. He is your neurologist scheduled for 3:00 PM."
                            </div>
                            <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 text-indigo-100 rounded-xl rounded-tr-none ml-auto max-w-[85%] text-right">
                                <span className="text-indigo-400 font-bold block text-[10px] mb-1">[USER QUERY]</span>
                                "Where did I put my prescription glasses?"
                            </div>
                            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 rounded-xl rounded-tl-none">
                                <span className="text-cyan-400 font-bold block text-[10px] mb-1">[SPATIAL MEMORY]</span>
                                "Your glasses were detected on the nightstand beside your book 45 minutes ago."
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Architecture Specs Strip */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 my-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl font-mono">
                    <div className="text-center">
                        <div className="text-cyan-400 font-extrabold text-2xl md:text-3xl">512-D</div>
                        <div className="text-slate-400 text-xs mt-1">Facial Vectors</div>
                    </div>
                    <div className="text-center">
                        <div className="text-emerald-400 font-extrabold text-2xl md:text-3xl">384-D</div>
                        <div className="text-slate-400 text-xs mt-1">Semantic Embedding</div>
                    </div>
                    <div className="text-center">
                        <div className="text-purple-400 font-extrabold text-2xl md:text-3xl">&lt; 50ms</div>
                        <div className="text-slate-400 text-xs mt-1">Vector Query Latency</div>
                    </div>
                    <div className="text-center">
                        <div className="text-blue-400 font-extrabold text-2xl md:text-3xl">100%</div>
                        <div className="text-slate-400 text-xs mt-1">Private Memory Bank</div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-6 md:px-12 py-16">
                <div className="text-center space-y-3 mb-12">
                    <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
                        Engineered for High-Reliability Memory
                    </h2>
                    <p className="font-mono text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                        Combining computer vision, vector database indexing, and LLM reasoning to safeguard precious memories.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={<Eye className="text-cyan-400" size={28} />}
                        title="Optical Biometrics"
                        desc="Instant facial recognition and object localization using YOLOv8 and deep metric embeddings."
                        tag="VISION CORE"
                    />
                    <FeatureCard
                        icon={<Database className="text-emerald-400" size={28} />}
                        title="Vector Memory DB"
                        desc="Powered by Qdrant vector database for sub-millisecond semantic search and recall across faces and facts."
                        tag="QDRANT ENGINE"
                    />
                    <FeatureCard
                        icon={<Cpu className="text-purple-400" size={28} />}
                        title="Caregiver Sync"
                        desc="Caregivers can remotely enroll family members, add voice signatures, and update object locations in real time."
                        tag="REMOTE LINK"
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-6 md:px-12 pt-12 border-t border-slate-800 text-center font-mono text-xs text-slate-500">
                © 2026 NEURON PROJECT // MULTIMODAL NEURAL ASSISTANT // ALL RIGHTS RESERVED
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc, tag }) => (
    <div className="bg-[#0c1322]/80 border border-slate-800 hover:border-cyan-500/40 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[0_0_25px_rgba(0,240,255,0.15)] flex flex-col justify-between">
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">{icon}</div>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {tag}
                </span>
            </div>
            <h3 className="font-display font-bold text-lg text-slate-100 mb-2">{title}</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{desc}</p>
        </div>
    </div>
);

export default LandingPage;
