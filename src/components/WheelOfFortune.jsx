import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

const FIGHTER_COLORS = {
  ruggero: '#ff4444', koen: '#44aaff', matthew: '#44ff88', martin: '#ff8844', robin: '#aa44ff',
  frederik: '#ffdd44', vincent: '#ff44aa', devan: '#44ffdd', gereon: '#8888ff', noah: '#ff6666', alexander: '#ffd700',
};

// Darken a hex color by a factor (0-1)
function darken(hex, factor = 0.4) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
}

/**
 * SVG Wheel segment path (pie slice)
 */
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function WheelOfFortune({ onClose }) {
  const players = useGameStore((s) => s.players);
  const characters = useGameStore((s) => s.characters);

  const [phase, setPhase] = useState('idle'); // idle | spinning | reveal
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState(null);

  const rotationRef = useRef(0);
  const rafRef = useRef(null);

  const count = players.length;
  const segmentAngle = 360 / count;

  // Wheel sizing
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;

  const handleSpin = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('spinning');

    useGameStore.getState().playSFX('click_epic');

    // Pick random winner
    const winnerIdx = Math.floor(Math.random() * count);
    setWinner(players[winnerIdx]);

    // Calculate target: the winner segment's center should align with the needle (top = 0°)
    // Segment i spans from i*segmentAngle to (i+1)*segmentAngle
    // Center of winner segment in wheel-local degrees:
    const segCenter = winnerIdx * segmentAngle + segmentAngle / 2;
    // We need to rotate the wheel so this segment is at the top (0°/360°)
    // The needle is at top, so we need rotation = 360 - segCenter (to bring it to top)
    // Plus at least 4 full rotations for drama
    const targetBase = 360 - segCenter;
    const fullRotations = 4 + Math.floor(Math.random() * 3); // 4-6 full spins
    const totalRotation = rotationRef.current + fullRotations * 360 + ((targetBase - (rotationRef.current % 360)) + 360) % 360;

    const startRotation = rotationRef.current;
    const distance = totalRotation - startRotation;
    const totalFrames = 200; // ~3.3s at 60fps
    let frame = 0;

    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      // Ease-out cubic — fast start, slow landing
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startRotation + distance * eased;
      rotationRef.current = current;
      setRotation(current);

      if (frame >= totalFrames) {
        rotationRef.current = totalRotation;
        setRotation(totalRotation);
        // Brief pause then reveal
        setTimeout(() => {
          useGameStore.getState().playSFX('smash');
          setPhase('reveal');
        }, 600);
        return;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [phase, count, players, segmentAngle]);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0 bg-black/88 backdrop-blur-sm" onClick={phase === 'idle' ? onClose : undefined} />

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
        {/* Title */}
        <motion.h1
          className="text-4xl sm:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 mb-2 -skew-x-6"
          style={{ filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.6))' }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
        >
          🍺 ATJE TREKKEN
        </motion.h1>
        <motion.p
          className="text-sm font-bold uppercase tracking-widest text-gray-300 drop-shadow-md mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          The wheel decides who drinks
        </motion.p>

        {/* Close button */}
        {phase === 'idle' && (
          <motion.button
            onClick={onClose}
            className="absolute top-0 right-0 text-gray-400 hover:text-white transition-colors z-20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-2xl">✕</span>
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          {(phase === 'idle' || phase === 'spinning') && (
            <motion.div
              key="wheel"
              className="flex flex-col items-center"
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
            >
              {/* Wheel container */}
              <div className="relative mb-8" style={{ width: size, height: size }}>
                {/* Outer glow ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow: '0 0 40px rgba(245,158,11,0.3), 0 0 80px rgba(245,158,11,0.15)',
                    border: '3px solid rgba(245,158,11,0.4)',
                    borderRadius: '50%',
                  }}
                />

                {/* SVG Wheel */}
                <svg
                  width={size}
                  height={size}
                  viewBox={`0 0 ${size} ${size}`}
                  style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}
                >
                  <defs>
                    {/* Circular clip paths for portraits */}
                    {players.map((_, i) => {
                      const midAngle = i * segmentAngle + segmentAngle / 2;
                      const pos = polarToCartesian(cx, cy, radius * 0.62, midAngle);
                      return (
                        <clipPath key={`clip-${i}`} id={`portrait-clip-${i}`}>
                          <circle cx={pos.x} cy={pos.y} r={20} />
                        </clipPath>
                      );
                    })}
                  </defs>

                  {players.map((player, i) => {
                    const startAngle = i * segmentAngle;
                    const endAngle = (i + 1) * segmentAngle;
                    const midAngle = startAngle + segmentAngle / 2;
                    const color = FIGHTER_COLORS[player.chosenCharacter] || '#666';
                    const charData = characters.find((c) => c.id === player.chosenCharacter);

                    // Position for portrait/emoji — slightly outward from center
                    const labelRadius = radius * 0.62;
                    const labelPos = polarToCartesian(cx, cy, labelRadius, midAngle);

                    // Position for name — near the edge
                    const nameRadius = radius * 0.88;
                    const namePos = polarToCartesian(cx, cy, nameRadius, midAngle);

                    return (
                      <g key={i}>
                        {/* Colored segment */}
                        <path
                          d={describeArc(cx, cy, radius, startAngle, endAngle)}
                          fill={darken(color, 0.35)}
                          stroke={color}
                          strokeWidth="1.5"
                        />

                        {/* Lighter inner accent */}
                        <path
                          d={describeArc(cx, cy, radius * 0.95, startAngle + 0.5, endAngle - 0.5)}
                          fill={darken(color, 0.5)}
                          stroke="none"
                        />

                        {/* Portrait image or emoji */}
                        {charData?.portrait ? (
                          <image
                            href={`/assets/characters/${charData.portrait}`}
                            x={labelPos.x - 22}
                            y={labelPos.y - 22}
                            width="44"
                            height="44"
                            clipPath={`url(#portrait-clip-${i})`}
                            preserveAspectRatio="xMidYMid slice"
                          />
                        ) : (
                          <text
                            x={labelPos.x}
                            y={labelPos.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="24"
                          >
                            {FIGHTER_EMOJI[player.chosenCharacter] || '❓'}
                          </text>
                        )}

                        {/* Player name — rotated along the segment */}
                        <text
                          x={namePos.x}
                          y={namePos.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="white"
                          fontSize="9"
                          fontWeight="bold"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                          transform={`rotate(${midAngle}, ${namePos.x}, ${namePos.y})`}
                        >
                          {player.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Center hub */}
                  <circle cx={cx} cy={cy} r={28} fill="#1a1a2e" stroke="rgba(245,158,11,0.6)" strokeWidth="2" />
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="22">
                    🍺
                  </text>
                </svg>

                {/* Needle / pointer at top — fixed, doesn't rotate */}
                <div
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ top: -6, zIndex: 10 }}
                >
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '14px solid transparent',
                      borderRight: '14px solid transparent',
                      borderTop: '28px solid #f59e0b',
                      filter: 'drop-shadow(0 2px 6px rgba(245,158,11,0.6))',
                    }}
                  />
                </div>
              </div>

              {/* Spin button */}
              {phase === 'idle' && (
                <motion.button
                  onClick={handleSpin}
                  className="group"
                  data-sound="epic"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className="px-10 py-4 border-2 border-amber-400/50 bg-gradient-to-r from-amber-600/30 to-orange-600/30 rounded-sm group-hover:border-amber-300 group-hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] transition-all duration-200"
                    style={{ transform: 'skewX(-10deg)' }}
                  >
                    <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-xl text-amber-200">
                      🎰 SPIN THE WHEEL
                    </div>
                  </div>
                </motion.button>
              )}

              {phase === 'spinning' && (
                <div className="text-amber-400 text-sm uppercase tracking-widest font-bold animate-pulse">
                  Spinning...
                </div>
              )}
            </motion.div>
          )}

          {phase === 'reveal' && winner && (
            <motion.div
              key="reveal"
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Winner portrait */}
              <motion.div
                className="mb-6 relative"
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
              >
                {(() => {
                  const cd = characters.find((c) => c.id === winner.chosenCharacter);
                  const color = FIGHTER_COLORS[winner.chosenCharacter] || '#f59e0b';
                  if (cd?.portrait) {
                    return (
                      <img
                        src={`/assets/characters/${cd.portrait}`}
                        alt={winner.name}
                        className="w-40 h-40 sm:w-52 sm:h-52 rounded-2xl object-cover border-4 shadow-lg"
                        style={{ borderColor: color, boxShadow: `0 0 50px ${color}80` }}
                      />
                    );
                  }
                  return (
                    <div
                      className="w-40 h-40 sm:w-52 sm:h-52 rounded-2xl border-4 flex items-center justify-center text-7xl"
                      style={{ borderColor: color, backgroundColor: `${color}15`, boxShadow: `0 0 50px ${color}80` }}
                    >
                      {FIGHTER_EMOJI[winner.chosenCharacter] || '🍺'}
                    </div>
                  );
                })()}
                <motion.div
                  className="absolute -top-3 -right-3 text-4xl"
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🍺
                </motion.div>
              </motion.div>

              {/* Winner text */}
              <motion.h2
                className="text-4xl sm:text-5xl font-black mb-2"
                style={{
                  color: FIGHTER_COLORS[winner.chosenCharacter] || '#f59e0b',
                  filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.5))',
                }}
                initial={{ x: '-50vw' }}
                animate={{ x: 0 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.25, delay: 0.2 }}
              >
                {winner.name}
              </motion.h2>

              <motion.p
                className="text-2xl sm:text-3xl font-black text-amber-300 uppercase tracking-wide mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{ filter: 'drop-shadow(0 3px 0 rgba(0,0,0,0.5))' }}
              >
                🍺 MOET EEN ATJE TREKKEN! 🍺
              </motion.p>

              {/* Close button */}
              <motion.button
                onClick={() => { setPhase('idle'); setWinner(null); onClose(); }}
                className="group"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="px-8 py-3 border-2 border-gray-600 bg-gray-800/80 rounded-sm group-hover:border-gray-400 group-hover:bg-gray-700/80 transition-all duration-200"
                  style={{ transform: 'skewX(-10deg)' }}
                >
                  <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-base text-gray-300">
                    Back to Tournament →
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
