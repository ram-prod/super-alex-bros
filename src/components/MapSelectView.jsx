import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import BackButton from './BackButton';

function MapCard({ map, index }) {
  const selectMap = useGameStore((s) => s.selectMap);

  return (
    <motion.button
      onClick={() => selectMap(map.id)}
      className="relative group rounded-xl overflow-hidden border-2 border-gray-700/40
        hover:border-cyan-400/60 transition-colors duration-300 focus:outline-none"
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.8 + 0.08 * index, type: 'spring', stiffness: 180, damping: 18 }}
      whileHover={{ scale: 1.04, y: -6 }}
      whileTap={{ scale: 0.96 }}
    >
      <div className="aspect-[16/9] relative">
        <img
          src={`/assets/maps/${map.id}.jpg`}
          alt={map.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-115"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Hover glow */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(ellipse at center bottom, rgba(34,211,238,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Name */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide drop-shadow-lg">
            {map.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent rounded-full" />
            <span className="text-[10px] text-cyan-400/70 uppercase tracking-[0.3em] font-bold">Stage</span>
          </div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/30 rounded-tr-md
          group-hover:border-cyan-400/70 transition-colors duration-300" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400/30 rounded-bl-md
          group-hover:border-cyan-400/70 transition-colors duration-300" />
      </div>
    </motion.button>
  );
}

export default function MapSelectView() {
  const maps = useGameStore((s) => s.maps);
  const goBack = useGameStore((s) => s.goBack);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Slam-in title */}
      <div className="relative pt-6 pb-2 px-6">
        <div className="absolute top-6 left-6 z-20">
          <BackButton onClick={goBack} label="Tournament" />
        </div>

        <div className="text-center overflow-hidden pt-2">
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl font-black italic"
            initial={{ y: '-120%', opacity: 0, scale: 1.4 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 14, duration: 1 }}
          >
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              SELECT YOUR
            </span>
          </motion.h1>
          <motion.h1
            className="text-6xl sm:text-7xl md:text-8xl font-black italic -mt-1"
            initial={{ y: '120%', opacity: 0, scale: 1.4 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 14, duration: 1, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              STAGE
            </span>
          </motion.h1>
          <motion.div
            className="w-32 h-0.5 mx-auto mt-3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          />
        </div>
      </div>

      {/* Map Grid */}
      <div className="flex-1 px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {maps.map((map, i) => (
            <MapCard key={map.id} map={map} index={i} />
          ))}
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
    </div>
  );
}
