import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, 
    RotateCcw, 
    Volume2, 
    Sparkles, 
    Trophy, 
    Play, 
    CheckCircle2,
    Clock,
    Heart,
    AlertCircle,
    LogOut
} from 'lucide-react';
import sound from './soundSynth';
import AdRewardModal from './AdRewardModal';

const NODES = [
    { id: 0, name: 'Alpha Node', color: 'border-cyan-500 bg-cyan-500/10 text-cyan-300', activeClass: 'bg-cyan-400 border-cyan-300 shadow-[0_0_35px_rgba(0,240,255,0.8)] scale-105 text-slate-950', ring: 'border-cyan-500/40' },
    { id: 1, name: 'Beta Node', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-300', activeClass: 'bg-emerald-400 border-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.8)] scale-105 text-slate-950', ring: 'border-emerald-500/40' },
    { id: 2, name: 'Gamma Node', color: 'border-amber-500 bg-amber-500/10 text-amber-300', activeClass: 'bg-amber-400 border-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.8)] scale-105 text-slate-950', ring: 'border-amber-500/40' },
    { id: 3, name: 'Delta Node', color: 'border-purple-500 bg-purple-500/10 text-purple-300', activeClass: 'bg-purple-400 border-purple-300 shadow-[0_0_35px_rgba(168,85,247,0.8)] scale-105 text-slate-950', ring: 'border-purple-500/40' },
];

const DIFFICULTY_LEVELS = [
    { label: 'Gentle', targetRounds: 4, speedMs: 650, pauseMs: 250, desc: '4 Rounds • Relaxed Echo' },
    { label: 'Classic', targetRounds: 5, speedMs: 520, pauseMs: 200, desc: '5 Rounds • Standard Pace' },
    { label: 'Pro Cortex', targetRounds: 7, speedMs: 380, pauseMs: 160, desc: '7 Rounds • Rapid Firing' },
];

