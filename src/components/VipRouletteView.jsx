import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import SlotReel from './SlotReel';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

/**
 * Reveal card — matches RosterView FighterCard style.
 * Portrait fills the card, name overlaid at bottom with gradient.
 */
function RevealCard({ player, accentColor = 'yellow', label = '' }) {
  const characters = useGameStore((s) => s.characters);
  const charData = characters.find((c) => c.id === player.chosenCharacter);
  const borderColor = accentColor === 'purple' ? 'border-purple-400' : 'border-yellow-400';
  const glowColor = accentColor === 'purple' ? 'rgba(168,85,247,0.4)' : 'rgba(250,204,21,0.4)';
  const labelColor = accentColor === 'purple' ? 'text-purple-300' : 'text-yellow-300';

  return (
    <div
      className={`relative rounded-xl overflow-hidden border-2 ${borderColor} w-36 h-36 sm:w-44 sm:h-44`}
      style={{ boxShadow: `0 0 40px ${glowColor}` }}
    >
      {charData?.portrait ? (
        <img src={`/assets/characters/${charData.portrait}`} alt={player.name} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <span className="text-6xl">{FIGHTER_EMOJI[player.chosenCharacter] || '❓'}</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2 pt-6 pb-2">
        <span className="block text-center text-base sm:text-lg font-black tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
          {player.name}
        </span>
        {label && <span className={`block text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider ${labelColor} mt-0.5`}>{label}</span>}
      </div>
    </div>
  );
}

export default function VipRouletteView() {
  const players = useGameStore((s) => s.players);
  const generateTournament = useGameStore((s) => s.generateTournament);

  const [phase, setPhase] = useState('intro'); // 'intro' | 'spinning' | 'reveal'
  const [winner, setWinner] = useState(null);

  // Pick winner after 2s of spinning — reel will decelerate to land on them
  useEffect(() => {
    if (phase !== 'spinning' || winner) return;
    const timeout = setTimeout(() => {
      const picked = players[Math.floor(Math.random() * players.length)];
      setWinner(picked);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [phase, winner, players]);

  // Called by SlotReel when deceleration is complete and reel has landed
  const handleLanded = () => {
    setTimeout(() => setPhase('reveal'), 400); // brief pause then reveal
  };

  const handleProceed = () => {
    if (winner) {
      useGameStore.setState({ vipPlayerId: winner.id });
    }
    generateTournament();
    useGameStore.setState({ gamePhase: 'tournament_overview' });
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-cover bg-center scale-110" style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }} />
      <div className="absolute inset-0 bg-black/85" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }} />

      <div className="relative z-10 text-center px-6 max-w-lg w-full">
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

        {/* Slot machine */}
        <AnimatePresence mode="wait">
          {(phase === 'intro' || phase === 'spinning') && (
            <motion.div
              key="slot"
              className="flex justify-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <SlotReel
                candidates={players}
                spinning={phase === 'spinning'}
                winner={winner}
                accentColor="yellow"
                size={180}
                onLanded={handleLanded}
              />
            </motion.div>
          )}

          {/* Reveal */}
          {phase === 'reveal' && winner && (
            <motion.div
              key="reveal"
              className="mb-8 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-yellow-400 text-xs uppercase tracking-widest font-bold mb-3">👑 The VIP Is...</div>
              <motion.div
                className="inline-block"
                initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.3, delay: 0.3 }}
              >
                <RevealCard player={winner} accentColor="yellow" label="AUTOMATIC BYE 👑" />
              </motion.div>

              <motion.button onClick={handleProceed}
                className="group mt-6"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
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
          </motion.div>
        )}
      </div>
    </div>
  );
}
