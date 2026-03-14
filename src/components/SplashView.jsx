import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';

export default function SplashView() {
  const setPhase = () => {
    try {
      const audio = new Audio('/assets/audio/ready_to_start.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
    useGameStore.setState({ gamePhase: 'roster_select' });
  };

  const titleWords = [
    { text: 'SUPER', gradient: 'from-yellow-300 via-orange-400 to-red-500', fromX: '-100vw', delay: 0 },
    { text: 'ALEX', gradient: 'from-cyan-400 via-blue-400 to-purple-500', fromX: '100vw', delay: 0.5 },
    { text: 'BROS', gradient: 'from-red-400 via-pink-500 to-purple-500', fromX: '-100vw', delay: 1.0 },
  ];

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center cursor-pointer"
      onClick={setPhase}
    >
      {/* BG */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* BOOM flash — fires at 1.5s when BROS lands */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 0] }}
        transition={{ duration: 2, times: [0, 0.74, 0.76, 1], ease: 'linear' }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {/* Subtitle */}
        <motion.p
          className="text-gray-400 text-xs sm:text-sm uppercase tracking-[0.5em] mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          The Ultimate Bachelor Tournament
        </motion.p>

        {/* Title container — angled like Smash */}
        <div className="-skew-x-[10deg] -rotate-2 mb-8">
          <div className="space-y-0 leading-none">
            {titleWords.map((w) => (
              <motion.div
                key={w.text}
                initial={{ x: w.fromX, opacity: 0 }}
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
        </div>

        {/* Bolt */}
        <motion.div
          className="text-5xl mb-8"
          initial={{ scale: 0 }}
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

        {/* PRESS START */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); setPhase(); }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, type: 'tween', ease: 'easeOut', duration: 0.3 }}
          className="relative"
        >
          <motion.div
            className="px-14 py-5 text-2xl sm:text-3xl font-black uppercase tracking-[0.35em]
              border-2 border-yellow-400/50 text-yellow-300 rounded-xl
              bg-yellow-500/10 backdrop-blur-sm
              hover:bg-yellow-500/20 hover:border-yellow-400 transition-colors"
            animate={{
              borderColor: ['rgba(250,204,21,0.3)', 'rgba(250,204,21,0.8)', 'rgba(250,204,21,0.3)'],
              boxShadow: [
                '0 0 15px rgba(250,204,21,0.1), inset 0 0 15px rgba(250,204,21,0.05)',
                '0 0 50px rgba(250,204,21,0.3), inset 0 0 30px rgba(250,204,21,0.1)',
                '0 0 15px rgba(250,204,21,0.1), inset 0 0 15px rgba(250,204,21,0.05)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            PRESS START
          </motion.div>
        </motion.button>

        {/* Hint */}
        <motion.p
          className="text-gray-600 text-xs mt-10 uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ delay: 3, duration: 3, repeat: Infinity }}
        >
          tap anywhere to begin
        </motion.p>
      </div>
    </div>
  );
}
