import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Grid3X3, 
    RotateCcw, 
    Trophy, 
    Clock, 
    Sparkles, 
    CheckCircle2, 
    ArrowLeft, 
    ArrowRight, 
    ArrowUp, 
    ArrowDown,
    Palette,
    Flame,
    Play,
    AlertCircle,
    LogOut,
    Lightbulb
} from 'lucide-react';
import sound from './soundSynth';
import AdRewardModal from './AdRewardModal';

const SIZES = [
    { size: 3, label: '3 × 3', tiles: 8, desc: '8-Puzzle • Gentle / Beginner', baseMaxMoves: 80 },
    { size: 4, label: '4 × 4', tiles: 15, desc: '15-Puzzle • Classic Challenge', baseMaxMoves: 160 },
    { size: 5, label: '5 × 5', tiles: 24, desc: '24-Puzzle • Master Mind', baseMaxMoves: 260 },
];

function generateShuffledBoard(gridDim) {
    const total = gridDim * gridDim;
    let arr = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));
    let emptyIdx = total - 1;
    let lastMove = -1;

    const shuffleSteps = gridDim === 3 ? 80 : gridDim === 4 ? 140 : 200;

    for (let step = 0; step < shuffleSteps; step++) {
        const eRow = Math.floor(emptyIdx / gridDim);
        const eCol = emptyIdx % gridDim;
        const validNeighbors = [];

        if (eRow > 0) validNeighbors.push(emptyIdx - gridDim); // up
        if (eRow < gridDim - 1) validNeighbors.push(emptyIdx + gridDim); // down
        if (eCol > 0) validNeighbors.push(emptyIdx - 1); // left
        if (eCol < gridDim - 1) validNeighbors.push(emptyIdx + 1); // right

        const filtered = validNeighbors.filter(idx => idx !== lastMove);
        const chosen = filtered.length > 0
            ? filtered[Math.floor(Math.random() * filtered.length)]
            : validNeighbors[Math.floor(Math.random() * validNeighbors.length)];

        lastMove = emptyIdx;
        arr[emptyIdx] = arr[chosen];
        arr[chosen] = 0;
        emptyIdx = chosen;
    }

    return arr;
}

