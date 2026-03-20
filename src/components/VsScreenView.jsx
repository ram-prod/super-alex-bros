import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

/*
 * Diagonal split: clip-path from (58%, 0) to (42%, 100%).
 * The energy slash uses the SAME clip-path coordinates so it always
 * aligns perfectly regardless of screen size or aspect ratio.
 */

function FighterPanel({ player, side, characters }) {
  const charId = player?.chosenCharacter;
  const charData = characters.find((c) => c.id === charId);
  const isLeft = side === 'left';
  const hasBody = !!charData?.body;

  // Show character name subtitle only if different from player name
  const charName = charData?.name || '???';
  const showCharSubtitle = charName.toLowerCase() !== (player?.name || '').toLowerCase();

  return (
    <div className={`relative flex flex-col items-center justify-end h-full ${isLeft ? 'pr-4 sm:pr-8' : 'pl-4 sm:pl-8'}`}>
      {/* Character image or emoji fallback */}
      <motion.div
        className="relative z-10 flex-1 flex items-end justify-center min-h-0"
        initial={{ x: isLeft ? '-60vw' : '60vw', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.5, delay: 0.1 }}
      >
        {hasBody ? (
          <motion.div
            className="max-h-[65vh] flex items-end justify-center"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              src={`/assets/characters/${charData.body}`}
              alt={player?.name}
              className="max-h-[65vh] w-auto object-contain"
              style={{
                transform: isLeft ? 'none' : 'scaleX(-1)',
                filter: `drop-shadow(0 0 30px rgba(0,0,0,0.9)) drop-shadow(0 0 20px ${isLeft ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.4)'})`,
              }}
            />
          </motion.div>
        ) : (
          /* Silhouette placeholder with emoji */
          <motion.div
            className="relative flex items-center justify-center"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div
              className={`w-48 h-64 sm:w-56 sm:h-80 md:w-64 md:h-96 rounded-2xl flex items-center justify-center ${
                isLeft
                  ? 'bg-gradient-to-t from-red-900/60 to-red-800/20 border border-red-500/30'
                  : 'bg-gradient-to-t from-blue-900/60 to-blue-800/20 border border-blue-500/30'
              }`}
              style={{
                boxShadow: isLeft
                  ? '0 0 40px rgba(239,68,68,0.2), inset 0 0 40px rgba(239,68,68,0.1)'
                  : '0 0 40px rgba(59,130,246,0.2), inset 0 0 40px rgba(59,130,246,0.1)',
              }}
            >
              <span className="text-8xl sm:text-9xl drop-shadow-lg">{FIGHTER_EMOJI[charId] || '❓'}</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Name plate */}
      <motion.div
        className="relative z-20 mt-2 mb-4 text-center"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.4, delay: 0.6 }}
      >
        <div
          className={`px-6 sm:px-8 py-2 sm:py-3 backdrop-blur-sm border-b-2 ${
            isLeft
              ? 'bg-red-950/60 border-red-500/80'
              : 'bg-blue-950/60 border-blue-500/80'
          }`}
          style={{ transform: 'skewX(-8deg)' }}
        >
          <div
            className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-wider drop-shadow-lg"
            style={{ transform: 'skewX(8deg)' }}
          >
            {player?.name}
          </div>
        </div>
        {showCharSubtitle && (
          <div
            className={`text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mt-1 ${
              isLeft ? 'text-red-400/70' : 'text-blue-400/70'
            }`}
          >
            as {charName}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function VsScreenView() {
  const { currentMatch, startBattle, characters } = useGameStore();
  const { player1, player2 } = currentMatch;
  const isFinal = currentMatch.isFinal;

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Red half (left) */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-red-950 via-red-900/90 to-black"
        style={{ clipPath: 'polygon(0 0, 58% 0, 42% 100%, 0 100%)' }}
      />
      {/* Blue half (right) */}
      <div
        className="absolute inset-0 bg-gradient-to-bl from-blue-950 via-blue-900/90 to-black"
        style={{ clipPath: 'polygon(58% 0, 100% 0, 100% 100%, 42% 100%)' }}
      />

      {/* Diagonal energy slash — exact same angle as clip-path split */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        {/* Single slash element using same clip-path coords as the red/blue split */}
        {/* Wide outer glow */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: 'polygon(56% 0, 60% 0, 44% 100%, 40% 100%)',
            background: 'linear-gradient(180deg, rgba(250,204,21,0.05), rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.15) 70%, rgba(250,204,21,0.05))',
            filter: 'blur(8px)',
          }}
        />
        {/* Medium glow */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: 'polygon(57.5% 0, 58.5% 0, 42.5% 100%, 41.5% 100%)',
            background: 'linear-gradient(180deg, rgba(250,204,21,0.2), rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 70%, rgba(250,204,21,0.2))',
            filter: 'blur(3px)',
          }}
        />
        {/* Sharp center line — exact same line as the split */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: 'polygon(57.9% 0, 58.1% 0, 42.1% 100%, 41.9% 100%)',
            background: 'linear-gradient(180deg, rgba(250,204,21,0.6), rgba(255,255,255,1) 20%, rgba(255,255,255,1) 80%, rgba(250,204,21,0.6))',
          }}
        />
      </motion.div>

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* Screen flash on VS impact */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.7, 0] }}
        transition={{ duration: 1.2, times: [0, 0.55, 0.6, 0.75], ease: 'easeOut' }}
      />

      {/* Content layer */}
      <div className="relative z-30 flex-1 flex flex-col min-h-screen">
        {/* GRAND FINAL banner */}
        {isFinal && (
          <motion.div
            className="relative z-40 pt-6 sm:pt-8 text-center"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.4, delay: 0.8 }}
          >
            <motion.h2
              className="text-3xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-wide"
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
              className="text-xs sm:text-sm text-yellow-400/70 uppercase tracking-[0.4em] font-bold mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              The Bachelor Villa
            </motion.p>
          </motion.div>
        )}

        {/* Fighters + VS center area */}
        <div className="flex-1 flex items-stretch relative">
          {/* Left fighter */}
          <div className="w-1/2 flex items-center justify-center">
            <FighterPanel player={player1} side="left" characters={characters} />
          </div>

          {/* VS badge — centered on the slash */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
            initial={{ scale: 6, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.55, type: 'tween', ease: 'easeOut', duration: 0.25 }}
          >
            <motion.div
              className="relative"
              animate={{
                filter: [
                  'drop-shadow(0 0 20px rgba(250,204,21,0.4))',
                  'drop-shadow(0 0 50px rgba(250,204,21,0.8))',
                  'drop-shadow(0 0 20px rgba(250,204,21,0.4))',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span
                className="text-7xl sm:text-8xl md:text-9xl font-black italic select-none"
                style={{
                  WebkitTextStroke: '3px rgba(255,255,255,0.4)',
                  background: 'linear-gradient(180deg, #facc15, #f97316, #ef4444)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.6))',
                }}
              >
                VS
              </span>
            </motion.div>
          </motion.div>

          {/* Right fighter */}
          <div className="w-1/2 flex items-center justify-center">
            <FighterPanel player={player2} side="right" characters={characters} />
          </div>
        </div>

        {/* COMMENCE BATTLE button */}
        <div className="relative z-40 flex justify-center pb-8 sm:pb-10">
          <motion.button
            onClick={startBattle}
            data-sound="special"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, type: 'tween', ease: 'easeOut', duration: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
              <div className={`flex items-center justify-center px-10 sm:px-14 py-4 sm:py-5 border-2 backdrop-blur-md transition-all duration-300 ${
                isFinal
                  ? 'bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border-yellow-400/80 text-yellow-300 hover:shadow-[0_0_50px_rgba(250,204,21,0.6)]'
                  : 'bg-red-600/20 border-red-500/80 text-red-400 hover:bg-red-600/30 hover:border-red-400 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)]'
              }`} style={{ transform: 'skewX(-10deg)' }}>
                <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-3xl sm:text-4xl">
                  ⚔️ COMMENCE BATTLE ⚔️
                </div>
              </div>
            </motion.div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
