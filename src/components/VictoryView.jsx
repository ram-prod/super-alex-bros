import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import { FIGHTER_EMOJI, FIGHTER_COLORS } from '../data/fighters';

export default function VictoryView() {
  const {
    matchWinner, players, selectedMap, nextMatch, resetGame,
    characters, isTournamentOver, tournamentWinner,
  } = useGameStore();

  const [animStep, setAnimStep] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [sikeImgError, setSikeImgError] = useState(false);

  // The player shown as "winner" depends on the anim step
  // For tournament end: step 0-2 = real winner, step 3 = SIKE, step 4 = Alexander
  const realWinner = isTournamentOver ? tournamentWinner : matchWinner;
  const winnerCharName = characters.find((c) => c.id === realWinner?.chosenCharacter)?.name || '???';
  const winnerColor = FIGHTER_COLORS[realWinner?.chosenCharacter] || '#facc15';

  // Find Alexander player
  const alexanderPlayer = players.find((p) => p.chosenCharacter === 'alexander');
  const alexanderColor = FIGHTER_COLORS.alexander;

  useEffect(() => {
    const timers = [];
    if (!isTournamentOver) {
      // Normal round victory
      timers.push(setTimeout(() => setAnimStep(1), 3000));
      timers.push(setTimeout(() => setAnimStep(2), 6500));
    } else {
      // Tournament end — extended sequence with SIKE
      timers.push(setTimeout(() => setAnimStep(1), 3000));
      timers.push(setTimeout(() => setAnimStep(2), 6500));
      timers.push(setTimeout(() => {
        setAnimStep(3);
        useGameStore.getState().playSFX('sike', 0.7);
        useGameStore.getState().playSFX('smash', 1.0);
      }, 11000)); // SIKE at 11s
      timers.push(setTimeout(() => setAnimStep(4), 13500)); // Alexander reveal at 13.5s
    }
    return () => timers.forEach(clearTimeout);
  }, [isTournamentOver]);

  // Leaderboard for tournament end
  const leaderboard = [...players].sort((a, b) => b.wins - a.wins);

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
      <div className="absolute inset-0 bg-black/60" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* SIKE flash — full white screen flash at step 3 */}
      <AnimatePresence>
        {animStep === 3 && (
          <motion.div
            key="sike-flash"
            className="absolute inset-0 bg-white z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, times: [0, 0.05, 0.3, 1] }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 text-center px-6 w-full max-w-3xl">
        <AnimatePresence mode="wait">
          {/* ===== Step 0: VICTORY! slam ===== */}
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
                style={{ filter: 'drop-shadow(0 8px 0 rgba(0,0,0,0.6)) drop-shadow(0 0 60px rgba(250,204,21,0.4))' }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                VICTORY!
              </motion.h1>
              <motion.div
                className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-[600px] h-[200px] rounded-full blur-3xl"
                  style={{ background: `radial-gradient(ellipse, ${winnerColor}40 0%, transparent 70%)` }} />
              </motion.div>
            </motion.div>
          )}

          {/* ===== Step 1: Winner announcement ===== */}
          {animStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <div className="mb-4">
                {(() => {
                  const cd = characters.find((c) => c.id === realWinner?.chosenCharacter);
                  return cd?.portrait
                    ? <img src={`/assets/characters/${cd.portrait}`} alt={realWinner?.name}
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-3 shadow-lg"
                        style={{ borderColor: winnerColor, boxShadow: `0 0 30px ${winnerColor}50` }} />
                    : <span className="text-6xl">{FIGHTER_EMOJI[realWinner?.chosenCharacter] || '🏆'}</span>;
                })()}
              </div>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-mono mb-2 inline-block">P{realWinner?.id}</span>
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight"
                style={{ filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.5))' }}>
                <span style={{ color: winnerColor }}>{realWinner?.name}</span>
              </h2>
              <motion.p
                className="text-2xl sm:text-3xl font-black text-white mt-4 uppercase tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ filter: 'drop-shadow(0 3px 0 rgba(0,0,0,0.5))' }}
              >
                {isTournamentOver ? '🏆 TOURNAMENT CHAMPION! 🏆' : 'WINS THIS ROUND!'}
              </motion.p>
            </motion.div>
          )}

          {/* ===== Step 2: Character reveal + (buttons or leaderboard) ===== */}
          {animStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <motion.div className="mb-6 relative"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}>
                {(() => {
                  const cd = characters.find((c) => c.id === realWinner?.chosenCharacter);
                  if (cd?.portrait && !imgError) {
                    return <img src={`/assets/characters/${cd.portrait}`} alt={winnerCharName}
                      onError={() => setImgError(true)}
                      className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl object-cover border-4 shadow-lg"
                      style={{ borderColor: winnerColor, boxShadow: `0 0 50px ${winnerColor}60` }} />;
                  }
                  if (!imgError) {
                    const src = `/assets/characters/${realWinner?.chosenCharacter}.jpg`;
                    return <img src={src} alt={winnerCharName}
                      onError={() => setImgError(true)}
                      className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl object-cover border-4 shadow-lg"
                      style={{ borderColor: winnerColor, boxShadow: `0 0 50px ${winnerColor}60` }} />;
                  }
                  return <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl border-4 flex items-center justify-center text-7xl"
                    style={{ borderColor: winnerColor, backgroundColor: `${winnerColor}15`, boxShadow: `0 0 50px ${winnerColor}60` }}>
                    {FIGHTER_EMOJI[realWinner?.chosenCharacter] || '🏆'}
                  </div>;
                })()}
                <motion.div className="absolute -top-3 -right-3 text-4xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  {isTournamentOver ? '👑' : '🏆'}
                </motion.div>
              </motion.div>

              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-mono mb-1 inline-block">P{realWinner?.id}</span>
              <h2 className="text-4xl sm:text-5xl font-black mb-1"
                style={{ color: winnerColor, filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.4))' }}>
                {realWinner?.name}
              </h2>

              {isTournamentOver && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="mb-6 w-full max-w-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-mono">Leaderboard</p>
                  <div className="space-y-1">
                    {leaderboard.slice(0, 5).map((p, i) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5">
                        <span className="text-sm font-bold text-gray-300">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {p.name}
                        </span>
                        <span className="text-sm font-mono text-yellow-400">{p.wins}W</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Buttons — only for round wins OR if tournament over and NOT about to SIKE */}
              {!isTournamentOver && (
                <motion.div className="flex gap-4 mt-8" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                  <motion.button onClick={nextMatch}
                    className="group"
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <div className="px-8 py-4 border-2 border-cyan-400/50 bg-cyan-500/10 rounded-sm group-hover:border-cyan-300 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-200"
                      style={{ transform: 'skewX(-10deg)' }}>
                      <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-xl text-cyan-300">
                        Tournament Overview →
                      </div>
                    </div>
                  </motion.button>
                </motion.div>
              )}

              {isTournamentOver && (
                <motion.p className="text-sm text-gray-500 mt-4 animate-pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                  Wait for it...
                </motion.p>
              )}
            </motion.div>
          )}

          {/* ===== Step 3: SIKE! ===== */}
          {animStep === 3 && (
            <motion.div
              key="step3-sike"
              initial={{ scale: 6, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <motion.h1
                className="text-8xl sm:text-9xl md:text-[12rem] font-black italic"
                style={{
                  color: '#ff0040',
                  filter: 'drop-shadow(0 8px 0 rgba(0,0,0,0.7)) drop-shadow(0 0 80px rgba(255,0,64,0.5))',
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, -2, 2, 0],
                }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                SIKE!
              </motion.h1>
              <motion.p
                className="text-2xl sm:text-3xl font-black text-white mt-4 uppercase tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ filter: 'drop-shadow(0 3px 0 rgba(0,0,0,0.5))' }}
              >
                YOU THOUGHT?! 😈
              </motion.p>
            </motion.div>
          )}

          {/* ===== Step 4: Alexander ALWAYS wins ===== */}
          {animStep === 4 && (
            <motion.div
              key="step4-alexander"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              {/* Crown rain effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-3xl"
                    initial={{ y: -50, x: `${(i * 8.3) + Math.random() * 5}%`, opacity: 0 }}
                    animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: [0, 360] }}
                    transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                  >
                    👑
                  </motion.div>
                ))}
              </div>

              <motion.div className="mb-4 relative"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}>
                {!sikeImgError ? (
                  <img src={`/assets/characters/${characters.find(c => c.id === 'alexander')?.portrait || 'alexander-portrait.jpg'}`} alt="Alexander"
                    onError={() => setSikeImgError(true)}
                    className="w-52 h-52 sm:w-72 sm:h-72 rounded-2xl object-cover border-4 shadow-lg"
                    style={{ borderColor: alexanderColor, boxShadow: `0 0 60px ${alexanderColor}80` }} />
                ) : (
                  <div className="w-52 h-52 sm:w-72 sm:h-72 rounded-2xl border-4 flex items-center justify-center text-8xl"
                    style={{ borderColor: alexanderColor, backgroundColor: `${alexanderColor}15`, boxShadow: `0 0 60px ${alexanderColor}80` }}>
                    👑
                  </div>
                )}
                <motion.div className="absolute -top-4 -right-4 text-5xl"
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}>
                  👑
                </motion.div>
              </motion.div>

              <motion.h2
                className="text-5xl sm:text-6xl md:text-7xl font-black mb-2"
                style={{ color: alexanderColor, filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.5))' }}
                initial={{ x: '-100vw' }}
                animate={{ x: 0 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.2, delay: 0.3 }}
              >
                ALEXANDER
              </motion.h2>

              <motion.p
                className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wide mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                style={{ filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.4))' }}
              >
                🏆 THE REAL CHAMPION 🏆
              </motion.p>

              <motion.p
                className="text-lg text-gray-300 italic mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                It's his bachelor, he ALWAYS wins 😎
              </motion.p>

              <motion.button onClick={resetGame}
                className="group"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <div className="px-10 py-4 border-2 border-orange-400/50 bg-orange-500/10 rounded-sm group-hover:border-yellow-400 group-hover:bg-yellow-500/20 group-hover:shadow-[0_0_40px_rgba(250,204,21,0.4)] transition-all duration-200"
                  style={{ transform: 'skewX(-10deg)' }}>
                  <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-xl text-yellow-300">
                    New Tournament 🎮
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
