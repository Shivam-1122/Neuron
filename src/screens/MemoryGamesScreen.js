import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import {
  Gamepad2,
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Flame,
  Key,
  Glasses,
  Pill,
  Camera,
  Coffee,
  Home,
  Music,
  Activity,
  Grid3X3,
  Heart,
} from 'lucide-react-native';
import * as Speech from 'expo-speech';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==========================================
// CORTEX MATCH DEFINITIONS
// ==========================================
const MATCH_ITEMS = [
  { id: 'key', label: 'House Key', icon: Key, color: Colors.amber },
  { id: 'glasses', label: 'Eyeglasses', icon: Glasses, color: Colors.cyan },
  { id: 'pill', label: 'Daily Medicine', icon: Pill, color: Colors.red },
  { id: 'photo', label: 'Family Photo', icon: Camera, color: Colors.purple },
  { id: 'coffee', label: 'Morning Tea', icon: Coffee, color: Colors.amber },
  { id: 'home', label: 'Comfort Home', icon: Home, color: Colors.cyan },
];

function buildMatchDeck(pairsCount = 4) {
  const chosen = MATCH_ITEMS.slice(0, pairsCount);
  const deck = [];
  chosen.forEach((item) => {
    deck.push({ uid: `${item.id}-1`, typeId: item.id, ...item });
    deck.push({ uid: `${item.id}-2`, typeId: item.id, ...item });
  });
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ==========================================
// NUMBER SORT DEFINITIONS (Sliding Puzzle)
// ==========================================
function generateShuffledTiles(size = 3) {
  const total = size * size;
  let arr = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));
  let emptyIdx = total - 1;
  let lastMove = -1;

  for (let step = 0; step < 60; step++) {
    const eRow = Math.floor(emptyIdx / size);
    const eCol = emptyIdx % size;
    const valid = [];
    if (eRow > 0) valid.push(emptyIdx - size);
    if (eRow < size - 1) valid.push(emptyIdx + size);
    if (eCol > 0) valid.push(emptyIdx - 1);
    if (eCol < size - 1) valid.push(emptyIdx + 1);

    const filtered = valid.filter((idx) => idx !== lastMove);
    const chosen = filtered.length > 0
      ? filtered[Math.floor(Math.random() * filtered.length)]
      : valid[Math.floor(Math.random() * valid.length)];

    lastMove = emptyIdx;
    arr[emptyIdx] = arr[chosen];
    arr[chosen] = 0;
    emptyIdx = chosen;
  }
  return arr;
}

