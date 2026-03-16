import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

export default function ConfirmationView() {
  const players = useGameStore((s) => s.players);
  const evaluateVipPhase = useGameStore((s) => s.evaluateVipPhase);
  const goBack = useGameStore((s) => s.goBack);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-cover bg-center scale-110" style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }} />
      <div className="absolute inset-0 bg-black/75" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }} />

      <div className="relative z-10 text-center px-6 max-w-xl">
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 mb-4 -skew-x-6"
          style={{ filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.6))' }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
        >
          ARE YOU READY?
        </motion.h1>

        <motion.p className="text-sm sm:text-base font-bold uppercase tracking-widest text-gray-300 drop-shadow-md mb-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          {players.length} fighters are about to enter the arena
        </motion.p>

        {/* Fighter lineup */}
        <motion.div className="flex flex-wrap justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/40">
              <span className="text-lg">{FIGHTER_EMOJI[p.chosenCharacter] || '❓'}</span>
              <span className="text-xs font-bold text-white">{p.name}</span>
            </div>
          ))}
        </motion.div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <motion.button
            onClick={evaluateVipPhase}
            className="group w-full"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-full py-4 border-2 border-yellow-400/50 bg-yellow-500/10 rounded-sm group-hover:bg-yellow-500/20 group-hover:border-yellow-400 group-hover:shadow-[0_0_40px_rgba(250,204,21,0.3)] transition-all duration-200"
              style={{ transform: 'skewX(-10deg)' }}>
              <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-xl text-yellow-300">
                ⚔️ LET&apos;S GO!
              </div>
            </div>
          </motion.button>

          <motion.button
            onClick={goBack}
            className="group w-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-full py-3 border-2 border-gray-700 bg-gray-900/50 rounded-sm group-hover:border-gray-500 group-hover:bg-gray-800/30 transition-all duration-200"
              style={{ transform: 'skewX(-10deg)' }}>
              <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-sm text-gray-400 group-hover:text-white transition-colors">
                ← BACK TO ROSTER
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
