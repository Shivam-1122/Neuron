import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Colors, Shadows } from '../theme/colors';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Trophy,
  HelpCircle,
  Eye,
  CheckCircle2,
  Clock,
  Coffee,
  Key,
  Glasses,
  BookOpen,
  Camera,
  Heart,
  Pill,
  Sun,
  Footprints,
} from 'lucide-react-native';
import sound from '../utils/soundEngine';

const { width } = Dimensions.get('window');

// 1. CARDS FOR CORTEX MATCH
const CARD_ITEMS = [
  { id: 'glasses', name: 'Glasses', icon: Glasses, color: Colors.amber },
  { id: 'pill', name: 'Medicine', icon: Pill, color: Colors.emerald },
  { id: 'coffee', name: 'Tea Cup', icon: Coffee, color: '#f97316' },
  { id: 'key', name: 'House Key', icon: Key, color: '#eab308' },
  { id: 'clock', name: 'Clock', icon: Clock, color: Colors.cyan },
  { id: 'camera', name: 'Album', icon: Camera, color: Colors.purple },
  { id: 'book', name: 'Book', icon: BookOpen, color: '#ec4899' },
  { id: 'heart', name: 'Locket', icon: Heart, color: Colors.red },
];

// 3. DAILY ROUTINE STEPS
const ROUTINE_STEPS_MASTER = [
  { id: 'wake', text: 'Wake Up & Stretch', order: 1, icon: Sun, color: '#f59e0b' },
  { id: 'meds', text: 'Take Morning Medicine', order: 2, icon: Pill, color: '#10b981' },
  { id: 'breakfast', text: 'Enjoy Warm Breakfast', order: 3, icon: Coffee, color: '#f97316' },
  { id: 'walk', text: 'Take a Gentle Garden Walk', order: 4, icon: Footprints, color: '#06b6d4' },
];

export default function MemoryGamesScreen({ onBack }) {
  // Game Selector: 'cortex_match' | 'neuro_sequence' | 'daily_routine' | 'number_sort'
  const [activeGame, setActiveGame] = useState('cortex_match');
  const [isMuted, setIsMuted] = useState(false);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={18} color={Colors.textPrimary} />
          <Text style={styles.backButtonText}>Sanctuary</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>MEMORY GYM</Text>
          <Text style={styles.headerSubtitle}>Cognitive Rehabilitation</Text>
        </View>

        <TouchableOpacity style={styles.soundButton} onPress={toggleSound} activeOpacity={0.7}>
          {isMuted ? (
            <VolumeX size={18} color={Colors.textMuted} />
          ) : (
            <Volume2 size={18} color={Colors.amber} />
          )}
        </TouchableOpacity>
      </View>

      {/* 4 Games Selector Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeGame === 'cortex_match' && styles.tabItemActive]}
          onPress={() => setActiveGame('cortex_match')}
        >
          <Text style={[styles.tabText, activeGame === 'cortex_match' && styles.tabTextActive]}>
            1. Cortex Match
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeGame === 'neuro_sequence' && styles.tabItemActive]}
          onPress={() => setActiveGame('neuro_sequence')}
        >
          <Text style={[styles.tabText, activeGame === 'neuro_sequence' && styles.tabTextActive]}>
            2. Sequence
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeGame === 'daily_routine' && styles.tabItemActive]}
          onPress={() => setActiveGame('daily_routine')}
        >
          <Text style={[styles.tabText, activeGame === 'daily_routine' && styles.tabTextActive]}>
            3. Daily Routine
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeGame === 'number_sort' && styles.tabItemActive]}
          onPress={() => setActiveGame('number_sort')}
        >
          <Text style={[styles.tabText, activeGame === 'number_sort' && styles.tabTextActive]}>
            4. Number Sort
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Game View */}
      <ScrollView style={styles.gameContent} contentContainerStyle={{ paddingBottom: 40 }}>
        {activeGame === 'cortex_match' && <CortexMatchGame />}
        {activeGame === 'neuro_sequence' && <NeuroSequenceGame />}
        {activeGame === 'daily_routine' && <DailyRoutineGame />}
        {activeGame === 'number_sort' && <NumberSortGame />}
      </ScrollView>
    </View>
  );
}

