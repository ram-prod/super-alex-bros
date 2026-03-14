import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';

const FIGHTER_COLORS = {
  ruggero: '#ff4444',
  koen: '#44aaff',
  matthew: '#44ff88',
  martin: '#ff8844',
  robin: '#aa44ff',
  frederik: '#ffdd44',
  vincent: '#ff44aa',
  devan: '#44ffdd',
  gereon: '#8888ff',
  noah: '#ff6666',
  alexander: '#ffd700',
};

const FIGHTER_EMOJI = {
  ruggero: '🔥',
  koen: '⚡',
  matthew: '🌊',
  martin: '🗡️',
  robin: '🏹',
  frederik: '🛡️',
  vincent: '💎',
  devan: '🌀',
  gereon: '⚔️',
  noah: '🌩️',
  alexander: '👑',
};

function FighterCard({ character, currentPlayerId, players }) {
  const assignCharacter = useGameStore((s) => s.assignCharacter);

  const takenBy = players.find((p) => p.chosenCharacter === character.id);
  const isCurrentPlayers = takenBy?.id === currentPlayerId;
  const isTaken = !!takenBy && !isCurrentPlayers;
  const color = FIGHTER_COLORS[character.id] || '#ffffff';

  return (
    <motion.button
      onClick={() => assignCharacter(currentPlayerId, character.id)}
      disabled={isTaken}
      className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-square flex flex-col items-center justify-center gap-2
        ${isCurrentPlayers
          ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)] bg-gray-800/90 scale-[1.02]'
          : isTaken
            ? 'border-gray-700 bg-gray-900/60 opacity-40 grayscale cursor-not-allowed'
            : 'border-gray-700/50 bg-gray-900/80 hover:border-gray-500 cursor-pointer'
        }`}
      whileHover={!isTaken ? { scale: 1.08, y: -4 } : {}}
      whileTap={!isTaken ? { scale: 0.95 } : {}}
      layout
    >
      {/* Neon glow ring for selected */}
      {isCurrentPlayers && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{ boxShadow: `0 0 40px ${color}40, inset 0 0 20px ${color}20` }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Fighter emoji */}
      <span className="text-4xl sm:text-5xl relative z-10">{FIGHTER_EMOJI[character.id]}</span>

      {/* Name */}
      <span
        className="text-sm sm:text-base font-bold tracking-wide relative z-10"
        style={{ color: isCurrentPlayers ? color : isTaken ? '#666' : '#ddd' }}
      >
        {character.name}
      </span>

      {/* Taken overlay */}
      {isTaken && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"
        >
          <div className="text-center">
            <div className="text-2xl">🔒</div>
            <div className="text-xs text-gray-400 font-mono mt-1">P{takenBy.id}</div>
          </div>
        </motion.div>
      )}

      {/* Selected checkmark */}
      {isCurrentPlayers && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center z-20"
        >
          <span className="text-black text-xs font-bold">✓</span>
        </motion.div>
      )}
    </motion.button>
  );
}

function SizeSelector() {
  const tournamentSize = useGameStore((s) => s.tournamentSize);
  const setTournamentSize = useGameStore((s) => s.setTournamentSize);

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => setTournamentSize(tournamentSize - 1)}
        disabled={tournamentSize <= 2}
        className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-600 text-xl font-bold text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        −
      </motion.button>
      <div className="text-center min-w-[140px]">
        <div className="text-3xl font-black text-white">{tournamentSize}</div>
        <div className="text-xs text-gray-500 uppercase tracking-widest">Players</div>
      </div>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => setTournamentSize(tournamentSize + 1)}
        disabled={tournamentSize >= 11}
        className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-600 text-xl font-bold text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        +
      </motion.button>
    </div>
  );
}

function PlayerTabs() {
  const players = useGameStore((s) => s.players);
  const currentTurn = useGameStore((s) => s.currentTurn);

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
      {players.map((p) => {
        const isActive = p.id === currentTurn;
        const hasChar = !!p.chosenCharacter;
        const color = hasChar ? FIGHTER_COLORS[p.chosenCharacter] : null;

        return (
          <motion.button
            key={p.id}
            onClick={() => useGameStore.setState({ currentTurn: p.id })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all
              ${isActive
                ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                : hasChar
                  ? 'border-gray-600 bg-gray-800/80 text-gray-300'
                  : 'border-gray-700/50 bg-gray-900/50 text-gray-500'
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center gap-1.5">
              {hasChar && (
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: color }}
                />
              )}
              P{p.id}
              {hasChar && (
                <span className="text-[10px] opacity-60">
                  {FIGHTER_EMOJI[p.chosenCharacter]}
                </span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default function RosterView() {
  const { players, currentTurn, characters, tournamentSize, confirmRoster, goBack } = useGameStore();

  const currentPlayer = players.find((p) => p.id === currentTurn);
  const allLocked = players.every((p) => p.chosenCharacter !== null);
  const lockedCount = players.filter((p) => p.chosenCharacter !== null).length;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="relative pt-6 pb-2 px-4 text-center">
        <motion.button
          onClick={goBack}
          className="absolute top-6 left-4 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-mono z-20"
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>←</span>
          <span>Back to Title</span>
        </motion.button>
        <motion.h1
          className="text-4xl sm:text-5xl font-black tracking-tight mb-1"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500 bg-clip-text text-transparent">
            SUPER ALEX BROS
          </span>
        </motion.h1>
        <motion.p
          className="text-gray-500 text-sm uppercase tracking-[0.3em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Choose Your Fighter
        </motion.p>
      </div>

      {/* Size Selector */}
      <SizeSelector />

      {/* Player Tabs */}
      <PlayerTabs />

      {/* Current Turn Banner */}
      <motion.div
        key={currentTurn}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="text-center mb-4 px-4"
      >
        <div className="inline-flex items-center gap-3 bg-gray-900/80 border border-gray-700/50 rounded-full px-6 py-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-white font-bold text-lg">
            Player {currentTurn}
          </span>
          <span className="text-gray-400">—</span>
          <span className="text-gray-300">
            {currentPlayer?.chosenCharacter
              ? `Selected ${characters.find((c) => c.id === currentPlayer.chosenCharacter)?.name}`
              : 'Pick a fighter!'}
          </span>
        </div>
      </motion.div>

      {/* Fighter Grid */}
      <div className="flex-1 px-4 pb-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
          {characters.map((char) => (
            <FighterCard
              key={char.id}
              character={char}
              currentPlayerId={currentTurn}
              players={players}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pb-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between text-xs text-gray-500 mb-1 font-mono">
            <span>{lockedCount}/{tournamentSize} locked in</span>
            <span>{allLocked ? '✅ ALL READY' : `${tournamentSize - lockedCount} remaining`}</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: allLocked
                  ? 'linear-gradient(90deg, #facc15, #f97316, #ef4444)'
                  : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              }}
              animate={{ width: `${(lockedCount / tournamentSize) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
      </div>

      {/* START TOURNAMENT Button */}
      <AnimatePresence>
        {allLocked && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="sticky bottom-0 p-4 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent"
          >
            <motion.button
              onClick={confirmRoster}
              className="w-full max-w-md mx-auto block py-4 px-8 rounded-2xl text-xl font-black uppercase tracking-widest
                bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500
                text-black shadow-[0_0_60px_rgba(250,204,21,0.4)]
                hover:shadow-[0_0_80px_rgba(250,204,21,0.6)]"
              animate={{
                scale: [1, 1.02, 1],
                boxShadow: [
                  '0 0 40px rgba(250,204,21,0.3)',
                  '0 0 70px rgba(250,204,21,0.5)',
                  '0 0 40px rgba(250,204,21,0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              ⚡ START TOURNAMENT ⚡
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
