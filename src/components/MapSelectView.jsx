import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';

function MapCard({ map, index }) {
  const selectMap = useGameStore((s) => s.selectMap);

  return (
    <motion.button
      onClick={() => selectMap(map.id)}
      className="relative group rounded-xl overflow-hidden border-2 border-gray-700/50 hover:border-cyan-400/60 transition-colors duration-300"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Map image */}
      <div className="aspect-[16/9] relative">
        <img
          src={`/assets/maps/${map.id}.jpg`}
          alt={map.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Hover glow */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Map name */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide drop-shadow-lg">
            {map.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent rounded-full" />
            <span className="text-xs text-cyan-400/80 uppercase tracking-widest font-bold">Stage</span>
          </div>
        </div>

        {/* Corner accent */}
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-cyan-400/40 rounded-tr-lg 
          group-hover:border-cyan-400/80 transition-colors duration-300" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-cyan-400/40 rounded-bl-lg
          group-hover:border-cyan-400/80 transition-colors duration-300" />
      </div>
    </motion.button>
  );
}

export default function MapSelectView() {
  const maps = useGameStore((s) => s.maps);
  const goBack = useGameStore((s) => s.goBack);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="relative pt-6 pb-4 px-6">
        {/* Back button */}
        <motion.button
          onClick={goBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-mono"
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>←</span>
          <span>Back to Roster</span>
        </motion.button>

        {/* Title */}
        <motion.div
          className="text-center pt-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="text-4xl sm:text-5xl font-black italic tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              SELECT STAGE
            </span>
          </h1>
          <motion.div
            className="w-24 h-0.5 mx-auto mt-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />
        </motion.div>
      </div>

      {/* Map Grid */}
      <div className="flex-1 px-4 sm:px-6 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {maps.map((map, i) => (
            <MapCard key={map.id} map={map} index={i} />
          ))}
        </div>
      </div>

      {/* Bottom accent */}
      <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </div>
  );
}
