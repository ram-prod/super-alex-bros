import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';

const SLIDES = [
  {
    title: 'THE TOURNAMENT',
    icon: '⚔️',
    body: '11 Bachelors enter. Pure Knockout format. Lose once, and you are OUT.',
    accent: 'from-red-500 via-orange-500 to-yellow-500',
    bg: 'rgba(239,68,68,0.08)',
  },
  {
    title: 'THE BOSS',
    icon: '👑',
    body: 'Alexander (The Bachelor) receives an automatic VIP Bye to the Quarter-Finals. He watches the bloodbath from his throne.',
    accent: 'from-yellow-300 via-amber-400 to-orange-500',
    bg: 'rgba(250,204,21,0.08)',
  },
  {
    title: 'THE WILDCARDS',
    icon: '🃏',
    body: 'To create a perfect 8-man bracket, 2 losers from Round 1 will be randomly resurrected via the Wildcard Roulette!',
    accent: 'from-purple-400 via-pink-500 to-red-500',
    bg: 'rgba(168,85,247,0.08)',
  },
];

export default function RulesView() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = (index) => {
    if (index === currentSlide) return;
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const next = () => { if (currentSlide < SLIDES.length - 1) goTo(currentSlide + 1); };
  const prev = () => { if (currentSlide > 0) goTo(currentSlide - 1); };

  const slide = SLIDES[currentSlide];

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* BG */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* Back button */}
      <div className="relative z-20 p-4 sm:p-6">
        <motion.button
          onClick={() => useGameStore.setState({ gamePhase: 'splash' })}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-xl group-hover:text-yellow-400 transition-colors">←</span>
          <span className="text-sm font-bold uppercase tracking-widest">Back to Menu</span>
        </motion.button>
      </div>

      {/* Slide content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            initial={(d) => ({ x: d * 300, opacity: 0 })}
            animate={{ x: 0, opacity: 1 }}
            exit={(d) => ({ x: d * -300, opacity: 0 })}
            variants={{
              initial: (d) => ({ x: (d || direction) * 300, opacity: 0 }),
              animate: { x: 0, opacity: 1 },
              exit: (d) => ({ x: (d || direction) * -300, opacity: 0 }),
            }}
            custom={direction}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
            className="flex flex-col items-center text-center max-w-2xl"
          >
            {/* Icon */}
            <motion.div
              className="text-7xl sm:text-8xl mb-6"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3, delay: 0.15 }}
            >
              {slide.icon}
            </motion.div>

            {/* Title */}
            <motion.h1
              className={`text-5xl sm:text-6xl md:text-7xl font-black italic uppercase bg-gradient-to-r ${slide.accent} bg-clip-text text-transparent mb-6 -skew-x-6`}
              style={{
                filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.6))',
                lineHeight: 1.1,
              }}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.3, delay: 0.1 }}
            >
              {slide.title}
            </motion.h1>

            {/* Body */}
            <motion.div
              className="rounded-2xl border border-white/10 p-6 sm:p-8 backdrop-blur-md"
              style={{ backgroundColor: slide.bg }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.4, delay: 0.2 }}
            >
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-relaxed">
                {slide.body}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="relative z-20 pb-8 px-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Prev */}
          <motion.button
            onClick={prev}
            disabled={currentSlide === 0}
            className={`px-6 py-3 rounded-xl font-black uppercase tracking-wider text-sm border-2 transition-colors
              ${currentSlide === 0
                ? 'border-gray-700 text-gray-700 cursor-not-allowed'
                : 'border-white/30 text-white hover:border-yellow-400 hover:text-yellow-400'}`}
            whileHover={currentSlide > 0 ? { scale: 1.05 } : {}}
            whileTap={currentSlide > 0 ? { scale: 0.95 } : {}}
          >
            ← PREV
          </motion.button>

          {/* Dots */}
          <div className="flex gap-3">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? 'bg-yellow-400 scale-125 shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Next */}
          <motion.button
            onClick={next}
            disabled={currentSlide === SLIDES.length - 1}
            className={`px-6 py-3 rounded-xl font-black uppercase tracking-wider text-sm border-2 transition-colors
              ${currentSlide === SLIDES.length - 1
                ? 'border-gray-700 text-gray-700 cursor-not-allowed'
                : 'border-white/30 text-white hover:border-yellow-400 hover:text-yellow-400'}`}
            whileHover={currentSlide < SLIDES.length - 1 ? { scale: 1.05 } : {}}
            whileTap={currentSlide < SLIDES.length - 1 ? { scale: 0.95 } : {}}
          >
            NEXT →
          </motion.button>
        </div>
      </div>
    </div>
  );
}
