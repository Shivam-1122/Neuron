import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SpiderManAvatar = ({ isSpeaking, isProcessing, isAwake }) => {
    const [blink, setBlink] = useState(false);
    const [gestureIndex, setGestureIndex] = useState(0);

    // Expressive eye blinking
    useEffect(() => {
        const interval = setInterval(() => {
            setBlink(true);
            setTimeout(() => setBlink(false), 180);
        }, 3000 + Math.random() * 2000);
        return () => clearInterval(interval);
    }, []);

    // Hand gesture cycle when speaking
    useEffect(() => {
        if (!isSpeaking) return;
        const interval = setInterval(() => {
            setGestureIndex(prev => (prev + 1) % 3);
        }, 1400);
        return () => clearInterval(interval);
    }, [isSpeaking]);

    return (
        <div className="relative w-full h-80 flex items-center justify-center select-none overflow-hidden">
            {/* Ambient Background Aura */}
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/20 via-transparent to-red-950/20 pointer-events-none" />

            <AnimatePresence mode="wait">
                {isSpeaking ? (
                    /* ========================================================
                       STATE 1: STANDING & TALKING WITH HAND GESTURES
                       (Full Body, Mask On - No mouth movement, Expressive Eyes & Hand Gestures)
                       ======================================================== */
                    <motion.div
                        key="spiderman-standing"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="relative w-72 h-80 flex flex-col items-center justify-center"
                    >
                        {/* Floor Hologram Ring */}
                        <div className="absolute bottom-2 w-48 h-8 rounded-full bg-cyan-500/20 blur-md border border-cyan-400/40" />

                        {/* Full Body Standing Spider-Man SVG */}
                        <svg viewBox="0 0 260 320" className="w-full h-full filter drop-shadow-[0_0_20px_rgba(239,68,68,0.35)]">
                            <defs>
                                <linearGradient id="suitRed" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#ff334b" />
                                    <stop offset="50%" stopColor="#e11d48" />
                                    <stop offset="100%" stopColor="#881337" />
                                </linearGradient>
                                <linearGradient id="suitBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#2563eb" />
                                    <stop offset="50%" stopColor="#1d4ed8" />
                                    <stop offset="100%" stopColor="#0f172a" />
                                </linearGradient>
                                <linearGradient id="eyeLens" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#ffffff" />
                                    <stop offset="80%" stopColor="#e2e8f0" />
                                    <stop offset="100%" stopColor="#93c5fd" />
                                </linearGradient>
                            </defs>

                            {/* Full Body Structure */}

                            {/* LEGS & BOOTS */}
                            {/* Left Leg (Blue Pants + Red Boot) */}
                            <path d="M 108 175 L 96 240 L 92 285 L 82 290 L 80 298 L 105 298 L 108 285 L 115 240 L 120 175 Z" fill="url(#suitBlue)" stroke="#09090b" strokeWidth="1.5" />
                            {/* Left Boot (Red) */}
                            <path d="M 94 250 L 92 285 L 82 290 L 80 298 L 105 298 L 108 285 L 110 250 Z" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1.5" />
                            {/* Left Boot Webbing */}
                            <g stroke="#18181b" strokeWidth="1" opacity="0.8">
                                <path d="M 85 270 Q 100 274 108 270" fill="none" />
                                <path d="M 82 285 Q 98 290 106 285" fill="none" />
                            </g>

                            {/* Right Leg (Blue Pants + Red Boot) */}
                            <path d="M 140 175 L 145 240 L 152 285 L 155 298 L 180 298 L 178 290 L 168 285 L 164 240 L 152 175 Z" fill="url(#suitBlue)" stroke="#09090b" strokeWidth="1.5" />
                            {/* Right Boot (Red) */}
                            <path d="M 150 250 L 152 285 L 155 298 L 180 298 L 178 290 L 168 285 L 166 250 Z" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1.5" />
                            {/* Right Boot Webbing */}
                            <g stroke="#18181b" strokeWidth="1" opacity="0.8">
                                <path d="M 152 270 Q 160 274 175 270" fill="none" />
                                <path d="M 154 285 Q 162 290 178 285" fill="none" />
                            </g>

                            {/* TORSO & BELT */}
                            {/* Belt */}
                            <path d="M 105 168 L 155 168 L 150 178 L 110 178 Z" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1.5" />
                            <path d="M 105 168 Q 130 174 155 168" stroke="#18181b" strokeWidth="1" fill="none" />

                            {/* Blue Torso Sides */}
                            <path d="M 92 105 C 88 130, 95 155, 105 168 L 115 168 L 110 105 Z" fill="url(#suitBlue)" stroke="#09090b" strokeWidth="1.5" />
                            <path d="M 168 105 C 172 130, 165 155, 155 168 L 145 168 L 150 105 Z" fill="url(#suitBlue)" stroke="#09090b" strokeWidth="1.5" />

                            {/* Red Main Chest & Neck */}
                            <path d="M 110 105 L 150 105 L 145 168 L 115 168 Z" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1.5" />
                            <path d="M 120 75 L 140 75 L 145 105 L 115 105 Z" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1.5" />

                            {/* Chest Black Webbing Grid */}
                            <g stroke="#18181b" strokeWidth="1.2" opacity="0.85">
                                <path d="M 130 75 L 130 168" />
                                <path d="M 118 78 L 116 168" />
                                <path d="M 142 78 L 144 168" />
                                <path d="M 112 115 Q 130 122 148 115" fill="none" />
                                <path d="M 113 132 Q 130 140 147 132" fill="none" />
                                <path d="M 114 150 Q 130 158 146 150" fill="none" />
                            </g>

                            {/* Iconic Black Spider on Chest */}
                            <g>
                                <ellipse cx="130" cy="128" rx="3.5" ry="5.5" fill="#09090b" />
                                <circle cx="130" cy="122" r="2.5" fill="#09090b" />
                                {/* Spider Legs */}
                                <path d="M 129 122 C 124 114, 114 114, 110 110" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                                <path d="M 131 122 C 136 114, 146 114, 150 110" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                                <path d="M 128 124 C 122 118, 112 120, 108 117" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                                <path d="M 132 124 C 138 118, 148 120, 152 117" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                                <path d="M 128 129 C 120 134, 114 142, 112 148" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                                <path d="M 132 129 C 140 134, 146 142, 148 148" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                                <path d="M 129 131 C 124 137, 120 146, 118 152" stroke="#09090b" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                                <path d="M 131 131 C 136 137, 140 146, 142 152" stroke="#09090b" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                            </g>

                            {/* GESTURING ARMS & HANDS (Animated talking hand gestures) */}
                            {/* Left Arm & Gesturing Hand */}
                            <motion.g
                                animate={{
                                    rotate: gestureIndex === 0 ? [-8, 2, -8] : gestureIndex === 1 ? [4, -12, 4] : [0, 8, 0],
                                }}
                                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                                style={{ transformOrigin: "90px 105px" }}
                            >
                                <path d="M 92 105 L 70 135 L 62 165 L 72 168 L 80 140 L 100 110 Z" fill="url(#suitBlue)" stroke="#09090b" strokeWidth="1.5" />
                                {/* Left Forearm Glove (Red) */}
                                <path d="M 68 145 L 62 165 L 50 178 L 46 172 L 56 160 L 72 142 Z" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1.5" />
                                {/* Glove Webbing */}
                                <path d="M 58 156 L 68 150" stroke="#18181b" strokeWidth="1" />
                                <path d="M 52 168 L 62 162" stroke="#18181b" strokeWidth="1" />
                                {/* Expressive Open Talking Hand */}
                                <circle cx="48" cy="175" r="4.5" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1" />
                                <path d="M 46 172 L 40 170" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
                                <path d="M 45 175 L 38 174" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
                                <path d="M 46 178 L 40 180" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
                            </motion.g>

                            {/* Right Arm & Explaining Gesture Hand */}
                            <motion.g
                                animate={{
                                    rotate: gestureIndex === 0 ? [6, -8, 6] : gestureIndex === 1 ? [-10, 4, -10] : [8, -4, 8],
                                }}
                                transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                                style={{ transformOrigin: "170px 105px" }}
                            >
                                <path d="M 168 105 L 190 135 L 200 160 L 190 165 L 180 140 L 160 110 Z" fill="url(#suitBlue)" stroke="#09090b" strokeWidth="1.5" />
                                {/* Right Forearm Glove (Red) */}
                                <path d="M 188 140 L 200 160 L 214 172 L 218 166 L 206 152 L 192 138 Z" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1.5" />
                                {/* Glove Webbing */}
                                <path d="M 194 148 L 204 154" stroke="#18181b" strokeWidth="1" />
                                <path d="M 202 160 L 212 166" stroke="#18181b" strokeWidth="1" />
                                {/* Gesturing Hand Pointing/Explaining */}
                                <circle cx="214" cy="170" r="4.5" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1" />
                                <path d="M 216 168 L 224 164" stroke="#09090b" strokeWidth="2.2" strokeLinecap="round" />
                                <path d="M 216 172 L 222 173" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
                            </motion.g>

                            {/* HEAD / MASK WITH EXPRESSIVE LENSES (Natural Head Tilt When Talking) */}
                            <motion.g
                                animate={{
                                    rotate: [-1.5, 1.5, -1.5],
                                    y: [-1, 1, -1]
                                }}
                                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                                style={{ transformOrigin: "130px 65px" }}
                            >
                                {/* Mask Red Base */}
                                <path
                                    d="M 130 18 C 95 18, 88 45, 88 68 C 88 92, 108 108, 130 108 C 152 108, 172 92, 172 68 C 172 45, 165 18, 130 18 Z"
                                    fill="url(#suitRed)"
                                    stroke="#09090b"
                                    strokeWidth="2"
                                />

                                {/* Mask Black Webbing Stripes */}
                                <g stroke="#18181b" strokeWidth="1.2" opacity="0.9">
                                    <path d="M 130 65 L 130 19" />
                                    <path d="M 130 65 L 150 24" />
                                    <path d="M 130 65 L 165 38" />
                                    <path d="M 130 65 L 171 58" />
                                    <path d="M 130 65 L 169 82" />
                                    <path d="M 130 65 L 152 102" />
                                    <path d="M 130 65 L 130 108" />
                                    <path d="M 130 65 L 108 102" />
                                    <path d="M 130 65 L 91 82" />
                                    <path d="M 130 65 L 89 58" />
                                    <path d="M 130 65 L 95 38" />
                                    <path d="M 130 65 L 110 24" />

                                    {/* Web Arcs */}
                                    <path d="M 122 38 Q 130 43 138 38" fill="none" />
                                    <path d="M 116 28 Q 130 33 144 28" fill="none" />
                                    <path d="M 116 85 Q 130 80 144 85" fill="none" />
                                    <path d="M 120 96 Q 130 92 140 96" fill="none" />
                                </g>

                                {/* Mask Eye Lenses (Expressive Animated Lenses - No Mouth Needed) */}
                                {/* Left Eye */}
                                <g transform={blink ? "scale(1, 0.12) translate(0, 560)" : "scale(1, 1)"} className="transition-transform duration-100 origin-center">
                                    <path d="M 124 64 C 120 50, 108 42, 94 45 C 91 58, 98 78, 120 79 C 124 79, 126 70, 124 64 Z" fill="#09090b" />
                                    <path d="M 121 64 C 118 52, 109 46, 97 48 C 95 58, 101 74, 118 75 C 122 75, 123 68, 121 64 Z" fill="url(#eyeLens)" filter="drop-shadow(0 0 3px #fff)" />
                                </g>

                                {/* Right Eye */}
                                <g transform={blink ? "scale(1, 0.12) translate(0, 560)" : "scale(1, 1)"} className="transition-transform duration-100 origin-center">
                                    <path d="M 136 64 C 140 50, 152 42, 166 45 C 169 58, 162 78, 140 79 C 136 79, 134 70, 136 64 Z" fill="#09090b" />
                                    <path d="M 139 64 C 142 52, 151 46, 163 48 C 165 58, 159 74, 142 75 C 138 75, 137 68, 139 64 Z" fill="url(#eyeLens)" filter="drop-shadow(0 0 3px #fff)" />
                                </g>
                            </motion.g>
                        </svg>
                    </motion.div>
                ) : (
                    /* ========================================================
                       STATE 2: IDLE // DYNAMIC WEB-SWINGING ACROSS BUILDINGS
                       (Web shoot from wrist, pendulum swing, skyline cityscape)
                       ======================================================== */
                    <motion.div
                        key="spiderman-swinging"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="relative w-full h-full flex items-center justify-center"
                    >
                        {/* Background City Skyline Silhouettes */}
                        <div className="absolute inset-0 flex items-end justify-between px-2 opacity-30 pointer-events-none">
                            <div className="w-12 h-44 bg-slate-800 border-t border-cyan-500/30 rounded-t-sm" />
                            <div className="w-16 h-56 bg-slate-900 border-t border-purple-500/30 rounded-t-md mx-1" />
                            <div className="w-10 h-36 bg-slate-800 border-t border-cyan-500/30 rounded-t-sm" />
                            <div className="w-20 h-52 bg-slate-950 border-t border-cyan-500/30 rounded-t-md" />
                            <div className="w-14 h-40 bg-slate-800 border-t border-blue-500/30 rounded-t-sm" />
                        </div>

                        {/* Web-Swinging Spider-Man with Dynamic Pendulum Animation */}
                        <motion.div
                            animate={{
                                rotate: [-18, 18, -18],
                                x: [-28, 28, -28],
                                y: [-6, 6, -6],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 2.8,
                                ease: "easeInOut"
                            }}
                            style={{ transformOrigin: "150px -40px" }}
                            className="relative w-64 h-72 flex items-center justify-center"
                        >
                            <svg viewBox="0 0 260 280" className="w-full h-full filter drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                                <defs>
                                    <linearGradient id="suitRed" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ff334b" />
                                        <stop offset="50%" stopColor="#e11d48" />
                                        <stop offset="100%" stopColor="#881337" />
                                    </linearGradient>
                                    <linearGradient id="suitBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#2563eb" />
                                        <stop offset="50%" stopColor="#1d4ed8" />
                                        <stop offset="100%" stopColor="#0f172a" />
                                    </linearGradient>
                                    <linearGradient id="eyeLens" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#ffffff" />
                                        <stop offset="80%" stopColor="#e2e8f0" />
                                        <stop offset="100%" stopColor="#93c5fd" />
                                    </linearGradient>
                                    <linearGradient id="webLineGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ffffff" />
                                        <stop offset="100%" stopColor="#00f0ff" />
                                    </linearGradient>
                                </defs>

                                {/* High-Tensile Web Line Shot from Hand */}
                                <path
                                    d="M 195 52 L 245 -20"
                                    stroke="url(#webLineGlow)"
                                    strokeWidth="2.5"
                                    strokeDasharray="4 2"
                                    filter="drop-shadow(0 0 6px rgba(0,240,255,0.9))"
                                />

                                {/* Web Impact Spark at Wrist */}
                                <circle cx="195" cy="52" r="4" fill="#00f0ff" className="animate-ping" />

                                {/* SWINGING POSE (Acrobatic dynamic legs & extended arm) */}

                                {/* Bent Left Leg (In mid-air tuck) */}
                                <path d="M 95 160 L 60 185 L 75 220 L 65 240 L 52 245 L 85 245 L 90 220 L 80 185 L 105 165 Z" fill="url(#suitBlue)" stroke="#09090b" strokeWidth="1.5" />
                                <path d="M 68 215 L 65 240 L 52 245 L 85 245 L 90 220 Z" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1.5" />

                                {/* Extended Right Leg (Trailing back in air) */}
                                <path d="M 125 160 L 160 195 L 195 220 L 215 225 L 220 220 L 190 205 L 155 180 L 135 160 Z" fill="url(#suitBlue)" stroke="#09090b" strokeWidth="1.5" />
                                <path d="M 185 210 L 195 220 L 215 225 L 220 220 L 190 205 Z" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1.5" />

                                {/* Torso in Athletic Angled Swing */}
                                <path d="M 95 105 L 140 110 L 130 165 L 90 160 Z" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1.5" />
                                <path d="M 80 115 C 80 135, 88 150, 95 160 L 105 160 L 98 115 Z" fill="url(#suitBlue)" stroke="#09090b" strokeWidth="1.5" />
                                <path d="M 140 110 C 145 130, 138 150, 130 165 L 120 165 L 128 110 Z" fill="url(#suitBlue)" stroke="#09090b" strokeWidth="1.5" />

                                {/* Chest Spider & Webbing */}
                                <g stroke="#18181b" strokeWidth="1.2" opacity="0.85">
                                    <path d="M 115 108 L 110 162" />
                                    <path d="M 98 125 Q 115 130 135 128" fill="none" />
                                    <path d="M 95 145 Q 115 150 130 148" fill="none" />
                                </g>
                                <ellipse cx="115" cy="134" rx="3.5" ry="5.5" fill="#09090b" />
                                <path d="M 114 130 L 104 122" stroke="#09090b" strokeWidth="1.6" strokeLinecap="round" />
                                <path d="M 116 130 L 126 122" stroke="#09090b" strokeWidth="1.6" strokeLinecap="round" />
                                <path d="M 114 136 L 105 146" stroke="#09090b" strokeWidth="1.6" strokeLinecap="round" />
                                <path d="M 116 136 L 125 146" stroke="#09090b" strokeWidth="1.6" strokeLinecap="round" />

                                {/* Left Arm (Stabilizing back) */}
                                <path d="M 82 110 L 50 130 L 35 148 L 42 152 L 58 135 L 88 118 Z" fill="url(#suitBlue)" stroke="#09090b" strokeWidth="1.5" />
                                <path d="M 45 138 L 35 148 L 28 158 L 35 162 L 48 150 Z" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1.5" />

                                {/* Right Arm (Extended Upwards Holding Web Line) */}
                                <path d="M 135 105 L 165 80 L 188 58 L 196 64 L 172 88 L 142 112 Z" fill="url(#suitBlue)" stroke="#09090b" strokeWidth="1.5" />
                                <path d="M 172 75 L 188 58 L 198 50 L 204 56 L 194 66 L 180 82 Z" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1.5" />
                                <circle cx="195" cy="52" r="5" fill="url(#suitRed)" stroke="#09090b" strokeWidth="1" />

                                {/* Angled Mask & Eye Lenses Looking Forward */}
                                <g transform="rotate(8 115 70)">
                                    <path
                                        d="M 115 32 C 86 32, 80 54, 80 72 C 80 92, 98 105, 115 105 C 132 105, 148 92, 148 72 C 148 54, 142 32, 115 32 Z"
                                        fill="url(#suitRed)"
                                        stroke="#09090b"
                                        strokeWidth="2"
                                    />
                                    {/* Webbing Lines */}
                                    <g stroke="#18181b" strokeWidth="1.2" opacity="0.85">
                                        <path d="M 115 70 L 115 33" />
                                        <path d="M 115 70 L 135 38" />
                                        <path d="M 115 70 L 145 52" />
                                        <path d="M 115 70 L 145 84" />
                                        <path d="M 115 70 L 128 102" />
                                        <path d="M 115 70 L 102 102" />
                                        <path d="M 115 70 L 85 84" />
                                        <path d="M 115 70 L 85 52" />
                                        <path d="M 115 70 L 95 38" />
                                    </g>
                                    {/* Focused Web-Swinging Eyes */}
                                    <path d="M 110 68 C 107 55, 96 48, 85 50 C 83 62, 90 78, 108 79 C 111 79, 112 73, 110 68 Z" fill="#09090b" />
                                    <path d="M 108 68 C 105 57, 98 52, 88 53 C 86 62, 92 75, 106 76 Z" fill="url(#eyeLens)" filter="drop-shadow(0 0 3px #fff)" />

                                    <path d="M 120 68 C 123 55, 134 48, 145 50 C 147 62, 140 78, 122 79 C 119 79, 118 73, 120 68 Z" fill="#09090b" />
                                    <path d="M 122 68 C 125 57, 132 52, 142 53 C 144 62, 138 75, 124 76 Z" fill="url(#eyeLens)" filter="drop-shadow(0 0 3px #fff)" />
                                </g>
                            </svg>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SpiderManAvatar;
