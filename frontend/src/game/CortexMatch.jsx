import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Key, 
    Glasses, 
    Pill, 
    Camera, 
    Clock, 
    Coffee, 
    Home, 
    Music, 
    Sparkles, 
    RotateCcw, 
    Eye, 
    CheckCircle2, 
    Trophy,
    HeartHandshake,
    AlertCircle,
    Play,
    Flame,
    LogOut
} from 'lucide-react';
import sound from './soundSynth';
import AdRewardModal from './AdRewardModal';

const CARD_DEFINITIONS = [
    { id: 'key', label: 'House Key', icon: Key, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/40' },
    { id: 'glasses', label: 'Eyeglasses', icon: Glasses, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/40' },
    { id: 'medicine', label: 'Daily Medicine', icon: Pill, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/40' },
    { id: 'family', label: 'Family Photo', icon: Camera, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/40' },
    { id: 'clock', label: 'Wall Clock', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/40' },
    { id: 'coffee', label: 'Morning Tea', icon: Coffee, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/40' },
    { id: 'home', label: 'Comfort Home', icon: Home, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/40' },
    { id: 'music', label: 'Favorite Song', icon: Music, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/40' },
];

const DIFFICULTY_LEVELS = [
    { label: 'Gentle', pairs: 2, cols: 'grid-cols-2', desc: '4 Cards • Relaxed Warmup', baseMaxMoves: 18 },
    { label: 'Classic', pairs: 4, cols: 'grid-cols-4', desc: '8 Cards • Focused Memory', baseMaxMoves: 28 },
    { label: 'Stimulating', pairs: 6, cols: 'grid-cols-4 sm:grid-cols-6', desc: '12 Cards • Mind Stretch', baseMaxMoves: 42 },
];

function buildDeck(diffIndex) {
    const numPairs = DIFFICULTY_LEVELS[diffIndex].pairs;
    const selectedTypes = CARD_DEFINITIONS.slice(0, numPairs);

    const deck = [];
    selectedTypes.forEach((item) => {
        deck.push({ uid: `${item.id}-1`, typeId: item.id, ...item });
        deck.push({ uid: `${item.id}-2`, typeId: item.id, ...item });
    });

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export default function CortexMatch({ onScoreEarned, onExit }) {
    const [difficulty, setDifficulty] = useState(1); // 1 = Classic (4 pairs)
    const [cards, setCards] = useState(() => buildDeck(1));
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [matchedCardIds, setMatchedCardIds] = useState(new Set());
    const [isChecking, setIsChecking] = useState(false);
    const [moves, setMoves] = useState(0);
    const [bonusMoves, setBonusMoves] = useState(0);
    const [isWon, setIsWon] = useState(false);
    const [isLost, setIsLost] = useState(false);
    const [peeking, setPeeking] = useState(false);
    const [showAdModal, setShowAdModal] = useState(false);
    const [encouragement, setEncouragement] = useState("Tap any two cards to discover their match!");

    // Live Timer
    const [seconds, setSeconds] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    const currentConfig = DIFFICULTY_LEVELS[difficulty];
    const totalMaxMoves = currentConfig.baseMaxMoves + bonusMoves;

    const PRAISES = [
        "Wonderful focus!",
        "Beautiful recall!",
        "Your memory is shining!",
        "Spot on!",
        "Brilliant match!"
    ];

    // Timer effect
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

    const initGame = useCallback((diffIndex = difficulty) => {
        const deck = buildDeck(diffIndex);
        setCards(deck);
        setFlippedIndices([]);
        setMatchedCardIds(new Set());
        setIsChecking(false);
        setMoves(0);
        setBonusMoves(0);
        setIsWon(false);
        setIsLost(false);
        setPeeking(false);
        setSeconds(0);
        setTimerActive(false);
        setEncouragement("Take your time. Tap cards at your own comfortable pace.");
    }, [difficulty]);

    useEffect(() => {
        const timer = setTimeout(() => {
            initGame(difficulty);
        }, 0);
        return () => clearTimeout(timer);
    }, [difficulty, initGame]);

    const handleCardClick = (idx) => {
        if (isChecking || peeking || isWon || isLost) return;
        if (flippedIndices.includes(idx)) return;
        if (matchedCardIds.has(cards[idx].typeId)) return;

        // Start timer on first move
        if (!timerActive && moves === 0 && seconds === 0) {
            setTimerActive(true);
        }

        sound.playCardFlip();

        const newFlipped = [...flippedIndices, idx];
        setFlippedIndices(newFlipped);

        if (newFlipped.length === 2) {
            const nextMoves = moves + 1;
            setMoves(nextMoves);
            setIsChecking(true);

            const firstCard = cards[newFlipped[0]];
            const secondCard = cards[newFlipped[1]];

            if (firstCard.typeId === secondCard.typeId) {
                // Match Found!
                sound.playMatchSuccess();
                const newMatched = new Set(matchedCardIds);
                newMatched.add(firstCard.typeId);
                setMatchedCardIds(newMatched);
                setFlippedIndices([]);
                setIsChecking(false);

                const randomPraise = PRAISES[(nextMoves + newMatched.size) % PRAISES.length];
                setEncouragement(`${randomPraise} Found the ${firstCard.label}!`);
                if (onScoreEarned) onScoreEarned(100);

                // Check Win Condition
                if (newMatched.size === DIFFICULTY_LEVELS[difficulty].pairs) {
                    setIsWon(true);
                    setTimerActive(false);
                    sound.playVictory();
                    setEncouragement("Outstanding work! You connected every single memory pair!");
                    if (onScoreEarned) onScoreEarned(250);
                }
            } else {
                // Not a match
                sound.playTryAgain();
                setTimeout(() => {
                    setFlippedIndices([]);
                    setIsChecking(false);

                    // Check if moves limit exceeded and not won
                    if (nextMoves >= totalMaxMoves && matchedCardIds.size < DIFFICULTY_LEVELS[difficulty].pairs) {
                        setIsLost(true);
                        setTimerActive(false);
                        sound.playTryAgain();
                    } else {
                        setEncouragement("That's okay! Try to remember where those cards were.");
                    }
                }, 1050);
            }
        }
    };

    // Peek Helper - shows all cards for 2.2 seconds without penalty
    const handlePeek = () => {
        if (peeking || isWon || isLost) return;
        setPeeking(true);
        sound.playTone(440, 'sine', 0.2, 0.15);
        setTimeout(() => {
            setPeeking(false);
        }, 2200);
    };

    // Reward from Watching Ad: Continue right from where you were!
    const handleAdRewardEarned = () => {
        setShowAdModal(false);
        setBonusMoves(prev => prev + 14); // Grant 14 bonus moves
        setIsLost(false);
        setTimerActive(true);
        setEncouragement("Bonus turns activated! Continue finding the remaining pairs.");
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none">
            {/* Header & Comfort Controls */}
            <div className="w-full flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 mb-6 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Pacing:</span>
                    <div className="flex gap-1.5">
                        {DIFFICULTY_LEVELS.map((lvl, idx) => (
                            <button
                                key={lvl.label}
                                onClick={() => setDifficulty(idx)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    difficulty === idx
                                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,240,255,0.4)] font-bold'
                                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                                }`}
                            >
                                {lvl.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Telemetry Chips (Timer, Turns, Pairs) */}
                <div className="flex items-center flex-wrap gap-2.5">
                    {/* Live Timer */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-cyan-300 text-xs font-mono font-bold">
                        <Clock size={13} className="text-cyan-400" />
                        <span>{formatTime(seconds)}</span>
                    </div>

                    {/* Moves Remaining Pill */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                        totalMaxMoves - moves <= 5
                            ? 'bg-rose-950/50 border-rose-500/50 text-rose-300 animate-pulse'
                            : 'bg-slate-800/90 border-slate-700 text-slate-300'
                    }`}>
                        <Flame size={13} className="text-amber-400" />
                        <span>Turns: <strong className="text-white">{moves}</strong> / {totalMaxMoves}</span>
                    </div>

                    <button
                        onClick={handlePeek}
                        disabled={peeking || isWon || isLost}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/50 hover:text-purple-100 transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                        title="Peek at all cards without penalty"
                    >
                        <Eye size={14} />
                        <span>Peek</span>
                    </button>

                    <button
                        onClick={() => initGame(difficulty)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                    >
                        <RotateCcw size={14} />
                        <span>Reset</span>
                    </button>
                </div>
            </div>

            {/* Encouragement Banner */}
            <div className="w-full mb-6 p-3.5 px-5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-cyan-200 text-sm">
                <div className="flex items-center gap-2.5">
                    <HeartHandshake size={18} className="text-cyan-400 shrink-0" />
                    <span className="font-medium">{encouragement}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                    <span>Pairs Found: <strong className="text-emerald-400">{matchedCardIds.size} / {currentConfig.pairs}</strong></span>
                </div>
            </div>

            {/* Card Grid */}
            <div className={`grid ${currentConfig.cols} gap-3 sm:gap-4 w-full p-2`}>
                {cards.map((card, idx) => {
                    const isFlipped = flippedIndices.includes(idx) || peeking;
                    const isMatched = matchedCardIds.has(card.typeId);
                    const isRevealed = isFlipped || isMatched;
                    const IconComponent = card.icon;

                    return (
                        <div
                            key={card.uid}
                            onClick={() => handleCardClick(idx)}
                            className="aspect-square cursor-pointer"
                        >
                            <motion.div
                                animate={{
                                    scale: isMatched ? 0.95 : 1
                                }}
                                whileHover={{ scale: isMatched ? 0.95 : 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ duration: 0.2 }}
                                className="relative w-full h-full rounded-2xl shadow-xl overflow-hidden"
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    {!isRevealed ? (
                                        /* Colorful Decorative Card Back (Face Down) */
                                        <motion.div
                                            key="card-back"
                                            initial={{ rotateY: -90, opacity: 0 }}
                                            animate={{ rotateY: 0, opacity: 1 }}
                                            exit={{ rotateY: 90, opacity: 0 }}
                                            transition={{ duration: 0.22 }}
                                            className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-900 to-cyan-950 border-2 border-cyan-400/50 hover:border-cyan-300 flex flex-col items-center justify-center p-3 relative shadow-[0_0_20px_rgba(99,102,241,0.25)] group"
                                        >
                                            <div className="absolute inset-2 rounded-xl border border-cyan-500/20 pointer-events-none" />
                                            <div className="absolute inset-3 rounded-lg border border-purple-500/20 pointer-events-none" />

                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.5)] group-hover:scale-110 transition-transform duration-300">
                                                <Sparkles size={24} className="text-white drop-shadow" />
                                            </div>

                                            <span className="text-[11px] font-mono font-extrabold text-cyan-200 mt-2.5 tracking-wider uppercase drop-shadow">
                                                NEURON
                                            </span>
                                            <span className="text-[9px] font-mono text-cyan-400/80 font-semibold tracking-tight">
                                                TAP TO FLIP
                                            </span>
                                        </motion.div>
                                    ) : (
                                        /* Card Front Face (Revealed Item) */
                                        <motion.div
                                            key="card-front"
                                            initial={{ rotateY: 90, opacity: 0 }}
                                            animate={{ rotateY: 0, opacity: 1 }}
                                            exit={{ rotateY: -90, opacity: 0 }}
                                            transition={{ duration: 0.22 }}
                                            className={`w-full h-full rounded-2xl ${card.bg} border-2 flex flex-col items-center justify-center p-3 shadow-xl ${
                                                isMatched 
                                                    ? 'border-emerald-400 bg-emerald-950/95 shadow-[0_0_25px_rgba(16,185,129,0.4)]' 
                                                    : 'border-cyan-400 bg-slate-900 shadow-[0_0_20px_rgba(0,240,255,0.35)]'
                                            }`}
                                        >
                                            <div className={`p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 mb-2 ${card.color} shadow-inner`}>
                                                <IconComponent size={34} />
                                            </div>
                                            <span className="text-xs sm:text-sm font-display font-bold text-white text-center tracking-wide drop-shadow-sm">
                                                {card.label}
                                            </span>
                                            {isMatched && (
                                                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                                                    <CheckCircle2 size={11} />
                                                    <span>MATCHED</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            {/* Victory Celebration Modal */}
            <AnimatePresence>
                {isWon && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <div className="bg-gradient-to-b from-slate-900 via-[#0c1424] to-[#060b14] border-2 border-cyan-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_60px_rgba(0,240,255,0.35)]">
                            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center mx-auto mb-4 text-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.4)]">
                                <Trophy size={36} className="animate-bounce" />
                            </div>

                            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white mb-2">
                                Memory Mastered!
                            </h3>

                            <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
                                Phenomenal recall! You connected every single memory item in <strong className="text-cyan-300">{difficulty === 0 ? 'Gentle' : difficulty === 1 ? 'Classic' : 'Stimulating'} Mode</strong>.
                            </p>

                            {/* Stats Summary Card */}
                            <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6 font-mono text-xs">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">Time</span>
                                    <strong className="text-cyan-300 text-sm">{formatTime(seconds)}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">Turns</span>
                                    <strong className="text-amber-300 text-sm">{moves}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">Points</span>
                                    <strong className="text-emerald-400 text-sm">+350</strong>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => initGame(difficulty)}
                                    className="px-5 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={15} />
                                    <span>Play Again</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const nextDiff = (difficulty + 1) % DIFFICULTY_LEVELS.length;
                                        setDifficulty(nextDiff);
                                        initGame(nextDiff);
                                    }}
                                    className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold font-mono text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer flex items-center justify-center gap-2"
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

            {/* Game Over / Out of Turns Modal */}
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
                                Turns Limit Reached!
                            </h3>

                            <p className="text-slate-300 text-xs sm:text-sm mb-5 leading-relaxed">
                                You reached the move limit for this session ({totalMaxMoves} turns). Would you like to continue right where you left off or start fresh?
                            </p>

                            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-6 font-mono text-xs text-slate-300 flex justify-around">
                                <div>Pairs Matched: <strong className="text-cyan-300">{matchedCardIds.size} / {currentConfig.pairs}</strong></div>
                                <div>Time: <strong className="text-white">{formatTime(seconds)}</strong></div>
                            </div>

                            {/* Choice Buttons: Continue (Watch Ad) vs Play Again */}
                            <div className="flex flex-col gap-3 justify-center">
                                <button
                                    onClick={() => setShowAdModal(true)}
                                    className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold font-mono text-sm transition-all shadow-[0_0_25px_rgba(245,158,11,0.5)] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={16} />
                                    <span>Continue Playing (Watch Sponsor Ad 🎬)</span>
                                </button>

                                <button
                                    onClick={() => initGame(difficulty)}
                                    className="w-full px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={14} />
                                    <span>Play Again (Restart Level)</span>
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

            {/* Rewarded Ad Simulation Modal */}
            <AdRewardModal
                isOpen={showAdModal}
                onClose={() => setShowAdModal(false)}
                onRewardEarned={handleAdRewardEarned}
                rewardDescription="Resume deck with +14 Bonus Turns without losing matched pairs!"
            />
        </div>
    );
}
