import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import CharacterThumb from './CharacterThumb';

export default function VipRevealView() {
  const players = useGameStore((s) => s.players);
  const vipPlayerId = useGameStore((s) => s.vipPlayerId);
  const generateTournament = useGameStore((s) => s.generateTournament);

  const vipPlayer = players.find((p) => p.id === vipPlayerId);
  const charId = vipPlayer?.chosenCharacter;

  const handleProceed = () => {
    generateTournament();
    useGameStore.setState({ gamePhase: 'tournament_overview' });
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-cover bg-center scale-110" style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }} />
      <div className="absolute inset-0 bg-black/80" />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)' }} />

      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* Crown flash */}
        <motion.div className="text-8xl sm:text-9xl mb-6"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.4, delay: 0.3 }}>
          <CharacterThumb charId={charId} size="w-24 h-24 sm:w-32 sm:h-32" emojiSize="text-8xl sm:text-9xl" rounded={false} />
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 mb-3 -skew-x-6"
          style={{ filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.6))' }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.4, delay: 0.5 }}>
          VIP BYE!
        </motion.h1>

        <motion.div className="mb-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <p className="text-2xl font-black text-yellow-300 mb-2">{vipPlayer?.name}</p>
          <p className="text-sm sm:text-base font-bold uppercase tracking-widest text-gray-300 drop-shadow-md mb-2">
            The Bachelor gets an automatic bye to the next round! 👑
          </p>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-400 drop-shadow-md mt-2">
            He watches the bloodbath from his throne.
          </p>
        </motion.div>

        <motion.button
          onClick={handleProceed}
          className="group"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="px-10 py-4 border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-sm group-hover:border-yellow-400 group-hover:shadow-[0_0_40px_rgba(250,204,21,0.3)] transition-all duration-200"
            style={{ transform: 'skewX(-10deg)' }}>
            <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-lg text-yellow-300">
              📊 PROCEED TO BRACKET
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