// ==========================================
// GAME 1: CORTEX MATCH (CARDS PAIRS)
// ==========================================
function CortexMatchGame() {
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [isPeeking, setIsPeeking] = useState(false);

  const initGame = () => {
    const selected = CARD_ITEMS.slice(0, 6); // 6 pairs = 12 cards
    const deck = [...selected, ...selected]
      .map((item, idx) => ({ ...item, uniqueKey: `${item.id}_${idx}` }))
      .sort(() => Math.random() - 0.5);

    setCards(deck);
    setFlippedIndices([]);
    setMatchedIds([]);
    setMoves(0);
    setIsLocked(false);
    setIsPeeking(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardPress = (idx) => {
    if (isLocked || isPeeking) return;
    if (flippedIndices.includes(idx)) return;
    if (matchedIds.includes(cards[idx].id)) return;

    sound.playCardFlip();

    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.id === secondCard.id) {
        sound.playMatchSuccess();
        setMatchedIds((prev) => [...prev, firstCard.id]);
        setFlippedIndices([]);
        setIsLocked(false);
        if (matchedIds.length + 1 === 6) {
          setTimeout(() => sound.playVictory(), 300);
        }
      } else {
        sound.playTryAgain();
        setTimeout(() => {
          setFlippedIndices([]);
          setIsLocked(false);
        }, 900);
      }
    }
  };

  const handlePeek = () => {
    if (isPeeking || isLocked) return;
    setIsPeeking(true);
    sound.playTone(600, 0.2);
    setTimeout(() => {
      setIsPeeking(false);
    }, 1800);
  };

  const isWon = matchedIds.length === 6;

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameInfoBar}>
        <View style={styles.badgeRow}>
          <Text style={styles.infoBadge}>Moves: {moves}</Text>
          <Text style={styles.infoBadge}>Matched: {matchedIds.length} / 6</Text>
        </View>
        <View style={styles.badgeRow}>
          <TouchableOpacity style={styles.peekButton} onPress={handlePeek}>
            <Eye size={14} color={Colors.amber} />
            <Text style={styles.peekButtonText}>Peek (Hint)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={initGame}>
            <RotateCcw size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {isWon && (
        <View style={styles.victoryCard}>
          <Trophy size={28} color={Colors.amber} />
          <Text style={styles.victoryTitle}>Wonderful Memory!</Text>
          <Text style={styles.victoryDesc}>You matched all cards with calm focus.</Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={initGame}>
            <Text style={styles.playAgainText}>Play Another Round</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Grid of 12 Cards */}
      <View style={styles.grid}>
        {cards.map((card, idx) => {
          const isFlipped = isPeeking || flippedIndices.includes(idx) || matchedIds.includes(card.id);
          const IconComp = card.icon;

          return (
            <TouchableOpacity
              key={card.uniqueKey}
              style={[
                styles.card,
                isFlipped ? styles.cardFlipped : styles.cardBack,
                matchedIds.includes(card.id) && styles.cardMatched,
              ]}
              onPress={() => handleCardPress(idx)}
              activeOpacity={0.8}
            >
              {isFlipped ? (
                <View style={styles.cardContent}>
                  <IconComp size={24} color={card.color} />
                  <Text style={[styles.cardName, { color: card.color }]}>{card.name}</Text>
                </View>
              ) : (
                <View style={styles.cardBackSymbol}>
                  <Sparkles size={20} color={Colors.amber} opacity={0.6} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ==========================================
// GAME 2: NEUROSEQUENCE (SIMON CHIMES)
// ==========================================
function NeuroSequenceGame() {
  const [sequence, setSequence] = useState([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [activeNode, setActiveNode] = useState(null);
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [round, setRound] = useState(1);
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'player_turn' | 'game_over' | 'won'

  const NODES = [
    { id: 0, name: 'Amber Chime', color: '#f59e0b', note: 'C4' },
    { id: 1, name: 'Emerald Chime', color: '#10b981', note: 'E4' },
    { id: 2, name: 'Azure Chime', color: '#06b6d4', note: 'G4' },
    { id: 3, name: 'Amethyst Chime', color: '#a855f7', note: 'C5' },
  ];

  const startNewGame = () => {
    const firstSeq = [Math.floor(Math.random() * 4)];
    setSequence(firstSeq);
    setRound(1);
    setPlayerStep(0);
    setGameState('playing');
    playSequence(firstSeq);
  };

  const playSequence = async (seq) => {
    setIsPlayingSeq(true);
    setGameState('playing');
    for (let i = 0; i < seq.length; i++) {
      await new Promise((res) => setTimeout(res, 400));
      const nodeIdx = seq[i];
      setActiveNode(nodeIdx);
      sound.playNodeTone(nodeIdx);
      await new Promise((res) => setTimeout(res, 450));
      setActiveNode(null);
    }
    setIsPlayingSeq(false);
    setGameState('player_turn');
    setPlayerStep(0);
  };

  const handleNodePress = (idx) => {
    if (gameState !== 'player_turn' || isPlayingSeq) return;

    sound.playNodeTone(idx);
    setActiveNode(idx);
    setTimeout(() => setActiveNode(null), 250);

    if (idx === sequence[playerStep]) {
      const nextStep = playerStep + 1;
      if (nextStep === sequence.length) {
        // Round completed!
        if (round >= 5) {
          setGameState('won');
          sound.playVictory();
        } else {
          setRound((r) => r + 1);
          const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
          setSequence(nextSeq);
          setTimeout(() => {
            sound.playMatchSuccess();
            playSequence(nextSeq);
          }, 800);
        }
      } else {
        setPlayerStep(nextStep);
      }
    } else {
      sound.playTryAgain();
      setGameState('game_over');
    }
  };

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameInfoBar}>
        <Text style={styles.infoBadge}>Round: {round} / 5</Text>
        <Text style={styles.infoBadge}>
          {gameState === 'playing'
            ? 'Listen carefully...'
            : gameState === 'player_turn'
            ? `Your turn: step ${playerStep + 1} of ${sequence.length}`
            : gameState === 'won'
            ? 'Victory!'
            : 'Press Start'}
        </Text>
      </View>

      {gameState === 'idle' && (
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Musical Chime Recall</Text>
          <Text style={styles.introDesc}>
            Watch and listen to the soothing chimes, then repeat the sequence in order.
          </Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={startNewGame}>
            <Text style={styles.playAgainText}>Begin Exercise</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameState === 'game_over' && (
        <View style={styles.retryCard}>
          <Text style={styles.retryTitle}>Gentle Pause</Text>
          <Text style={styles.retryDesc}>That was a wonderful effort. Let's try again calmly.</Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={startNewGame}>
            <Text style={styles.playAgainText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameState === 'won' && (
        <View style={styles.victoryCard}>
          <Trophy size={28} color={Colors.amber} />
          <Text style={styles.victoryTitle}>Masterful Ear!</Text>
          <Text style={styles.victoryDesc}>You completed all 5 harmonic rounds gracefully.</Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={startNewGame}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4 Large Chime Buttons */}
      <View style={styles.chimeGrid}>
        {NODES.map((node) => {
          const isActive = activeNode === node.id;
          return (
            <TouchableOpacity
              key={node.id}
              style={[
                styles.chimeButton,
                { borderColor: node.color },
                isActive && { backgroundColor: node.color, transform: [{ scale: 1.05 }] },
              ]}
              onPress={() => handleNodePress(node.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chimeNote, { color: isActive ? '#111318' : node.color }]}>
                {node.note}
              </Text>
              <Text style={[styles.chimeName, { color: isActive ? '#111318' : Colors.textMuted }]}>
                {node.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ==========================================
// GAME 3: DAILY ROUTINE RECALL (SEQUENCING)
// ==========================================
function DailyRoutineGame() {
  const [availableSteps, setAvailableSteps] = useState([]);
  const [placedSteps, setPlacedSteps] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const initRoutine = () => {
    // Shuffle steps for available tray
    const shuffled = [...ROUTINE_STEPS_MASTER].sort(() => Math.random() - 0.5);
    setAvailableSteps(shuffled);
    setPlacedSteps([]);
    setIsSuccess(false);
  };

  useEffect(() => {
    initRoutine();
  }, []);

  const handleSelectStep = (step) => {
    sound.playStepPlace();
    const newPlaced = [...placedSteps, step];
    setPlacedSteps(newPlaced);
    setAvailableSteps(availableSteps.filter((s) => s.id !== step.id));

    // Check if fully placed
    if (newPlaced.length === ROUTINE_STEPS_MASTER.length) {
      const isCorrect = newPlaced.every((s, i) => s.order === i + 1);
      if (isCorrect) {
        setIsSuccess(true);
        setTimeout(() => sound.playVictory(), 200);
      } else {
        sound.playTryAgain();
      }
    }
  };

  const handleReset = () => {
    initRoutine();
  };

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameInfoBar}>
        <Text style={styles.infoBadge}>Order: Morning Routine</Text>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <RotateCcw size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.gamePrompt}>
        Tap each morning activity in the natural order of your peaceful day:
      </Text>

      {/* Placed Sequence Slots */}
      <View style={styles.placedContainer}>
        {placedSteps.map((step, idx) => {
          const IconComp = step.icon;
          const isCorrectPos = step.order === idx + 1;
          return (
            <View
              key={step.id}
              style={[
                styles.placedRow,
                isCorrectPos ? styles.placedRowCorrect : styles.placedRowWrong,
              ]}
            >
              <Text style={styles.placedNumber}>Step {idx + 1}</Text>
              <IconComp size={18} color={step.color} style={{ marginRight: 10 }} />
              <Text style={styles.placedText}>{step.text}</Text>
              {isCorrectPos && <CheckCircle2 size={16} color={Colors.emerald} />}
            </View>
          );
        })}
      </View>

      {isSuccess && (
        <View style={styles.victoryCard}>
          <Trophy size={28} color={Colors.amber} />
          <Text style={styles.victoryTitle}>Perfect Daily Flow!</Text>
          <Text style={styles.victoryDesc}>
            Your morning sequence brings clarity and peace to your routine.
          </Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={handleReset}>
            <Text style={styles.playAgainText}>Rearrange Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Available Steps Tray */}
      <View style={styles.trayContainer}>
        <Text style={styles.trayHeading}>Available Activities:</Text>
        {availableSteps.map((step) => {
          const IconComp = step.icon;
          return (
            <TouchableOpacity
              key={step.id}
              style={styles.trayButton}
              onPress={() => handleSelectStep(step)}
              activeOpacity={0.7}
            >
              <IconComp size={20} color={step.color} style={{ marginRight: 12 }} />
              <Text style={styles.trayButtonText}>{step.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ==========================================
// GAME 4: NUMBER SORT (TACTILE SLIDING PUZZLE)
// ==========================================
function NumberSortGame() {
  // 3x3 sliding tiles: numbers 1..8 and 0 representing empty slot
  const [board, setBoard] = useState([1, 2, 3, 4, 5, 6, 7, 0, 8]);
  const [moves, setMoves] = useState(0);
  const [isSolved, setIsSolved] = useState(false);

  const initBoard = () => {
    // Solvable light scramble from [1..8, 0]
    let current = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    for (let i = 0; i < 18; i++) {
      const emptyIdx = current.indexOf(0);
      const neighbors = getValidNeighbors(emptyIdx);
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      current[emptyIdx] = current[pick];
      current[pick] = 0;
    }
    setBoard(current);
    setMoves(0);
    setIsSolved(false);
  };

  useEffect(() => {
    initBoard();
  }, []);

  const getValidNeighbors = (idx) => {
    const neighbors = [];
    const r = Math.floor(idx / 3);
    const c = idx % 3;
    if (r > 0) neighbors.push(idx - 3);
    if (r < 2) neighbors.push(idx + 3);
    if (c > 0) neighbors.push(idx - 1);
    if (c < 2) neighbors.push(idx + 1);
    return neighbors;
  };

  const handleTilePress = (idx) => {
    if (isSolved || board[idx] === 0) return;
    const emptyIdx = board.indexOf(0);
    const valid = getValidNeighbors(emptyIdx);

    if (valid.includes(idx)) {
      sound.playTileSlide();
      const nextBoard = [...board];
      nextBoard[emptyIdx] = board[idx];
      nextBoard[idx] = 0;
      setBoard(nextBoard);
      setMoves((m) => m + 1);

      // Check win: [1, 2, 3, 4, 5, 6, 7, 8, 0]
      const won = nextBoard.slice(0, 8).every((num, i) => num === i + 1);
      if (won) {
        setIsSolved(true);
        setTimeout(() => sound.playVictory(), 200);
      }
    }
  };

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameInfoBar}>
        <Text style={styles.infoBadge}>Moves: {moves}</Text>
        <Text style={styles.infoBadge}>Goal: Sort 1 to 8</Text>
        <TouchableOpacity style={styles.resetButton} onPress={initBoard}>
          <RotateCcw size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {isSolved && (
        <View style={styles.victoryCard}>
          <Trophy size={28} color={Colors.amber} />
          <Text style={styles.victoryTitle}>Order Restored!</Text>
          <Text style={styles.victoryDesc}>You arranged the wooden numbers in harmony.</Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={initBoard}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3x3 Tile Grid */}
      <View style={styles.woodPlinth}>
        {board.map((num, idx) => {
          if (num === 0) {
            return <View key={`empty_${idx}`} style={styles.emptySlot} />;
          }
          return (
            <TouchableOpacity
              key={`tile_${num}`}
              style={styles.woodTile}
              onPress={() => handleTilePress(idx)}
              activeOpacity={0.8}
            >
              <Text style={styles.woodTileNumber}>{num}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  backButtonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: Colors.amber,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  soundButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabItemActive: {
    backgroundColor: Colors.amberMuted,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.amber,
    fontWeight: '700',
  },
  gameContent: {
    flex: 1,
    padding: 16,
  },
  gameContainer: {
    alignItems: 'center',
  },
  gameInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBadge: {
    backgroundColor: Colors.surfaceElevated,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  peekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.amberMuted,
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  peekButtonText: {
    color: Colors.amber,
    fontSize: 11,
    fontWeight: '600',
  },
  resetButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    maxWidth: 380,
  },
  card: {
    width: (width - 64) / 3,
    height: 95,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardBack: {
    backgroundColor: Colors.card,
    borderColor: Colors.borderSubtle,
  },
  cardFlipped: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.amberBorder,
  },
  cardMatched: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.emerald,
  },
  cardContent: {
    alignItems: 'center',
    gap: 6,
  },
  cardName: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  cardBackSymbol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  victoryCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    marginBottom: 20,
    ...Shadows.amberGlow,
  },
  victoryTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  victoryDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  playAgainBtn: {
    backgroundColor: Colors.amber,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  playAgainText: {
    color: '#111318',
    fontWeight: '700',
    fontSize: 13,
  },
  introCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 20,
  },
  introTitle: {
    color: Colors.amber,
    fontSize: 16,
    fontWeight: '700',
  },
  introDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  retryCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    marginBottom: 20,
  },
  retryTitle: {
    color: Colors.amber,
    fontSize: 16,
    fontWeight: '700',
  },
  retryDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  chimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    marginTop: 10,
  },
  chimeButton: {
    width: (width - 70) / 2,
    height: 120,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chimeNote: {
    fontSize: 22,
    fontWeight: '900',
  },
  chimeName: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  gamePrompt: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  placedContainer: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  placedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
  },
  placedRowCorrect: {
    borderColor: Colors.emerald,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  placedRowWrong: {
    borderColor: Colors.amberBorder,
  },
  placedNumber: {
    color: Colors.amber,
    fontWeight: '700',
    fontSize: 11,
    marginRight: 12,
    width: 48,
  },
  placedText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  trayContainer: {
    width: '100%',
    gap: 8,
  },
  trayHeading: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  trayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  trayButtonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  woodPlinth: {
    width: 290,
    height: 290,
    backgroundColor: '#1d150e',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#78350f',
    padding: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  woodTile: {
    width: 84,
    height: 84,
    backgroundColor: '#d97706',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  woodTileNumber: {
    color: '#451a03',
    fontSize: 32,
    fontWeight: 'bold',
  },
  emptySlot: {
    width: 84,
    height: 84,
    backgroundColor: '#0c0704',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
});
