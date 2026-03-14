import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

export default function VsScreenView() {
  const { currentMatch, startBattle, characters } = useGameStore();
  const { player1, player2 } = currentMatch;
  const isFinal = currentMatch.isFinal;

  const getCharName = (p) => characters.find((c) => c.id === p?.chosenCharacter)?.name || '???';

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Split background */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2 bg-gradient-to-br from-red-950 via-red-900/80 to-black" />
        <div className="w-1/2 bg-gradient-to-bl from-blue-950 via-blue-900/80 to-black" />
      </div>

      {/* Diagonal slash */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 w-2 h-full -translate-x-1/2 bg-gradient-to-b from-yellow-400 via-white to-yellow-400 opacity-60 blur-sm"
          style={{ transform: 'translateX(-50%) skewX(-5deg)' }}
        />
      </div>

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* GRAND FINAL banner */}
        {isFinal && (
          <motion.div
            className="mb-6"
            initial={{ y: -60, opacity: 0, scale: 1.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
          >
            <motion.h2
              className="text-4xl sm:text-5xl md:text-6xl font-black italic text-center uppercase tracking-wide"
              style={{
                background: 'linear-gradient(180deg, #ffd700, #f59e0b, #d97706)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.5))',
              }}
              animate={{
                filter: [
                  'drop-shadow(0 4px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(255,215,0,0.3))',
                  'drop-shadow(0 4px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 50px rgba(255,215,0,0.6))',
                  'drop-shadow(0 4px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(255,215,0,0.3))',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚔️ GRAND FINAL ⚔️
            </motion.h2>
            <motion.p
              className="text-center text-sm text-yellow-400/70 uppercase tracking-[0.4em] font-bold mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              The Bachelor Villa
            </motion.p>
          </motion.div>
        )}

        {/* Fighters */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-8">
          {/* Player 1 */}
          <motion.div
            className="text-center flex-1"
            initial={{ x: '-100vw', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 80, damping: 14, duration: 1.2 }}
          >
            <motion.div
              className="text-7xl sm:text-8xl mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {FIGHTER_EMOJI[player1?.chosenCharacter] || '❓'}
            </motion.div>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-mono mb-1 inline-block">P{player1?.id}</span>
            <div className="text-3xl sm:text-4xl font-black text-white mb-1 drop-shadow-lg">
              {player1?.name}
            </div>
          </motion.div>

          {/* VS */}
          <motion.div
            className="mx-4 flex-shrink-0"
            initial={{ scale: 5, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 150, damping: 12 }}
          >
            <motion.div
              className="text-7xl sm:text-8xl md:text-9xl font-black"
              animate={{
                textShadow: [
                  '0 0 20px rgba(250,204,21,0.4), 0 0 60px rgba(250,204,21,0.2)',
                  '0 0 40px rgba(250,204,21,0.8), 0 0 100px rgba(250,204,21,0.4)',
                  '0 0 20px rgba(250,204,21,0.4), 0 0 60px rgba(250,204,21,0.2)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                WebkitTextStroke: '2px rgba(255,255,255,0.3)',
                color: 'transparent',
                background: 'linear-gradient(180deg, #facc15, #f97316, #ef4444)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
              }}
            >
              VS
            </motion.div>
          </motion.div>

          {/* Player 2 */}
          <motion.div
            className="text-center flex-1"
            initial={{ x: '100vw', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 80, damping: 14, duration: 1.2 }}
          >
            <motion.div
              className="text-7xl sm:text-8xl mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              {FIGHTER_EMOJI[player2?.chosenCharacter] || '❓'}
            </motion.div>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-mono mb-1 inline-block">P{player2?.id}</span>
            <div className="text-3xl sm:text-4xl font-black text-white mb-1 drop-shadow-lg">
              {player2?.name}
            </div>
          </motion.div>
        </div>

        {/* COMMENCE BATTLE */}
        <motion.button
          onClick={startBattle}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, type: 'spring', stiffness: 150 }}
          className="mt-4"
        >
          <motion.div
            className={`px-10 sm:px-14 py-4 sm:py-5 text-xl sm:text-2xl font-black uppercase tracking-[0.25em]
              border-2 border-yellow-400/50 text-yellow-300 rounded-xl backdrop-blur-sm
              ${isFinal
                ? 'bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 text-2xl sm:text-3xl'
                : 'bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-red-500/10'}`}
            animate={{
              borderColor: [
                'rgba(250,204,21,0.3)',
                'rgba(250,204,21,1)',
                'rgba(250,204,21,0.3)',
              ],
              boxShadow: isFinal
                ? [
                    '0 0 30px rgba(250,204,21,0.2), inset 0 0 20px rgba(250,204,21,0.1)',
                    '0 0 80px rgba(250,204,21,0.6), inset 0 0 40px rgba(250,204,21,0.2)',
                    '0 0 30px rgba(250,204,21,0.2), inset 0 0 20px rgba(250,204,21,0.1)',
                  ]
                : [
                    '0 0 20px rgba(250,204,21,0.1)',
                    '0 0 60px rgba(250,204,21,0.4)',
                    '0 0 20px rgba(250,204,21,0.1)',
                  ],
              scale: isFinal ? [1, 1.04, 1] : [1],
            }}
            transition={{ duration: isFinal ? 1.2 : 1.5, repeat: Infinity }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            ⚔️ COMMENCE BATTLE ⚔️
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}