export default function NeuroSequence({ onScoreEarned, onExit }) {
    const [difficulty, setDifficulty] = useState(1); // 1 = Classic (5 rounds)
    const [sequence, setSequence] = useState([0, 1]);
    const [playerInput, setPlayerInput] = useState([]);
    const [isPlayingSequence, setIsPlayingSequence] = useState(false);
    const [activeNode, setActiveNode] = useState(null);
    const [statusMessage, setStatusMessage] = useState("Watch the sequence of glowing neural notes.");
    const [round, setRound] = useState(1);
    const [gameStarted, setGameStarted] = useState(false);
    const [isWon, setIsWon] = useState(false);
    const [isLost, setIsLost] = useState(false);
    const [lives, setLives] = useState(3);
    const [moves, setMoves] = useState(0); // Taps count
    const [showAdModal, setShowAdModal] = useState(false);

    // Live Timer
    const [seconds, setSeconds] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    const currentConfig = DIFFICULTY_LEVELS[difficulty];
    const isPlayingRef = useRef(false);

    // Live Timer Effect
    useEffect(() => {
        let interval = null;
        if (timerActive && !isWon && !isLost) {
            interval = setInterval(() => setSeconds(s => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, isWon, isLost]);

    const formatTime = (totalSec) => {
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const playSequence = useCallback(async (seqToPlay, diffIdx = difficulty) => {
        if (isPlayingRef.current) return;
        isPlayingRef.current = true;
        setIsPlayingSequence(true);
        setStatusMessage("Observing neural pattern... listen carefully.");
        setPlayerInput([]);

        const config = DIFFICULTY_LEVELS[diffIdx];

        // Small initial pause
        await new Promise(r => setTimeout(r, 550));

        for (let i = 0; i < seqToPlay.length; i++) {
            const nodeIndex = seqToPlay[i];
            setActiveNode(nodeIndex);
            sound.playNodeTone(nodeIndex);
            await new Promise(r => setTimeout(r, config.speedMs));
            setActiveNode(null);
            await new Promise(r => setTimeout(r, config.pauseMs));
        }

        setIsPlayingSequence(false);
        isPlayingRef.current = false;
        setStatusMessage("Now tap the nodes in the exact same sequence.");
    }, [difficulty]);

    const startGame = useCallback((diffIdx = difficulty) => {
        const initialSeq = [
            Math.floor(Math.random() * 4),
            Math.floor(Math.random() * 4)
        ];
        setSequence(initialSeq);
        setRound(1);
        setLives(3);
        setMoves(0);
        setSeconds(0);
        setTimerActive(true);
        setGameStarted(true);
        setIsWon(false);
        setIsLost(false);
        playSequence(initialSeq, diffIdx);
    }, [difficulty, playSequence]);

    const handleNodeClick = (nodeIdx) => {
        if (isPlayingSequence || !gameStarted || isWon || isLost) return;

        // Visual & Audio trigger
        setActiveNode(nodeIdx);
        sound.playNodeTone(nodeIdx);
        setTimeout(() => setActiveNode(null), 250);

        setMoves(m => m + 1);
        const currentStep = playerInput.length;
        const expectedNode = sequence[currentStep];

        if (nodeIdx === expectedNode) {
            const nextInput = [...playerInput, nodeIdx];
            setPlayerInput(nextInput);

            // Completed full sequence for this round?
            if (nextInput.length === sequence.length) {
                sound.playMatchSuccess();
                if (onScoreEarned) onScoreEarned(120);

                if (round >= currentConfig.targetRounds) {
                    // Won sequence milestone
                    setIsWon(true);
                    setTimerActive(false);
                    sound.playVictory();
                    setStatusMessage(`Exceptional pattern recall! You completed all ${currentConfig.targetRounds} neural sequences!`);
                    if (onScoreEarned) onScoreEarned(350);
                } else {
                    setStatusMessage("Excellent! Advancing to the next neural pathway.");
                    setTimeout(() => {
                        const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
                        setSequence(nextSeq);
                        setRound(r => r + 1);
                        playSequence(nextSeq, difficulty);
                    }, 1200);
                }
            }
        } else {
            // Wrong node tapped: deduct life
            const nextLives = lives - 1;
            setLives(nextLives);
            sound.playTryAgain();

            if (nextLives <= 0) {
                // Out of lives -> Game Over
                setIsLost(true);
                setTimerActive(false);
                setStatusMessage("Synapse shields depleted! Neural pattern lost.");
            } else {
                setStatusMessage(`Close! ${nextLives} synapse shield${nextLives > 1 ? 's' : ''} remaining. Replaying pattern...`);
                setTimeout(() => {
                    playSequence(sequence, difficulty);
                }, 1300);
            }
        }
    };

    const handleReplaySequence = () => {
        if (isPlayingSequence || !gameStarted || isWon || isLost) return;
        playSequence(sequence, difficulty);
    };

    // Reward from Watching Ad: Refill 3 lives and resume current round!
    const handleAdRewardEarned = () => {
        setShowAdModal(false);
        setLives(3);
        setIsLost(false);
        setTimerActive(true);
        setStatusMessage(`Neural link restored! Resuming Round ${round}. Listen to the pattern:`);
        setTimeout(() => {
            playSequence(sequence, difficulty);
        }, 1200);
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center select-none">
            {/* Header Telemetry */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 mb-6 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white font-display">Neuro-Sequence Echo</h4>
                        <p className="text-xs font-mono text-slate-400">Working Memory & Harmonic Recall</p>
                    </div>
                </div>

                {/* Right Status Chips */}
                <div className="flex items-center flex-wrap gap-2">
                    {/* Live Timer */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-cyan-300 text-xs font-mono font-bold">
                        <Clock size={13} className="text-cyan-400" />
                        <span>{formatTime(seconds)}</span>
                    </div>

                    {/* Lives Counter */}
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Heart
                                key={i}
                                size={13}
                                className={i < lives ? "fill-rose-500 text-rose-400" : "text-slate-700"}
                            />
                        ))}
                    </div>

                    {/* Round Pill */}
                    <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300 font-bold">
                        Round {round} / {currentConfig.targetRounds}
                    </span>

                    {gameStarted && (
                        <button
                            onClick={handleReplaySequence}
                            disabled={isPlayingSequence || isWon || isLost}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 hover:text-cyan-100 transition-all disabled:opacity-40 cursor-pointer"
                        >
                            <Volume2 size={13} />
                            <span>Listen Again</span>
                        </button>
                    )}

                    {onExit && (
                        <button
                            onClick={onExit}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/40 hover:text-rose-300 transition-all cursor-pointer"
                            title="Exit Game"
                        >
                            <LogOut size={13} />
                            <span>Exit</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Instruction Status Pill */}
            <div className="w-full mb-8 p-3.5 px-5 rounded-2xl bg-slate-900/90 border border-cyan-500/20 text-center shadow-lg">
                <p className="text-sm font-mono text-cyan-300 font-medium">
                    {statusMessage}
                </p>
                {gameStarted && (
                    <div className="flex items-center justify-center gap-2 mt-2.5">
                        {sequence.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                    idx < playerInput.length
                                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] scale-110'
                                        : 'bg-slate-700'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 4 Neural Synapse Pads */}
            <div className="grid grid-cols-2 gap-5 w-full max-w-md aspect-square p-2">
                {NODES.map((node) => {
                    const isActive = activeNode === node.id;
                    return (
                        <button
                            key={node.id}
                            onClick={() => handleNodeClick(node.id)}
                            disabled={isPlayingSequence || !gameStarted || isWon || isLost}
                            className={`relative rounded-3xl border-2 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden p-6 ${
                                isActive ? node.activeClass : node.color
                            } ${!gameStarted ? 'opacity-60' : 'hover:scale-[1.02]'}`}
                        >
                            {/* Ambient Ripple Ring */}
                            <div className={`absolute inset-2 rounded-2xl border ${node.ring} pointer-events-none opacity-40`} />
                            
                            <Sparkles size={28} className={`mb-2 transition-transform duration-200 ${isActive ? 'scale-125' : ''}`} />
                            <span className="font-display font-bold text-sm tracking-wider uppercase">
                                {node.name}
                            </span>
                            <span className="text-[10px] font-mono opacity-60 mt-0.5">
                                Synapse #{node.id + 1}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Start / Reset Controls */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
                {!gameStarted ? (
                    <button
                        onClick={() => startGame(difficulty)}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
                    >
                        <Play size={18} fill="currentColor" />
                        <span>Begin Sequence ({currentConfig.label})</span>
                    </button>
                ) : (
                    <button
                        onClick={() => startGame(difficulty)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition-all cursor-pointer"
                    >
                        <RotateCcw size={14} />
                        <span>Restart Session</span>
                    </button>
                )}

                {/* Difficulty Selector */}
                <div className="flex gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
                    {DIFFICULTY_LEVELS.map((lvl, idx) => (
                        <button
                            key={lvl.label}
                            onClick={() => {
                                setDifficulty(idx);
                                if (gameStarted) startGame(idx);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                                difficulty === idx
                                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {lvl.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Victory Modal */}
            <AnimatePresence>
                {isWon && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <div className="bg-gradient-to-b from-slate-900 via-[#0c1424] to-[#060b14] border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_60px_rgba(16,185,129,0.35)]">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                                <Trophy size={36} className="animate-bounce" />
                            </div>

                            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white mb-2">
                                Sequence Mastered!
                            </h3>

                            <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
                                Exceptional auditory and working memory recall! You matched the <strong className="text-emerald-300">{currentConfig.label} ({currentConfig.targetRounds} Rounds)</strong> sequence melody.
                            </p>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6 font-mono text-xs">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">Time</span>
                                    <strong className="text-cyan-300 text-sm">{formatTime(seconds)}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">Taps</span>
                                    <strong className="text-amber-300 text-sm">{moves}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">Score</span>
                                    <strong className="text-emerald-400 text-sm">+350</strong>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => startGame(difficulty)}
                                    className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={15} />
                                    <span>Play Again</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const nextDiff = (difficulty + 1) % DIFFICULTY_LEVELS.length;
                                        setDifficulty(nextDiff);
                                        startGame(nextDiff);
                                    }}
                                    className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold font-mono text-sm transition-all shadow-[0_0_20px_rgba(0,240,255,0.35)] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <Play size={15} fill="currentColor" />
                                    <span>Next ({DIFFICULTY_LEVELS[(difficulty + 1) % DIFFICULTY_LEVELS.length].label})</span>
                                </button>
                                {onExit && (
                                    <button
                                        onClick={onExit}
                                        className="px-4 py-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-rose-400 border border-rose-500/30 font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <LogOut size={14} />
                                        <span>Exit</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Over / Out of Lives Modal */}
            <AnimatePresence>
                {isLost && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
                    >
                        <div className="bg-gradient-to-b from-slate-900 via-[#181124] to-[#0c0a18] border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_60px_rgba(244,63,94,0.35)]">
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center mx-auto mb-4 text-rose-400">
                                <AlertCircle size={36} />
                            </div>

                            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white mb-2">
                                Pattern Desynchronized!
                            </h3>

                            <p className="text-slate-300 text-xs sm:text-sm mb-5 leading-relaxed">
                                You ran out of synapse shields on <strong className="text-rose-300">Round {round} of {currentConfig.targetRounds}</strong>. Would you like to continue right here or restart from Round 1?
                            </p>

                            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-6 font-mono text-xs text-slate-300 flex justify-around">
                                <div>Round Reached: <strong className="text-cyan-300">{round} / {currentConfig.targetRounds}</strong></div>
                                <div>Time: <strong className="text-white">{formatTime(seconds)}</strong></div>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col gap-3 justify-center">
                                <button
                                    onClick={() => setShowAdModal(true)}
                                    className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold font-mono text-sm transition-all shadow-[0_0_25px_rgba(245,158,11,0.5)] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={16} />
                                    <span>Continue on Round {round} (Watch Ad 🎬)</span>
                                </button>

                                <button
                                    onClick={() => startGame(difficulty)}
                                    className="w-full px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={14} />
                                    <span>Play Again (Restart from Round 1)</span>
                                </button>

                                {onExit && (
                                    <button
                                        onClick={onExit}
                                        className="w-full px-6 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-rose-400 border border-rose-500/30 font-mono text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        <LogOut size={13} />
                                        <span>Exit Game</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rewarded Ad Modal */}
            <AdRewardModal
                isOpen={showAdModal}
                onClose={() => setShowAdModal(false)}
                onRewardEarned={handleAdRewardEarned}
                rewardDescription={`Refill all 3 Synapse Shield lives and continue on Round ${round}!`}
            />
        </div>
    );
}
