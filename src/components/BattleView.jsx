import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

const FIGHTER_COLORS = {
  ruggero: '#ff4444', koen: '#44aaff', matthew: '#44ff88', martin: '#ff8844', robin: '#aa44ff',
  frederik: '#ffdd44', vincent: '#ff44aa', devan: '#44ffdd', gereon: '#8888ff', noah: '#ff6666', alexander: '#ffd700',
};

// Fountain particles — pre-generated random offsets
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  xOffset: (Math.random() - 0.5) * 150,
  peakY: -200 - Math.random() * 100,
  delay: Math.random() * 0.1,
  emoji: ['💔', '💥', '✨', '💔', '💥'][i % 5],
  size: 0.7 + Math.random() * 0.6,
}));

function CharacterSprite({ player, side, battleState, isLoser }) {
  const charId = player?.chosenCharacter;
  const color = FIGHTER_COLORS[charId] || '#888';
  const [imgError, setImgError] = useState(false);
  const isLeft = side === 'left';

  const shouldShow =
    (isLeft && ['intro_p1', 'intro_p2', 'intro_fight', 'idle_question', 'action_throw', 'action_hit'].includes(battleState)) ||
    (!isLeft && ['intro_p2', 'intro_fight', 'idle_question', 'action_throw', 'action_hit'].includes(battleState));

  const isHit = battleState === 'action_hit' && isLoser;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className={`absolute bottom-[10vh] z-10
            ${isLeft
              ? 'left-[5vw] sm:left-[10vw] md:left-[15vw]'
              : 'right-[5vw] sm:right-[10vw] md:right-[15vw]'}`}
          initial={{ x: isLeft ? '-100vw' : '100vw', opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            filter: isHit
              ? ['brightness(1)', 'brightness(3) saturate(0)', 'brightness(1.5) saturate(2) hue-rotate(-30deg)', 'brightness(1)']
              : 'brightness(1)',
          }}
          transition={{
            x: { type: 'tween', ease: 'easeOut', duration: 0.3 },
            filter: isHit ? { duration: 0.6, times: [0, 0.2, 0.5, 1] } : {},
          }}
        >
          <motion.div
            animate={battleState === 'idle_question' ? { y: [0, -6, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="relative">
              {!imgError ? (
                <img
                  src={`/assets/characters/${charId}.jpg`}
                  alt={player?.name}
                  onError={() => setImgError(true)}
                  className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 rounded-2xl object-cover border-3 shadow-lg"
                  style={{ borderColor: color, boxShadow: `0 0 30px ${color}50` }}
                />
              ) : (
                <div
                  className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 rounded-2xl border-3 flex items-center justify-center text-5xl sm:text-6xl md:text-7xl"
                  style={{ borderColor: color, backgroundColor: `${color}20`, boxShadow: `0 0 30px ${color}50` }}
                >
                  {FIGHTER_EMOJI[charId] || '❓'}
                </div>
              )}
              <div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
                style={{ backgroundColor: `${color}cc`, color: '#000' }}
              >
                {player?.name}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DamageHUD({ player, damage, side }) {
  const charId = player?.chosenCharacter;
  const color = damage >= 200 ? '#ef4444' : damage >= 100 ? '#f97316' : '#ffffff';
  const isLeft = side === 'left';

  return (
    <div className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'}`}>
      <div className={`flex items-center gap-2 ${!isLeft && 'flex-row-reverse'}`}>
        <span className="text-xl sm:text-2xl">{FIGHTER_EMOJI[charId] || '❓'}</span>
        <span className="text-sm sm:text-base font-bold text-white">{player?.name}</span>
        <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full font-mono">P{player?.id}</span>
      </div>
      <motion.span
        key={damage}
        className="text-4xl sm:text-5xl md:text-6xl font-black"
        style={{
          color,
          WebkitTextStroke: '2px rgba(0,0,0,0.7)',
          textShadow: damage >= 100 ? '0 0 20px rgba(239,68,68,0.4)' : 'none',
          filter: 'drop-shadow(0 3px 0 rgba(0,0,0,0.5))',
        }}
        initial={{ scale: 1.6, y: -8 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {damage}%
      </motion.span>
    </div>
  );
}

function Projectile({ fromSide, onComplete }) {
  const isFromLeft = fromSide === 'left';

  return (
    <motion.div
      className="absolute z-30 text-5xl sm:text-6xl"
      style={{ top: '45%' }}
      initial={{
        left: isFromLeft ? '15vw' : '85vw',
        x: '-50%',
      }}
      animate={{
        left: isFromLeft ? '85vw' : '15vw',
        y: [0, -250, 0],
        rotate: [0, 360, 720],
      }}
      transition={{
        left: { duration: 1.5, ease: 'linear' },
        y: { duration: 1.5, ease: 'easeInOut' },
        rotate: { duration: 1.5, ease: 'linear' },
      }}
      onAnimationComplete={onComplete}
    >
      🍺
    </motion.div>
  );
}

function HitExplosion({ side }) {
  const isRight = side === 'right';

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: isRight ? '85vw' : '15vw',
            top: '45%',
            fontSize: `${p.size * 1.8}rem`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            x: [0, p.xOffset, p.xOffset * 1.2],
            y: [0, p.peakY, 100],
            opacity: [1, 1, 0],
            scale: [1, 1.2, 0.5],
          }}
          transition={{
            duration: 1.5,
            delay: p.delay,
            ease: 'easeOut',
            y: { ease: [0.2, 0, 0.8, 1] }, // gravity-like
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
      {/* Big central flash */}
      <motion.div
        className="absolute text-6xl sm:text-7xl"
        style={{
          left: isRight ? '85vw' : '15vw',
          top: '42%',
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 2.5, 0], opacity: [1, 1, 0] }}
        transition={{ duration: 0.5 }}
      >
        💥
      </motion.div>
    </div>
  );
}

export default function BattleView() {
  const { currentMatch, selectedMap, awardDamage, characters, gamePhase } = useGameStore();
  const { player1, player2, p1Damage, p2Damage } = currentMatch;

  const [battleState, setBattleState] = useState('intro_arena');
  const [throwFrom, setThrowFrom] = useState(null);
  const [hitSide, setHitSide] = useState(null);
  const [pendingLoserId, setPendingLoserId] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Intro sequence
  useEffect(() => {
    const timers = [
      setTimeout(() => setBattleState('intro_p1'), 1500),
      setTimeout(() => setBattleState('intro_p2'), 2500),
      setTimeout(() => setBattleState('intro_fight'), 3500),
      setTimeout(() => {
        setBattleState('idle_question');
        useGameStore.getState().startBattle();
      }, 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleDamageAttack = useCallback((loserId) => {
    if (battleState !== 'idle_question') return;

    const loserIsP1 = player1?.id === loserId;
    const winnerSide = loserIsP1 ? 'right' : 'left';
    const loserSide = loserIsP1 ? 'left' : 'right';

    setPendingLoserId(loserId);
    setThrowFrom(winnerSide);
    setHitSide(loserSide);
    setBattleState('action_throw');
  }, [battleState, player1]);

  const handleThrowComplete = useCallback(() => {
    setBattleState('action_hit');

    if (pendingLoserId) {
      // Check if this hit is a K.O. (current damage + 100 = 200%)
      const loserIsP1 = player1?.id === pendingLoserId;
      const currentDmg = loserIsP1 ? p1Damage : p2Damage;
      const isKO = currentDmg >= 100;
      const isFirstHitOnPlayer = currentDmg === 0;

      if (isFirstHitOnPlayer) {
        useGameStore.getState().playSFX('first_blood');
      }

      if (isKO) {
        useGameStore.getState().setBgmState('faded');
        useGameStore.getState().playSFX('ko_jingle');
      }

      awardDamage(pendingLoserId);
    }

    setTimeout(() => {
      const phase = useGameStore.getState().gamePhase;
      if (phase === 'battle') {
        setBattleState('idle_question');
        setShowAnswer(false);
        setThrowFrom(null);
        setHitSide(null);
        setPendingLoserId(null);
      }
    }, 2000);
  }, [pendingLoserId, awardDamage]);

  const isBlurred = ['idle_question', 'action_throw', 'action_hit'].includes(battleState);
  const showUI = battleState === 'idle_question';

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Map background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{
          backgroundImage: `url('/assets/maps/${selectedMap}.jpg')`,
          filter: isBlurred ? 'blur(3px)' : 'none',
        }}
      />
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ backgroundColor: isBlurred ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.2)' }}
      />

      {/* Scanlines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)' }} />

      {/* Exit modal */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowExitModal(false)} />
            <motion.div
              className="relative z-10 panel-smash border-red-500/80 p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.4)]"
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}>
              <div className="panel-smash-content">
                <h3 className="text-smash text-3xl text-red-500 mb-2">⚠️ End Tournament?</h3>
                <p className="text-gray-300 text-lg mb-8 uppercase">Are you sure? All progress will be lost.</p>
                <div className="flex gap-3">
                  <motion.button onClick={() => setShowExitModal(false)} className="group flex-1" whileTap={{ scale: 0.95 }}>
                    <div className="py-3 border-2 border-gray-600 rounded-sm hover:border-gray-400 transition-colors"
                      style={{ transform: 'skewX(-5deg)' }}>
                      <div style={{ transform: 'skewX(5deg)' }} className="text-smash text-sm text-gray-300">Cancel</div>
                    </div>
                  </motion.button>
                  <motion.button onClick={() => useGameStore.getState().resetGame()} className="group flex-1" whileTap={{ scale: 0.95 }}>
                    <div className="py-3 border-2 border-red-500/50 bg-red-600 rounded-sm hover:bg-red-500 transition-colors"
                      style={{ transform: 'skewX(-5deg)' }}>
                      <div style={{ transform: 'skewX(5deg)' }} className="text-smash text-sm text-white">End Tournament</div>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character sprites — z-10 so they sit behind center UI */}
      <CharacterSprite player={player1} side="left" battleState={battleState}
        isLoser={battleState === 'action_hit' && hitSide === 'left'} />
      <CharacterSprite player={player2} side="right" battleState={battleState}
        isLoser={battleState === 'action_hit' && hitSide === 'right'} />

      {/* Projectile */}
      <AnimatePresence>
        {battleState === 'action_throw' && throwFrom && (
          <Projectile fromSide={throwFrom} onComplete={handleThrowComplete} />
        )}
      </AnimatePresence>

      {/* Hit explosion fountain */}
      <AnimatePresence>
        {battleState === 'action_hit' && hitSide && (
          <HitExplosion side={hitSide} />
        )}
      </AnimatePresence>

      {/* FIGHT! intro */}
      <AnimatePresence>
        {battleState === 'intro_fight' && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}>
            <motion.h1
              className="text-8xl sm:text-9xl md:text-[11rem] font-black italic text-white"
              style={{
                filter: 'drop-shadow(0 8px 0 rgba(0,0,0,0.7)) drop-shadow(0 0 60px rgba(250,204,21,0.5))',
                WebkitTextStroke: '3px rgba(250,204,21,0.4)',
              }}
              initial={{ scale: 5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            >
              FIGHT!
            </motion.h1>
            <motion.div className="absolute inset-0 bg-yellow-400 pointer-events-none"
              initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <AnimatePresence>
        {['idle_question', 'action_throw', 'action_hit', 'intro_fight'].includes(battleState) && (
          <motion.div className="relative z-20 px-4 sm:px-8 pt-6"
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="max-w-4xl mx-auto flex items-start justify-between">
              <DamageHUD player={player1} damage={p1Damage} side="left" />
              <motion.div className="text-xl text-yellow-400/60 font-black pt-4"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}>
                ⚡
              </motion.div>
              <DamageHUD player={player2} damage={p2Damage} side="right" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit button */}
      <AnimatePresence>
        {showUI && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="absolute top-6 left-6 z-50">
            <motion.button onClick={() => setShowExitModal(true)}
              className="group flex items-center gap-2" whileHover={{ x: -4 }} whileTap={{ scale: 0.93 }}>
              <div className="flex items-center gap-2 px-4 py-2 border-2 border-red-600/60 bg-gray-900/80 backdrop-blur-sm text-red-400 text-sm font-bold uppercase tracking-wider group-hover:border-red-400/60 group-hover:text-red-300 group-hover:bg-red-500/10 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all duration-200"
                style={{ transform: 'skewX(-10deg)' }}>
                <span style={{ transform: 'skewX(10deg)' }} className="flex items-center gap-2"><span className="text-lg">✕</span><span>Exit</span></span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question card + Admin controls — z-20 to sit in front of characters */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            className="relative z-20 flex-1 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4 }}>
            {/* Question area */}
            <div className="w-full max-w-2xl bg-gray-900/80 backdrop-blur-md border-2 border-yellow-500/30 rounded-2xl p-6 sm:p-8 text-center mb-6 shadow-[0_0_30px_rgba(250,204,21,0.15)]">
              <div className="text-yellow-400 text-xs font-black uppercase tracking-[0.3em] mb-4">
                {currentMatch.activeQuestion?.type === 'trivia' ? '🧠 TRIVIA TIME' : '⚡ MINIGAME CHALLENGE'}
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-snug mb-6">
                {currentMatch.activeQuestion?.question || 'Are you ready?'}
              </h3>
              {currentMatch.activeQuestion?.answer && (
                <div className="mt-6">
                  {!showAnswer ? (
                    <motion.button
                      onClick={() => setShowAnswer(true)}
                      className="group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="px-6 py-2 border-2 border-gray-600 bg-gray-800/80 rounded-sm group-hover:border-gray-400 group-hover:bg-gray-700/80 transition-all duration-200"
                        style={{ transform: 'skewX(-10deg)' }}>
                        <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-sm text-gray-300">
                          👁️ Reveal Answer
                        </div>
                      </div>
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl bg-green-500/20 border border-green-500/50"
                    >
                      <span className="text-green-400 font-black text-xl sm:text-2xl uppercase tracking-wide">
                        {currentMatch.activeQuestion.answer}
                      </span>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Admin damage buttons */}
            <div className="w-full max-w-2xl">
              <div className="text-center text-[10px] text-gray-600 uppercase tracking-widest mb-3 font-mono">
                Admin Controls
              </div>
              {(() => {
                const p1Color = FIGHTER_COLORS[player1?.chosenCharacter] || '#666';
                const p2Color = FIGHTER_COLORS[player2?.chosenCharacter] || '#666';
                return (
                  <div className="flex gap-3 justify-center">
                    <motion.button
                      onClick={() => handleDamageAttack(player2.id)}
                      className="group flex-1 max-w-[280px]"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}>
                      <div className="py-4 px-4 border-2 rounded-sm flex flex-col items-center transition-all duration-200"
                        style={{
                          backgroundColor: `${p1Color}20`,
                          borderColor: p1Color,
                          boxShadow: `0 0 20px ${p1Color}40`,
                          transform: 'skewX(-5deg)',
                        }}>
                        <div style={{ transform: 'skewX(5deg)' }} className="text-center">
                          <span className="text-smash text-lg sm:text-xl text-white block">🏆 {player1?.name} WINS!</span>
                          <span className="text-xs sm:text-sm opacity-80 mt-1 block text-white">+100% DMG to {player2?.name}</span>
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      onClick={() => handleDamageAttack(player1.id)}
                      className="group flex-1 max-w-[280px]"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}>
                      <div className="py-4 px-4 border-2 rounded-sm flex flex-col items-center transition-all duration-200"
                        style={{
                          backgroundColor: `${p2Color}20`,
                          borderColor: p2Color,
                          boxShadow: `0 0 20px ${p2Color}40`,
                          transform: 'skewX(-5deg)',
                        }}>
                        <div style={{ transform: 'skewX(5deg)' }} className="text-center">
                          <span className="text-smash text-lg sm:text-xl text-white block">🏆 {player2?.name} WINS!</span>
                          <span className="text-xs sm:text-sm opacity-80 mt-1 block text-white">+100% DMG to {player1?.name}</span>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