export default function NumberSort({ onScoreEarned, onExit }) {
    const [sizeIndex, setSizeIndex] = useState(0); // 0 = 3x3, 1 = 4x4, 2 = 5x5
    const gridSize = SIZES[sizeIndex].size;
    const totalTiles = gridSize * gridSize;

    const [board, setBoard] = useState(() => generateShuffledBoard(SIZES[0].size));
    const [moves, setMoves] = useState(0);
    const [bonusMoves, setBonusMoves] = useState(0);
    const [isWon, setIsWon] = useState(false);
    const [isLost, setIsLost] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [timerActive, setTimerActive] = useState(true);
    const [theme, setTheme] = useState('wood'); // 'wood' | 'cyber'
    const [showAdModal, setShowAdModal] = useState(false);
    const [hintTiles, setHintTiles] = useState([]);

    const totalMaxMoves = SIZES[sizeIndex].baseMaxMoves + bonusMoves;

    // Timer
    useEffect(() => {
        let interval = null;
        if (timerActive && !isWon && !isLost) {
            interval = setInterval(() => setSeconds(s => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, isWon, isLost]);

    // Check if board is solved
    const checkIsSolved = (currentBoard) => {
        if (!currentBoard || currentBoard.length !== totalTiles) return false;
        for (let i = 0; i < totalTiles - 1; i++) {
            if (currentBoard[i] !== i + 1) return false;
        }
        return currentBoard[totalTiles - 1] === 0;
    };

    // Shuffle by making valid moves from solved state to guarantee solvability
    const shuffleBoard = useCallback((gridDim = gridSize) => {
        const arr = generateShuffledBoard(gridDim);
        setBoard(arr);
        setMoves(0);
        setBonusMoves(0);
        setIsWon(false);
        setIsLost(false);
        setSeconds(0);
        setTimerActive(true);
        setHintTiles([]);
    }, [gridSize]);

    const handleShowHint = () => {
        if (isWon || isLost) return;
        const emptyIdx = board.indexOf(0);
        if (emptyIdx === -1) return;
        const eRow = Math.floor(emptyIdx / gridSize);
        const eCol = emptyIdx % gridSize;
        const valid = [];
        if (eRow > 0) valid.push(emptyIdx - gridSize);
        if (eRow < gridSize - 1) valid.push(emptyIdx + gridSize);
        if (eCol > 0) valid.push(emptyIdx - 1);
        if (eCol < gridSize - 1) valid.push(emptyIdx + 1);

        setHintTiles(valid);
        sound.playCardFlip();
        setTimeout(() => {
            setHintTiles([]);
        }, 2200);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            shuffleBoard(gridSize);
        }, 0);
        return () => clearTimeout(timer);
    }, [sizeIndex, gridSize, shuffleBoard]);

    // Find empty slot index
    const emptyIndex = board.indexOf(0);
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;

    // Check direction to empty slot for a given tile
    const getSlideDirection = (idx) => {
        const row = Math.floor(idx / gridSize);
        const col = idx % gridSize;

        if (row === emptyRow) {
            if (col === emptyCol + 1) return 'left';
            if (col === emptyCol - 1) return 'right';
        }
        if (col === emptyCol) {
            if (row === emptyRow + 1) return 'up';
            if (row === emptyRow - 1) return 'down';
        }
        return null;
    };

    // Handle tile slide
    const handleTileClick = (idx) => {
        if (isWon || isLost || board[idx] === 0) return;

        const row = Math.floor(idx / gridSize);
        const col = idx % gridSize;

        let moved = false;
        let newBoard = [...board];

        // Direct neighbor slide
        const isNeighbor = (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
                           (col === emptyCol && Math.abs(row - emptyRow) === 1);

        if (isNeighbor) {
            sound.playCardFlip();
            newBoard[emptyIndex] = newBoard[idx];
            newBoard[idx] = 0;
            moved = true;
        } else if (row === emptyRow) {
            // Multi-tile slide in same row
            sound.playCardFlip();
            const step = col < emptyCol ? 1 : -1;
            for (let c = emptyCol; c !== col; c -= step) {
                newBoard[row * gridSize + c] = newBoard[row * gridSize + (c - step)];
            }
            newBoard[row * gridSize + col] = 0;
            moved = true;
        } else if (col === emptyCol) {
            // Multi-tile slide in same col
            sound.playCardFlip();
            const step = row < emptyRow ? 1 : -1;
            for (let r = emptyRow; r !== row; r -= step) {
                newBoard[r * gridSize + col] = newBoard[(r - step) * gridSize + col];
            }
            newBoard[row * gridSize + col] = 0;
            moved = true;
        }

        if (moved) {
            const nextMoves = moves + 1;
            setMoves(nextMoves);
            setBoard(newBoard);

            if (checkIsSolved(newBoard)) {
                setIsWon(true);
                setTimerActive(false);
                sound.playVictory();
                if (onScoreEarned) {
                    onScoreEarned(200 + gridSize * 50);
                }
            } else if (nextMoves >= totalMaxMoves) {
                // Out of moves
                setIsLost(true);
                setTimerActive(false);
                sound.playTryAgain();
            }
        }
    };

    const formatTime = (totalSec) => {
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Count correctly placed tiles
    const correctTilesCount = board.filter((num, idx) => num !== 0 && num === idx + 1).length;

    // Continue Playing via Rewarded Ad
    const handleAdRewardEarned = () => {
        setShowAdModal(false);
        setBonusMoves(prev => prev + 40); // Add 40 extra moves
        setIsLost(false);
        setTimerActive(true);
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none">
            {/* Control & Telemetry Bar */}
            <div className="w-full flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 mb-6 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Puzzle Size:</span>
                    <div className="flex gap-1.5">
                        {SIZES.map((item, idx) => (
                            <button
                                key={item.label}
                                onClick={() => setSizeIndex(idx)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                                    sizeIndex === idx
                                        ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status Chips */}
                <div className="flex items-center flex-wrap gap-2.5">
                    {/* Live Timer */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-cyan-300 text-xs font-mono font-bold">
                        <Clock size={13} className="text-cyan-400" />
                        <span>{formatTime(seconds)}</span>
                    </div>

                    {/* Moves Counter with Alert on low moves */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                        totalMaxMoves - moves <= 10
                            ? 'bg-rose-950/50 border-rose-500/50 text-rose-300 animate-pulse'
                            : 'bg-slate-800/90 border-slate-700 text-slate-300'
                    }`}>
                        <Flame size={13} className="text-amber-400" />
                        <span>Moves: <strong className="text-white">{moves}</strong> / {totalMaxMoves}</span>
                    </div>

                    {/* Correct Tiles */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-emerald-300 text-xs font-mono font-bold">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span>{correctTilesCount} / {totalTiles - 1} Solved</span>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(t => t === 'wood' ? 'cyber' : 'wood')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                        title="Toggle Wooden / Cyber Aesthetic"
                    >
                        <Palette size={13} className="text-amber-400" />
                        <span>{theme === 'wood' ? 'Woodcraft' : 'Cyber'}</span>
                    </button>

                    {/* Hint Button */}
                    <button
                        onClick={handleShowHint}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                        title="Show Movable Blocks"
                    >
                        <Lightbulb size={13} className="text-amber-400" />
                        <span>Hint</span>
                    </button>

                    {/* Shuffle Button */}
                    <button
                        onClick={() => shuffleBoard(gridSize)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    >
                        <RotateCcw size={13} />
                        <span>Shuffle</span>
                    </button>

                    {onExit && (
                        <button
                            onClick={onExit}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-rose-950/40 text-rose-400 hover:bg-rose-900/40 hover:text-rose-300 border border-rose-500/30 transition cursor-pointer"
                            title="Exit Game"
                        >
                            <LogOut size={13} />
                            <span>Exit</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Instruction Banner */}
            <div className="w-full mb-6 p-3.5 px-5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-amber-200 text-sm">
                <div className="flex items-center gap-2.5">
                    <Grid3X3 size={18} className="text-amber-400 shrink-0" />
                    <span>Slide numbered tiles into ascending order (1, 2, 3...) using the empty slot.</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono text-amber-400/80">
                    <Sparkles size={13} />
                    <span>{gridSize}×{gridSize} Board</span>
                </div>
            </div>

            {/* Woodcraft / Cyber Tile Container */}
            <div className={`p-4 sm:p-6 rounded-3xl mx-auto max-w-md w-full shadow-2xl transition-all duration-300 ${
                theme === 'wood'
                    ? 'bg-gradient-to-b from-[#2a1708] via-[#1f1005] to-[#140a03] border-4 border-[#5c3718] shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_2px_8px_rgba(255,200,120,0.15)]'
                    : 'bg-slate-900/90 border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(0,240,255,0.2)]'
            }`}>
                <div 
                    className="grid gap-2 sm:gap-3 w-full aspect-square select-none"
                    style={{
                        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
                    }}
                >
                    {board.map((val, idx) => {
                        const isEmpty = val === 0;
                        const isCorrect = val === idx + 1;

                        if (isEmpty) {
                            return (
                                <div
                                    key={`empty-${idx}`}
                                    className={`rounded-2xl border transition-all ${
                                        theme === 'wood'
                                            ? 'bg-[#120702]/80 border-[#3a200f]/60 shadow-[inset_0_3px_8px_rgba(0,0,0,0.9)]'
                                            : 'bg-slate-950/60 border-slate-800 shadow-inner'
                                    }`}
                                />
                            );
                        }

                        const dir = getSlideDirection(idx);
                        const isMovable = dir !== null;

                        return (
                            <motion.button
                                key={`tile-${val}`}
                                layout
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                whileHover={isMovable ? { scale: 1.03 } : {}}
                                whileTap={isMovable ? { scale: 0.96 } : {}}
                                onClick={() => handleTileClick(idx)}
                                disabled={isWon || isLost}
                                className={`w-full h-full rounded-2xl flex flex-col items-center justify-center font-display font-extrabold cursor-pointer relative transition-transform duration-100 ${
                                    hintTiles.includes(idx) ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_25px_rgba(245,158,11,0.9)] animate-pulse z-20 ' : ''
                                }${
                                    theme === 'wood'
                                        ? isCorrect
                                            ? 'bg-gradient-to-b from-[#b45309] to-[#78350f] text-amber-100 border-2 border-amber-400 shadow-[0_6px_0_#451a03,0_10px_20px_rgba(0,0,0,0.6)] active:translate-y-1 active:shadow-[0_2px_0_#451a03]'
                                            : isMovable
                                                ? 'bg-gradient-to-b from-[#b45309] via-[#92400e] to-[#5a2406] text-amber-200 border-2 border-amber-500/70 shadow-[0_6px_0_#381503,0_10px_15px_rgba(245,158,11,0.25)] active:translate-y-1 active:shadow-[0_2px_0_#381503]'
                                                : 'bg-gradient-to-b from-[#78350f] to-[#451a03] text-amber-300/80 border-2 border-[#5c2707]/60 shadow-[0_4px_0_#2b1002,0_6px_10px_rgba(0,0,0,0.5)] opacity-90'
                                        : isCorrect
                                            ? 'bg-emerald-950/80 text-emerald-300 border-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                            : isMovable
                                                ? 'bg-slate-800 text-cyan-200 border-2 border-cyan-500/60 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                                                : 'bg-slate-900/90 text-slate-400 border-2 border-slate-800 shadow-md'
                                }`}
                                style={{
                                    fontSize: gridSize === 3 ? '1.85rem' : gridSize === 4 ? '1.45rem' : '1.15rem'
                                }}
                            >
                                <span>{val}</span>
                                {isCorrect && (
                                    <span className="absolute bottom-1 right-1.5 opacity-80">
                                        <CheckCircle2 size={gridSize === 5 ? 10 : 12} />
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Victory Celebration Modal */}
            <AnimatePresence>
                {isWon && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
                    >
                        <div className="bg-gradient-to-b from-slate-900 via-[#18150c] to-[#0d0a04] border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_60px_rgba(245,158,11,0.35)]">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                                <Trophy size={36} className="animate-bounce" />
                            </div>

                            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white mb-2">
                                Puzzle Solved!
                            </h3>

                            <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
                                Exceptional spatial logic! You placed all tiles in numerical order on the <strong className="text-amber-300">{SIZES[sizeIndex].label} Board</strong>.
                            </p>

                            {/* Stats Summary Card */}
                            <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6 font-mono text-xs">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">Time</span>
                                    <strong className="text-cyan-300 text-sm">{formatTime(seconds)}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">Moves</span>
                                    <strong className="text-amber-300 text-sm">{moves}</strong>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase">Score</span>
                                    <strong className="text-emerald-400 text-sm">+{200 + gridSize * 50}</strong>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => shuffleBoard(gridSize)}
                                    className="px-5 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={15} />
                                    <span>Play Again</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const nextIdx = (sizeIndex + 1) % SIZES.length;
                                        setSizeIndex(nextIdx);
                                    }}
                                    className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold font-mono text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <Play size={15} fill="currentColor" />
                                    <span>Next Grid ({SIZES[(sizeIndex + 1) % SIZES.length].label})</span>
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

            {/* Game Over / Move Limit Modal */}
            <AnimatePresence>
                {isLost && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
                    >
                        <div className="bg-gradient-to-b from-slate-900 via-[#1c1212] to-[#0c0707] border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_60px_rgba(244,63,94,0.35)]">
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center mx-auto mb-4 text-rose-400">
                                <AlertCircle size={36} />
                            </div>

                            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-white mb-2">
                                Move Limit Reached!
                            </h3>

                            <p className="text-slate-300 text-xs sm:text-sm mb-5 leading-relaxed">
                                You reached the move limit ({totalMaxMoves} moves) for this {SIZES[sizeIndex].label} puzzle. Keep going with bonus moves or restart fresh!
                            </p>

                            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-6 font-mono text-xs text-slate-300 flex justify-around">
                                <div>Tiles Solved: <strong className="text-emerald-400">{correctTilesCount} / {totalTiles - 1}</strong></div>
                                <div>Time: <strong className="text-white">{formatTime(seconds)}</strong></div>
                            </div>

                            {/* Buttons */}
                            <div className="flex flex-col gap-3 justify-center">
                                <button
                                    onClick={() => setShowAdModal(true)}
                                    className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold font-mono text-sm transition-all shadow-[0_0_25px_rgba(245,158,11,0.5)] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={16} />
                                    <span>Continue Solving (+40 Moves • Watch Ad 🎬)</span>
                                </button>

                                <button
                                    onClick={() => shuffleBoard(gridSize)}
                                    className="w-full px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={14} />
                                    <span>Play Again (New Shuffle)</span>
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
                rewardDescription={`Get +40 extra moves to continue solving your ${SIZES[sizeIndex].label} puzzle!`}
            />
        </div>
    );
}
