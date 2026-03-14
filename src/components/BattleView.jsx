import { useState, useEffect, useCallback } from 'react';
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

// Explosion particles config
const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  angle: (i / 10) * Math.PI * 2,
  distance: 60 + Math.random() * 80,
  delay: Math.random() * 0.15,
  emoji: i % 3 === 0 ? '💥' : '💔',
}));

function CharacterSprite({ player, side, battleState, isLoser }) {
  const charId = player?.chosenCharacter;
  const color = FIGHTER_COLORS[charId] || '#888';
  const [imgError, setImgError] = useState(false);
  const isLeft = side === 'left';

  // Determine visibility and animation
  const shouldShow =
    (isLeft && ['intro_p1', 'intro_p2', 'intro_fight', 'idle_question', 'action_throw', 'action_hit'].includes(battleState)) ||
    (!isLeft && ['intro_p2', 'intro_fight', 'idle_question', 'action_throw', 'action_hit'].includes(battleState));

  const isHit = battleState === 'action_hit' && isLoser;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className={`absolute ${isLeft ? 'left-4 sm:left-8' : 'right-4 sm:right-8'} bottom-[20%] sm:bottom-[15%] z-20`}
          initial={{ x: isLeft ? '-100vw' : '100vw', opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            filter: isHit ? ['brightness(1)', 'brightness(3) saturate(0) hue-rotate(0deg)', 'brightness(1.5) saturate(2) hue-rotate(-30deg)', 'brightness(1)'] : 'brightness(1)',
          }}
          transition={{
            x: { type: 'tween', ease: 'easeOut', duration: 0.3 },
            filter: isHit ? { duration: 0.6, times: [0, 0.2, 0.5, 1] } : {},
          }}
        >
          {/* Idle bob animation */}
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
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl object-cover border-3 shadow-lg"
                  style={{
                    borderColor: color,
                    boxShadow: `0 0 25px ${color}50`,
                  }}
                />
              ) : (
                <div
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl border-3 flex items-center justify-center text-5xl sm:text-6xl"
                  style={{ borderColor: color, backgroundColor: `${color}20`, boxShadow: `0 0 25px ${color}50` }}
                >
                  {FIGHTER_EMOJI[charId] || '❓'}
                </div>
              )}
              {/* Name tag */}
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
  return (
    <motion.div
      className="absolute z-40 text-5xl sm:text-6xl"
      style={{
        top: '40%',
        [fromSide === 'left' ? 'left' : 'right']: '15%',
      }}
      animate={{
        x: fromSide === 'left' ? [0, 200, 350] : [0, -200, -350],
        y: [0, -60, 10],
        rotate: [0, 360, 720],
        scale: [1, 1.3, 1],
      }}
      transition={{ duration: 2.0, ease: 'linear' }}
      onAnimationComplete={onComplete}
    >
      🍺
    </motion.div>
  );
}

