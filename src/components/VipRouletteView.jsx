import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import CharacterThumb from './CharacterThumb';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

export default function VipRouletteView() {
  const players = useGameStore((s) => s.players);
  const generateTournament = useGameStore((s) => s.generateTournament);

  const [phase, setPhase] = useState('intro'); // 'intro' | 'spinning' | 'reveal'
  const [displayIdx, setDisplayIdx] = useState(0);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (phase !== 'spinning') return;
    const interval = setInterval(() => {
      setDisplayIdx((i) => (i + 1) % players.length);
    }, 80);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      const picked = players[Math.floor(Math.random() * players.length)];
      setWinner(picked);
      setPhase('reveal');
    }, 3500);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [phase, players.length]);

  const handleProceed = () => {
    if (winner) {
      useGameStore.setState({ vipPlayerId: winner.id });
    }
    generateTournament();
    useGameStore.setState({ gamePhase: 'tournament_overview' });
  };

  const currentDisplay = players[displayIdx];

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-cover bg-center scale-110" style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }} />
      <div className="absolute inset-0 bg-black/85" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }} />

      <div className="relative z-10 text-center px-6 max-w-lg">
        <motion.h1
          className="text-5xl sm:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 mb-4 -skew-x-6"
          style={{ filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.6))' }}
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}>
          VIP ROULETTE
        </motion.h1>

        <motion.p className="text-sm sm:text-base font-bold uppercase tracking-widest text-gray-300 drop-shadow-md mb-8"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          One lucky fighter gets an automatic bye to the next round! 👑
        </motion.p>

        {/* Spinning display */}
        {phase === 'spinning' && currentDisplay && (
          <motion.div className="mb-8">
            <motion.div key={displayIdx} className="text-7xl mb-3"
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.04 }}>
              <CharacterThumb charId={currentDisplay.chosenCharacter} size="w-16 h-16" emojiSize="text-7xl" rounded={false} />
            </motion.div>
            <div className="text-2xl font-black text-white">{currentDisplay.name}</div>
          </motion.div>
        )}

        {/* Reveal */}
        <AnimatePresence>
          {phase === 'reveal' && winner && (
            <motion.div className="mb-8 space-y-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <div className="text-yellow-400 text-xs uppercase tracking-widest font-bold mb-3">👑 The VIP Is...</div>
              <motion.div
                className="inline-block bg-yellow-500/10 border-2 border-yellow-400/50 rounded-xl p-6 text-center"
                initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.3, delay: 0.5 }}
                style={{ boxShadow: '0 0 40px rgba(250,204,21,0.2)' }}>
                <div className="mb-2 flex justify-center"><CharacterThumb charId={winner.chosenCharacter} size="w-16 h-16" emojiSize="text-6xl" rounded={false} /></div>
                <div className="text-white font-black text-2xl">{winner.name}</div>
                <div className="text-yellow-300 text-xs font-bold mt-2">AUTOMATIC BYE 👑</div>
              </motion.div>

              <motion.button onClick={handleProceed}
                className="group mt-6"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <div className="px-10 py-4 border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-sm group-hover:border-yellow-400 group-hover:shadow-[0_0_40px_rgba(250,204,21,0.3)] transition-all duration-200"
                  style={{ transform: 'skewX(-10deg)' }}>
                  <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-lg text-yellow-300">
                    📊 PROCEED TO BRACKET
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spin button */}
        {phase === 'intro' && (
          <>
            <motion.button onClick={() => setPhase('spinning')}
              className="group"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <div className="px-10 py-4 border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-sm group-hover:border-yellow-400 group-hover:shadow-[0_0_50px_rgba(250,204,21,0.5)] transition-all duration-200"
                style={{ transform: 'skewX(-10deg)' }}>
                <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-xl text-yellow-300">
                  🎰 SPIN FOR VIP
                </div>
              </div>
            </motion.button>

            <motion.div className="mt-8 flex flex-wrap justify-center gap-2"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              {players.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/50 border border-gray-700/30">
                  <CharacterThumb charId={p.chosenCharacter} size="w-5 h-5" emojiSize="text-sm" />
                  <span className="text-xs text-gray-300 font-bold">{p.name}</span>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
