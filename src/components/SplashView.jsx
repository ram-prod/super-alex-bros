import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';

export default function SplashView() {
  const hasSeenIntro = useGameStore((s) => s.hasSeenIntro);
  const setHasSeenIntro = useGameStore((s) => s.setHasSeenIntro);
  const [showMenu, setShowMenu] = useState(hasSeenIntro);

  const handlePressStart = () => {
    try {
      const audio = new Audio('/assets/audio/ready_to_start.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
    useGameStore.getState().setBgmState('playing');
    setHasSeenIntro();
    setShowMenu(true);
  };

  const titleWords = [
    { text: 'SUPER', gradient: 'from-yellow-300 via-orange-400 to-red-500', fromX: '-100vw', delay: 0 },
    { text: 'ALEX', gradient: 'from-cyan-400 via-blue-400 to-purple-500', fromX: '100vw', delay: 0.5 },
    { text: 'BROS', gradient: 'from-red-400 via-pink-500 to-purple-500', fromX: '-100vw', delay: 1.0 },
  ];

  const menuItems = [
    { label: 'START TOURNAMENT', icon: '⚔️', action: () => useGameStore.setState({ gamePhase: 'roster_select' }) },
    { label: 'HOW TO PLAY', icon: '📖', action: () => useGameStore.setState({ gamePhase: 'rules' }) },
    { label: 'CONTENT MANAGER', icon: '🎮', action: () => alert('Coming soon in Phase 2') },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center">
      {/* BG */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* BOOM flash — fires at 1.5s when BROS lands */}
      {!showMenu && (
        <motion.div
          className="absolute inset-0 bg-white pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 0] }}
          transition={{ duration: 2, times: [0, 0.74, 0.76, 1], ease: 'linear' }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-6 flex flex-col items-center">
        {/* Subtitle */}
        <motion.p
          className="text-gray-400 text-xs sm:text-sm uppercase tracking-[0.5em] mb-6"
          initial={hasSeenIntro ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: showMenu ? 0 : 1 }}
          transition={{ delay: showMenu ? 0 : 1.8, duration: showMenu ? 0.3 : 0.5 }}
        >
          The Ultimate Bachelor Tournament
        </motion.p>

        {/* Title container — slides up when menu shows */}
        <motion.div
          className="-skew-x-[10deg] -rotate-2 mb-8"
          animate={showMenu ? { y: '-12vh', scale: 0.75 } : { y: 0, scale: 1 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.6 }}
        >
          <div className="space-y-0 leading-none">
            {titleWords.map((w) => (
              <motion.div
                key={w.text}
                initial={hasSeenIntro ? false : { x: w.fromX, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.2, delay: w.delay }}
              >
                <h1
                  className={`text-7xl sm:text-8xl md:text-9xl font-black bg-gradient-to-r ${w.gradient} bg-clip-text text-transparent`}
                  style={{
                    lineHeight: 1.05,
                    filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.5)) drop-shadow(0 0 30px rgba(0,0,0,0.3))',
                  }}
                >
                  {w.text}
                </h1>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bolt */}
        {!showMenu && (
          <motion.div
            className="text-5xl mb-8"
            initial={hasSeenIntro ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.4, type: 'tween', ease: 'easeOut', duration: 0.2 }}
          >
            <motion.span
              className="inline-block"
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: 2 }}
            >
              ⚡
            </motion.span>
          </motion.div>
        )}

        {/* PRESS START — hidden when menu is open */}
        <AnimatePresence>
          {!showMenu && (
            <motion.button
              onClick={handlePressStart}
              data-sound="special"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
              transition={{ delay: 2, type: 'tween', ease: 'easeOut', duration: 0.3 }}
              className="relative"
            >
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
                <motion.div
                  className="px-14 py-5 border-2 border-yellow-400/50 text-yellow-300 rounded-sm
                    bg-yellow-500/10 backdrop-blur-sm
                    hover:bg-yellow-500/20 hover:border-yellow-400 transition-colors"
                  initial={{ skewX: -10 }}
                  animate={{
                    skewX: -10,
                    borderColor: ['rgba(250,204,21,0.3)', 'rgba(250,204,21,0.8)', 'rgba(250,204,21,0.3)'],
                    boxShadow: [
                      '0 0 15px rgba(250,204,21,0.1), inset 0 0 15px rgba(250,204,21,0.05)',
                      '0 0 50px rgba(250,204,21,0.3), inset 0 0 30px rgba(250,204,21,0.1)',
                      '0 0 15px rgba(250,204,21,0.1), inset 0 0 15px rgba(250,204,21,0.05)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-3xl tracking-[0.35em]">
                    PRESS START
                  </div>
                </motion.div>
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Hint — hidden when menu is open */}
        {!showMenu && (
          <motion.p
            className="text-gray-600 text-xs mt-10 uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ delay: 3, duration: 3, repeat: Infinity }}
          >
            tap anywhere to begin
          </motion.p>
        )}

        {/* Main Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              className="flex flex-col gap-4 w-full max-w-md mt-4"
              initial={hasSeenIntro ? false : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.5, delay: 0.2 }}
            >
              {menuItems.map((item, i) => (
                <motion.button
                  key={item.label}
                  onClick={item.action}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.4, delay: 0.3 + i * 0.12 }}
                  className="group"
                >
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <div className="flex items-center gap-4 px-8 py-5 border-2 border-orange-500/50 bg-black/80 backdrop-blur-md text-white rounded-sm group-hover:border-orange-400 group-hover:bg-orange-500/20 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all duration-200"
                      style={{ transform: 'skewX(-10deg)' }}>
                      <div style={{ transform: 'skewX(10deg)' }} className="flex items-center gap-4 text-smash text-xl sm:text-2xl">
                        <span className="text-2xl drop-shadow-md">{item.icon}</span><span>{item.label}</span>
                      </div>
                    </div>
                  </motion.div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