function HitExplosion({ side }) {
  const baseX = side === 'right' ? 'calc(100% - 120px)' : '80px';

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-2xl sm:text-3xl"
          style={{ left: baseX, top: '35%' }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance - 20,
            opacity: 0,
            scale: 0.3,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 0.8, delay: p.delay, ease: 'easeOut' }}
        >
          {p.emoji}
        </motion.div>
      ))}
      {/* Big central flash */}
      <motion.div
        className="absolute text-6xl sm:text-7xl"
        style={{ left: baseX, top: '32%', transform: 'translate(-50%, -50%)' }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 2, 0], opacity: [1, 1, 0] }}
        transition={{ duration: 0.6 }}
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
  const [throwFrom, setThrowFrom] = useState(null); // 'left' or 'right'
  const [hitSide, setHitSide] = useState(null); // 'left' or 'right' (loser side)
  const [pendingLoserId, setPendingLoserId] = useState(null);

  // Intro sequence
  useEffect(() => {
    const timers = [
      setTimeout(() => setBattleState('intro_p1'), 1500),
      setTimeout(() => setBattleState('intro_p2'), 2500),
      setTimeout(() => setBattleState('intro_fight'), 3500),
      setTimeout(() => setBattleState('idle_question'), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Handle damage with projectile animation
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

  // Throw complete → hit phase
  const handleThrowComplete = useCallback(() => {
    setBattleState('action_hit');

    // Register damage in Zustand NOW
    if (pendingLoserId) {
      awardDamage(pendingLoserId);
    }

    // After hit animation, return to idle (if game didn't end)
    setTimeout(() => {
      const phase = useGameStore.getState().gamePhase;
      if (phase === 'battle') {
        setBattleState('idle_question');
        setThrowFrom(null);
        setHitSide(null);
        setPendingLoserId(null);
      }
    }, 1500);
  }, [pendingLoserId, awardDamage]);

  const isBlurred = ['idle_question', 'action_throw', 'action_hit'].includes(battleState);
  const showUI = battleState === 'idle_question';
  const showChars = !['intro_arena'].includes(battleState);

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

      {/* Character sprites */}
      {showChars && (
        <>
          <CharacterSprite
            player={player1}
            side="left"
            battleState={battleState}
            isLoser={battleState === 'action_hit' && hitSide === 'left'}
          />
          <CharacterSprite
            player={player2}
            side="right"
            battleState={battleState}
            isLoser={battleState === 'action_hit' && hitSide === 'right'}
          />
        </>
      )}

      {/* Projectile */}
      <AnimatePresence>
        {battleState === 'action_throw' && throwFrom && (
          <Projectile fromSide={throwFrom} onComplete={handleThrowComplete} />
        )}
      </AnimatePresence>

      {/* Hit explosion */}
      <AnimatePresence>
        {battleState === 'action_hit' && hitSide && (
          <HitExplosion side={hitSide} />
        )}
      </AnimatePresence>

      {/* FIGHT! intro text */}
      <AnimatePresence>
        {battleState === 'intro_fight' && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          >
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
            {/* Flash */}
            <motion.div
              className="absolute inset-0 bg-yellow-400 pointer-events-none"
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD — always visible after intro */}
      <AnimatePresence>
        {['idle_question', 'action_throw', 'action_hit', 'intro_fight'].includes(battleState) && (
          <motion.div
            className="relative z-20 px-4 sm:px-8 pt-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
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

      {/* Question card + Admin controls */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            className="relative z-20 flex-1 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4 }}
          >
            {/* Question area */}
            <div className="w-full max-w-lg bg-gray-900/70 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 sm:p-8 text-center mb-6">
              <motion.h2
                className="text-2xl sm:text-3xl font-black mb-3"
                animate={{ color: ['#facc15', '#f97316', '#ef4444', '#f97316', '#facc15'] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                BATTLE ON!
              </motion.h2>
              <div className="text-gray-500 text-sm border border-dashed border-gray-700 rounded-lg p-4">
                <p className="text-gray-400 mb-1">🎮 Question / Minigame Area</p>
                <p className="text-xs">Content will appear here during rounds</p>
              </div>
            </div>

            {/* Admin damage buttons */}
            <div className="w-full max-w-2xl">
              <div className="text-center text-[10px] text-gray-600 uppercase tracking-widest mb-3 font-mono">
                Admin Controls
              </div>
              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={() => handleDamageAttack(player1.id)}
                  className="flex-1 max-w-[280px] py-4 px-4 rounded-xl text-sm sm:text-base font-black uppercase tracking-wide
                    bg-gradient-to-r from-red-700 to-red-600 text-white
                    border-2 border-red-500/50 hover:border-red-400
                    shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]
                    transition-all duration-200"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🍺 → {player1?.name}
                </motion.button>

                <motion.button
                  onClick={() => handleDamageAttack(player2.id)}
                  className="flex-1 max-w-[280px] py-4 px-4 rounded-xl text-sm sm:text-base font-black uppercase tracking-wide
                    bg-gradient-to-r from-blue-700 to-blue-600 text-white
                    border-2 border-blue-500/50 hover:border-blue-400
                    shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]
                    transition-all duration-200"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🍺 → {player2?.name}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