export default function MemoryGamesScreen({ onBack }) {
  // Active view: 'hub' | 'cortex_match' | 'neuro_sequence' | 'number_sort'
  const [activeGame, setActiveGame] = useState('hub');

  // ==========================================
  // 1. CORTEX MATCH STATE
  // ==========================================
  const [matchDeck, setMatchDeck] = useState(() => buildMatchDeck(4));
  const [flippedCards, setFlippedCards] = useState([]); // Array of indices [i1, i2]
  const [matchedTypes, setMatchedTypes] = useState(new Set());
  const [matchMoves, setMatchMoves] = useState(0);
  const [matchWon, setMatchWon] = useState(false);
  const [matchTimer, setMatchTimer] = useState(0);
  const [matchPairsCount, setMatchPairsCount] = useState(4);

  // Timer for Cortex Match
  useEffect(() => {
    let interval = null;
    if (activeGame === 'cortex_match' && !matchWon) {
      interval = setInterval(() => setMatchTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [activeGame, matchWon]);

  const handleCardTap = (index) => {
    if (flippedCards.length === 2) return;
    if (flippedCards.includes(index)) return;
    const card = matchDeck[index];
    if (matchedTypes.has(card.typeId)) return;

    const nextFlipped = [...flippedCards, index];
    setFlippedCards(nextFlipped);

    if (nextFlipped.length === 2) {
      setMatchMoves((m) => m + 1);
      const card1 = matchDeck[nextFlipped[0]];
      const card2 = matchDeck[nextFlipped[1]];

      if (card1.typeId === card2.typeId) {
        // Matched!
        const nextMatched = new Set(matchedTypes);
        nextMatched.add(card1.typeId);
        setMatchedTypes(nextMatched);
        setFlippedCards([]);

        if (nextMatched.size === matchPairsCount) {
          setMatchWon(true);
          Speech.speak('Excellent recall! All pairs connected.');
        }
      } else {
        // Not matched, flip back after delay
        setTimeout(() => {
          setFlippedCards([]);
        }, 850);
      }
    }
  };

  const resetCortexMatch = (pairs = matchPairsCount) => {
    setMatchPairsCount(pairs);
    setMatchDeck(buildMatchDeck(pairs));
    setFlippedCards([]);
    setMatchedTypes(new Set());
    setMatchMoves(0);
    setMatchWon(false);
    setMatchTimer(0);
  };

  // ==========================================
  // 2. NEURO SEQUENCE STATE
  // ==========================================
  const [sequence, setSequence] = useState([0, 1]);
  const [playerInput, setPlayerInput] = useState([]);
  const [activeSeqNode, setActiveSeqNode] = useState(null);
  const [seqRound, setSeqRound] = useState(1);
  const [seqPlaying, setSeqPlaying] = useState(false);
  const [seqWon, setSeqWon] = useState(false);
  const [seqLives, setSeqLives] = useState(3);
  const [seqStatus, setSeqStatus] = useState('Watch the neural sequence.');

  const SEQ_NODES = [
    { id: 0, label: 'ALPHA', color: Colors.cyan, bg: 'rgba(0, 240, 255, 0.15)' },
    { id: 1, label: 'BETA', color: Colors.emerald, bg: 'rgba(16, 185, 129, 0.15)' },
    { id: 2, label: 'GAMMA', color: Colors.amber, bg: 'rgba(245, 158, 11, 0.15)' },
    { id: 3, label: 'DELTA', color: Colors.purple, bg: 'rgba(168, 85, 247, 0.15)' },
  ];

  const playSequencePattern = (seq) => {
    setSeqPlaying(true);
    setPlayerInput([]);
    setSeqStatus('Memorize the pattern...');

    seq.forEach((nodeId, idx) => {
      setTimeout(() => {
        setActiveSeqNode(nodeId);
        setTimeout(() => {
          setActiveSeqNode(null);
          if (idx === seq.length - 1) {
            setSeqPlaying(false);
            setSeqStatus('Your turn! Repeat the pattern.');
          }
        }, 400);
      }, (idx + 1) * 650);
    });
  };

  const startNeuroSequence = () => {
    const initial = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
    setSequence(initial);
    setSeqRound(1);
    setSeqLives(3);
    setSeqWon(false);
    playSequencePattern(initial);
  };

  const handleSeqNodeTap = (nodeId) => {
    if (seqPlaying || seqWon) return;

    setActiveSeqNode(nodeId);
    setTimeout(() => setActiveSeqNode(null), 250);

    const nextInput = [...playerInput, nodeId];
    setPlayerInput(nextInput);
    const currIdx = nextInput.length - 1;

    if (sequence[currIdx] !== nodeId) {
      // Mistake
      const remLives = seqLives - 1;
      setSeqLives(remLives);
      if (remLives <= 0) {
        setSeqStatus('Sequence disconnected. Restarting...');
        setTimeout(() => startNeuroSequence(), 1500);
      } else {
        setSeqStatus(`Misstep! ${remLives} attempts remaining.`);
        setTimeout(() => playSequencePattern(sequence), 1000);
      }
      return;
    }

    if (nextInput.length === sequence.length) {
      // Round completed!
      if (seqRound >= 5) {
        setSeqWon(true);
        setSeqStatus('Neural Sequence Mastered!');
        Speech.speak('Neural synchronization complete! Well done.');
      } else {
        const nextRound = seqRound + 1;
        setSeqRound(nextRound);
        const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
        setSequence(nextSeq);
        setSeqStatus(`Round ${seqRound} verified! Prepare for next round.`);
        setTimeout(() => playSequencePattern(nextSeq), 1200);
      }
    }
  };

  // ==========================================
  // 3. NUMBER SORT STATE
  // ==========================================
  const [boardTiles, setBoardTiles] = useState(() => generateShuffledTiles(3));
  const [sortMoves, setSortMoves] = useState(0);
  const [sortTimer, setSortTimer] = useState(0);
  const [sortWon, setSortWon] = useState(false);

  useEffect(() => {
    let interval = null;
    if (activeGame === 'number_sort' && !sortWon) {
      interval = setInterval(() => setSortTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [activeGame, sortWon]);

  const handleTileTap = (tileIdx) => {
    if (sortWon) return;
    const size = 3;
    const emptyIdx = boardTiles.indexOf(0);

    const tRow = Math.floor(tileIdx / size);
    const tCol = tileIdx % size;
    const eRow = Math.floor(emptyIdx / size);
    const eCol = emptyIdx % size;

    const isAdjacent =
      (Math.abs(tRow - eRow) === 1 && tCol === eCol) ||
      (Math.abs(tCol - eCol) === 1 && tRow === eRow);

    if (isAdjacent) {
      const nextTiles = [...boardTiles];
      nextTiles[emptyIdx] = nextTiles[tileIdx];
      nextTiles[tileIdx] = 0;
      setBoardTiles(nextTiles);
      setSortMoves((m) => m + 1);

      // Check win: [1, 2, 3, 4, 5, 6, 7, 8, 0]
      const isComplete = nextTiles.every((val, i) =>
        i === nextTiles.length - 1 ? val === 0 : val === i + 1
      );
      if (isComplete) {
        setSortWon(true);
        Speech.speak('Puzzle solved! Numbers in perfect harmony.');
      }
    }
  };

  const resetNumberSort = () => {
    setBoardTiles(generateShuffledTiles(3));
    setSortMoves(0);
    setSortTimer(0);
    setSortWon(false);
  };

  // ==========================================
  // RENDER GAME HUB
  // ==========================================
  if (activeGame === 'hub') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.hubContent}>
        {/* Header */}
        <View style={styles.hubHeader}>
          <View style={styles.hubBadge}>
            <Gamepad2 color={Colors.cyan} size={14} />
            <Text style={styles.hubBadgeText}>COGNITIVE MEMORY GYM</Text>
          </View>
          <Text style={styles.hubTitle}>Neural Training Protocols</Text>
          <Text style={styles.hubSub}>
            Daily cognitive exercises scientifically structured to stimulate recall and visual focus.
          </Text>
        </View>

        {/* 1. Cortex Match Card */}
        <TouchableOpacity
          style={[styles.gameCard, { borderColor: Colors.cyanBorder }]}
          activeOpacity={0.8}
          onPress={() => {
            resetCortexMatch(4);
            setActiveGame('cortex_match');
          }}
        >
          <View style={styles.gameCardHeader}>
            <View style={[styles.gameIconBox, { backgroundColor: 'rgba(0, 240, 255, 0.1)', borderColor: Colors.cyanBorder }]}>
              <Flame color={Colors.cyan} size={24} />
            </View>
            <View style={[styles.diffBadge, { borderColor: Colors.cyanBorder }]}>
              <Text style={[styles.diffBadgeText, { color: Colors.cyan }]}>MEMORY MATRIX</Text>
            </View>
          </View>
          <Text style={styles.gameCardTitle}>Cortex Match</Text>
          <Text style={styles.gameCardDesc}>
            Flip cards to discover and connect matching household and personal memory icons.
          </Text>
          <View style={styles.gameCardFooter}>
            <Text style={[styles.playBtnText, { color: Colors.cyan }]}>LAUNCH EXERCISE</Text>
            <Clock color={Colors.textMuted} size={13} />
          </View>
        </TouchableOpacity>

        {/* 2. Neuro Sequence Card */}
        <TouchableOpacity
          style={[styles.gameCard, { borderColor: Colors.emeraldBorder }]}
          activeOpacity={0.8}
          onPress={() => {
            setActiveGame('neuro_sequence');
            setTimeout(() => startNeuroSequence(), 300);
          }}
        >
          <View style={styles.gameCardHeader}>
            <View style={[styles.gameIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: Colors.emeraldBorder }]}>
              <Activity color={Colors.emerald} size={24} />
            </View>
            <View style={[styles.diffBadge, { borderColor: Colors.emeraldBorder }]}>
              <Text style={[styles.diffBadgeText, { color: Colors.emerald }]}>PATTERN RECALL</Text>
            </View>
          </View>
          <Text style={styles.gameCardTitle}>Neuro Sequence</Text>
          <Text style={styles.gameCardDesc}>
            Observe and repeat glowing neural frequency light nodes in ascending patterns.
          </Text>
          <View style={styles.gameCardFooter}>
            <Text style={[styles.playBtnText, { color: Colors.emerald }]}>LAUNCH EXERCISE</Text>
            <Clock color={Colors.textMuted} size={13} />
          </View>
        </TouchableOpacity>

        {/* 3. Number Sort Card */}
        <TouchableOpacity
          style={[styles.gameCard, { borderColor: Colors.amberBorder }]}
          activeOpacity={0.8}
          onPress={() => {
            resetNumberSort();
            setActiveGame('number_sort');
          }}
        >
          <View style={styles.gameCardHeader}>
            <View style={[styles.gameIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: Colors.amberBorder }]}>
              <Grid3X3 color={Colors.amber} size={24} />
            </View>
            <View style={[styles.diffBadge, { borderColor: Colors.amberBorder }]}>
              <Text style={[styles.diffBadgeText, { color: Colors.amber }]}>SPATIAL LOGIC</Text>
            </View>
          </View>
          <Text style={styles.gameCardTitle}>Number Sort</Text>
          <Text style={styles.gameCardDesc}>
            Slide numbered memory tiles to reconstruct sequential numerical order from 1 to 8.
          </Text>
          <View style={styles.gameCardFooter}>
            <Text style={[styles.playBtnText, { color: Colors.amber }]}>LAUNCH EXERCISE</Text>
            <Clock color={Colors.textMuted} size={13} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================
  // RENDER CORTEX MATCH
  // ==========================================
  if (activeGame === 'cortex_match') {
    return (
      <View style={styles.gameContainer}>
        {/* Top Bar */}
        <View style={styles.gameTopBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setActiveGame('hub')}>
            <ArrowLeft color={Colors.textPrimary} size={18} />
          </TouchableOpacity>
          <View>
            <Text style={styles.gameActiveTitle}>CORTEX MATCH</Text>
            <Text style={styles.gameActiveSub}>Pairs: {matchedTypes.size} / {matchPairsCount}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => resetCortexMatch()}>
            <RotateCcw color={Colors.cyan} size={16} />
          </TouchableOpacity>
        </View>

        {/* HUD Stats */}
        <View style={styles.statsStrip}>
          <View style={styles.statPill}>
            <Clock color={Colors.cyan} size={12} />
            <Text style={styles.statText}>{matchTimer}s</Text>
          </View>
          <View style={styles.statPill}>
            <Flame color={Colors.amber} size={12} />
            <Text style={styles.statText}>{matchMoves} Moves</Text>
          </View>
          <View style={styles.diffSelector}>
            <TouchableOpacity
              style={[styles.diffBtn, matchPairsCount === 4 && styles.diffBtnActive]}
              onPress={() => resetCortexMatch(4)}
            >
              <Text style={styles.diffBtnText}>8 Cards</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.diffBtn, matchPairsCount === 6 && styles.diffBtnActive]}
              onPress={() => resetCortexMatch(6)}
            >
              <Text style={styles.diffBtnText}>12 Cards</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Grid */}
        <View style={styles.matchGrid}>
          {matchDeck.map((card, idx) => {
            const isFlipped = flippedCards.includes(idx) || matchedTypes.has(card.typeId);
            const isMatched = matchedTypes.has(card.typeId);
            const IconComp = card.icon;

            return (
              <TouchableOpacity
                key={card.uid}
                style={[
                  styles.cardTile,
                  isFlipped && styles.cardTileFlipped,
                  isMatched && styles.cardTileMatched,
                ]}
                onPress={() => handleCardTap(idx)}
                activeOpacity={0.7}
              >
                {isFlipped ? (
                  <View style={styles.cardFront}>
                    <IconComp color={card.color} size={28} />
                    <Text style={[styles.cardLabel, { color: card.color }]}>
                      {card.label}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.cardBack}>
                    <Sparkles color="rgba(0, 240, 255, 0.4)" size={20} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Win Banner */}
        {matchWon && (
          <View style={styles.winBanner}>
            <Trophy color={Colors.amber} size={24} />
            <Text style={styles.winBannerTitle}>Memory Circuit Synchronized!</Text>
            <Text style={styles.winBannerSub}>
              Completed in {matchMoves} moves and {matchTimer} seconds.
            </Text>
            <TouchableOpacity style={styles.winPlayAgain} onPress={() => resetCortexMatch()}>
              <Text style={styles.winPlayAgainText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ==========================================
  // RENDER NEURO SEQUENCE
  // ==========================================
  if (activeGame === 'neuro_sequence') {
    return (
      <View style={styles.gameContainer}>
        {/* Top Bar */}
        <View style={styles.gameTopBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setActiveGame('hub')}>
            <ArrowLeft color={Colors.textPrimary} size={18} />
          </TouchableOpacity>
          <View>
            <Text style={styles.gameActiveTitle}>NEURO SEQUENCE</Text>
            <Text style={styles.gameActiveSub}>Round {seqRound} of 5</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => startNeuroSequence()}>
            <RotateCcw color={Colors.emerald} size={16} />
          </TouchableOpacity>
        </View>

        {/* Status Prompt */}
        <View style={styles.seqStatusCard}>
          <Text style={styles.seqStatusText}>{seqStatus}</Text>
          <View style={styles.seqLivesRow}>
            {[1, 2, 3].map((l) => (
              <Heart
                key={l}
                color={l <= seqLives ? Colors.red : Colors.textDark}
                fill={l <= seqLives ? Colors.red : 'transparent'}
                size={16}
              />
            ))}
          </View>
        </View>

        {/* 4 Neural Light Nodes */}
        <View style={styles.seqNodesGrid}>
          {SEQ_NODES.map((node) => {
            const isActive = activeSeqNode === node.id;
            return (
              <TouchableOpacity
                key={node.id}
                style={[
                  styles.seqNode,
                  { borderColor: node.color, backgroundColor: node.bg },
                  isActive && {
                    backgroundColor: node.color,
                    shadowColor: node.color,
                    shadowOpacity: 0.9,
                    shadowRadius: 20,
                    elevation: 15,
                  },
                ]}
                onPress={() => handleSeqNodeTap(node.id)}
                activeOpacity={0.8}
              >
                <Activity
                  color={isActive ? '#060a12' : node.color}
                  size={32}
                />
                <Text
                  style={[
                    styles.seqNodeLabel,
                    { color: isActive ? '#060a12' : node.color },
                  ]}
                >
                  {node.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Win Banner */}
        {seqWon && (
          <View style={styles.winBanner}>
            <Trophy color={Colors.emerald} size={24} />
            <Text style={styles.winBannerTitle}>Sequence Mastered!</Text>
            <Text style={styles.winBannerSub}>
              All 5 neural frequency rounds successfully reproduced!
            </Text>
            <TouchableOpacity style={styles.winPlayAgain} onPress={() => startNeuroSequence()}>
              <Text style={styles.winPlayAgainText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // ==========================================
  // RENDER NUMBER SORT
  // ==========================================
  if (activeGame === 'number_sort') {
    return (
      <View style={styles.gameContainer}>
        {/* Top Bar */}
        <View style={styles.gameTopBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setActiveGame('hub')}>
            <ArrowLeft color={Colors.textPrimary} size={18} />
          </TouchableOpacity>
          <View>
            <Text style={styles.gameActiveTitle}>NUMBER SORT</Text>
            <Text style={styles.gameActiveSub}>8-Puzzle Spatial Logic</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => resetNumberSort()}>
            <RotateCcw color={Colors.amber} size={16} />
          </TouchableOpacity>
        </View>

        {/* HUD Stats */}
        <View style={styles.statsStrip}>
          <View style={styles.statPill}>
            <Clock color={Colors.amber} size={12} />
            <Text style={styles.statText}>{sortTimer}s</Text>
          </View>
          <View style={styles.statPill}>
            <Grid3X3 color={Colors.amber} size={12} />
            <Text style={styles.statText}>{sortMoves} Moves</Text>
          </View>
        </View>

        {/* 3x3 Tile Grid */}
        <View style={styles.sortBoard}>
          {boardTiles.map((val, idx) => {
            const isEmpty = val === 0;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.sortTile, isEmpty && styles.sortTileEmpty]}
                onPress={() => handleTileTap(idx)}
                disabled={isEmpty}
                activeOpacity={0.7}
              >
                {!isEmpty && (
                  <Text style={styles.sortTileText}>{val}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Win Banner */}
        {sortWon && (
          <View style={styles.winBanner}>
            <Trophy color={Colors.amber} size={24} />
            <Text style={styles.winBannerTitle}>Puzzle Solved!</Text>
            <Text style={styles.winBannerSub}>
              Numbers restored in sequential order in {sortMoves} moves!
            </Text>
            <TouchableOpacity style={styles.winPlayAgain} onPress={() => resetNumberSort()}>
              <Text style={styles.winPlayAgainText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hubContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  hubHeader: {
    marginBottom: 20,
  },
  hubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.cyanBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  hubBadgeText: {
    color: Colors.cyan,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hubTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  hubSub: {
    color: Colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },
  gameCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  gameCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gameIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  diffBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  gameCardTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  gameCardDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 14,
  },
  gameCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  playBtnText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  gameTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameActiveTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  gameActiveSub: {
    color: Colors.cyan,
    fontSize: 9.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 10,
    marginBottom: 14,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  diffSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  diffBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  diffBtnActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderColor: Colors.cyanBorder,
  },
  diffBtnText: {
    color: Colors.textPrimary,
    fontSize: 9,
    fontWeight: '700',
  },
  matchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTile: {
    width: (SCREEN_WIDTH - 52) / 3,
    height: 95,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTileFlipped: {
    borderColor: Colors.cyan,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  cardTileMatched: {
    borderColor: Colors.emerald,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    opacity: 0.8,
  },
  cardFront: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 4,
  },
  cardLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardBack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seqStatusCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  seqStatusText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  seqLivesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  seqNodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  seqNode: {
    width: (SCREEN_WIDTH - 48) / 2,
    height: 130,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  seqNodeLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sortBoard: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  sortTile: {
    width: (SCREEN_WIDTH - 64) / 3,
    height: (SCREEN_WIDTH - 64) / 3,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: Colors.amberBorder,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortTileEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  sortTileText: {
    color: Colors.amber,
    fontSize: 26,
    fontWeight: '900',
  },
  winBanner: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.emerald,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  winBannerTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 6,
  },
  winBannerSub: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  winPlayAgain: {
    marginTop: 12,
    backgroundColor: Colors.emerald,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  winPlayAgainText: {
    color: '#060a12',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
