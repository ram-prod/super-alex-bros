import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';

export default function SplashView() {
  const setPhase = () => {
    // Try to play audio
    try {
      const audio = new Audio('/assets/audio/ready_to_start.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
    useGameStore.setState({ gamePhase: 'roster_select' });
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center">
      {/* BG Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Animated particles / scanlines vibe */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {/* Subtitle top */}
        <motion.p
          className="text-gray-400 text-sm uppercase tracking-[0.5em] mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          The Ultimate Bachelor Tournament
        </motion.p>

        {/* Title */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.1 }}
        >
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black leading-none mb-2">
            <motion.span
              className="block bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-2xl"
              animate={{
                textShadow: [
                  '0 0 20px rgba(250,204,21,0.3)',
                  '0 0 60px rgba(250,204,21,0.6)',
                  '0 0 20px rgba(250,204,21,0.3)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              SUPER
            </motion.span>
            <motion.span
              className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent"
              animate={{
                textShadow: [
                  '0 0 20px rgba(34,211,238,0.3)',
                  '0 0 60px rgba(34,211,238,0.6)',
                  '0 0 20px rgba(34,211,238,0.3)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            >
              ALEX
            </motion.span>
            <motion.span
              className="block bg-gradient-to-r from-red-400 via-pink-500 to-purple-500 bg-clip-text text-transparent"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
            >
              BROS
            </motion.span>
          </h1>
        </motion.div>

        {/* Divider line */}
        <motion.div
          className="w-32 h-0.5 mx-auto my-6 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        />

        {/* Smash bolt icon */}
        <motion.div
          className="text-5xl mb-8"
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          ⚡
        </motion.div>

        {/* PRESS START button */}
        <motion.button
          onClick={setPhase}
          className="relative group"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            className="px-12 py-5 rounded-2xl text-2xl sm:text-3xl font-black uppercase tracking-[0.3em]
              bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20
              border-2 border-yellow-400/60 text-yellow-300
              hover:bg-yellow-500/30 hover:border-yellow-400
              transition-colors duration-300"
            animate={{
              borderColor: ['rgba(250,204,21,0.4)', 'rgba(250,204,21,0.8)', 'rgba(250,204,21,0.4)'],
              boxShadow: [
                '0 0 20px rgba(250,204,21,0.1)',
                '0 0 50px rgba(250,204,21,0.3)',
                '0 0 20px rgba(250,204,21,0.1)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            PRESS START
          </motion.div>
        </motion.button>

        {/* Footer hint */}
        <motion.p
          className="text-gray-600 text-xs mt-8 uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ delay: 2, duration: 3, repeat: Infinity }}
        >
          tap anywhere to begin
        </motion.p>
      </div>
    </div>
  );
}
