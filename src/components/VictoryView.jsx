import { useState, useEffect } from 'react';
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

export default function VictoryView() {
  const { matchWinner, players, selectedMap, nextMatch, resetGame, characters } = useGameStore();
  const [animStep, setAnimStep] = useState(0);
  const [imgError, setImgError] = useState(false);

  const alive = players.filter((p) => !p.isEliminated);
  const isTournamentChampion = alive.length <= 1;
  const winnerCharName = characters.find((c) => c.id === matchWinner?.chosenCharacter)?.name || '???';
  const winnerColor = FIGHTER_COLORS[matchWinner?.chosenCharacter] || '#facc15';

  useEffect(() => {
    const t1 = setTimeout(() => setAnimStep(1), 3000);
    const t2 = setTimeout(() => setAnimStep(2), 6500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Blurred map background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{
          backgroundImage: `url('/assets/maps/${selectedMap || 'tuscany'}.jpg')`,
          filter: 'blur(8px)',
        }}
      />
      <div className="absolute inset-0 bg-black/75" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      <div className="relative z-10 text-center px-6 w-full max-w-3xl">
        <AnimatePresence mode="wait">
          {/* Step 0: VICTORY! slam */}
          {animStep === 0 && (
            <motion.div
              key="step0"
              initial={{ scale: 5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
            >
              <motion.h1
                className="text-8xl sm:text-9xl font-black text-white"
                style={{
                  filter: 'drop-shadow(0 8px 0 rgba(0,0,0,0.6)) drop-shadow(0 0 60px rgba(250,204,21,0.4))',
                }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                VICTORY!
              </motion.h1>
              {/* Glow pulse behind text */}
              <motion.div
                className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div
                  className="w-[600px] h-[200px] rounded-full blur-3xl"
                  style={{ background: `radial-gradient(ellipse, ${winnerColor}40 0%, transparent 70%)` }}
                />
              </motion.div>
            </motion.div>
          )}

          {/* Step 1: Winner announcement */}
          {animStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <div className="text-6xl mb-4">{FIGHTER_EMOJI[matchWinner?.chosenCharacter] || '⭐'}</div>
              <h2
                className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight"
                style={{
                  filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.5))',
                }}
              >
                <span style={{ color: winnerColor }}>{matchWinner?.name}</span>
              </h2>
              <motion.p
                className="text-2xl sm:text-3xl font-black text-white mt-4 uppercase tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ filter: 'drop-shadow(0 3px 0 rgba(0,0,0,0.5))' }}
              >
                {isTournamentChampion ? '🏆 TOURNAMENT CHAMPION! 🏆' : 'WINS THIS ROUND!'}
              </motion.p>
            </motion.div>
          )}

          {/* Step 2: Character reveal + buttons */}
          {animStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              {/* Character image with fallback */}
              <motion.div
                className="mb-6 relative"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              >
                {!imgError ? (
                  <img
                    src={`/assets/characters/${matchWinner?.chosenCharacter}.jpg`}
                    alt={winnerCharName}
                    onError={() => setImgError(true)}
                    className="w-44 h-44 sm:w-60 sm:h-60 rounded-2xl object-cover border-4 shadow-lg"
                    style={{
                      borderColor: winnerColor,
                      boxShadow: `0 0 40px ${winnerColor}60`,
                    }}
                  />
                ) : (
                  <div
                    className="w-44 h-44 sm:w-60 sm:h-60 rounded-2xl border-4 flex items-center justify-center text-7xl"
                    style={{
                      borderColor: winnerColor,
                      backgroundColor: `${winnerColor}15`,
                      boxShadow: `0 0 40px ${winnerColor}60`,
                    }}
                  >
                    {FIGHTER_EMOJI[matchWinner?.chosenCharacter] || '⭐'}
                  </div>
                )}
                <motion.div
                  className="absolute -top-3 -right-3 text-4xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isTournamentChampion ? '👑' : '🏆'}
                </motion.div>
              </motion.div>

              <h2
                className="text-4xl sm:text-5xl font-black mb-1"
                style={{ color: winnerColor, filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.4))' }}
              >
                {matchWinner?.name}
              </h2>
              <p className="text-lg text-gray-400 font-bold uppercase tracking-widest mb-8">
                {winnerCharName}
              </p>

              {isTournamentChampion && (
                <motion.p
                  className="text-2xl font-black text-yellow-400 mb-8"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ filter: 'drop-shadow(0 0 15px rgba(250,204,21,0.3))' }}
                >
                  🏆 TOURNAMENT CHAMPION 🏆
                </motion.p>
              )}

              {/* Buttons */}
              <motion.div
                className="flex gap-4"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {!isTournamentChampion && (
                  <motion.button
                    onClick={nextMatch}
                    className="px-8 py-4 rounded-xl text-lg font-black uppercase tracking-wide
                      bg-gradient-to-r from-blue-600 to-blue-500 text-white
                      border-2 border-blue-400/50 hover:border-blue-300
                      shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]
                      transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next Match →
                  </motion.button>
                )}
                <motion.button
                  onClick={resetGame}
                  className="px-8 py-4 rounded-xl text-lg font-black uppercase tracking-wide
                    bg-gray-800 text-gray-300 border-2 border-gray-600/50
                    hover:border-gray-400 hover:text-white transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isTournamentChampion ? 'New Tournament' : 'Reset'}
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
