import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import CharacterThumb from './CharacterThumb';

/**
 * Casino-style slot machine reel that scrolls vertically through characters.
 * Shows 3 visible slots (top/center/bottom) with the center highlighted.
 *
 * @param {Array} candidates - array of player objects
 * @param {boolean} spinning - whether the reel is currently spinning
 * @param {object|null} winner - the selected winner (stops reel on this player)
 * @param {string} accentColor - tailwind color for the highlight frame (yellow/purple)
 * @param {number} itemHeight - height of each slot item in px
 */
export default function SlotReel({ candidates, spinning, winner, accentColor = 'yellow', itemHeight = 100 }) {
  const [offset, setOffset] = useState(0);
  const speedRef = useRef(0);
  const rafRef = useRef(null);
  const totalHeight = candidates.length * itemHeight;

  const colors = {
    yellow: { border: 'border-yellow-400/80', glow: 'rgba(250,204,21,0.4)', bg: 'from-yellow-500/10 to-yellow-500/5' },
    purple: { border: 'border-purple-400/80', glow: 'rgba(168,85,247,0.4)', bg: 'from-purple-500/10 to-purple-500/5' },
  };
  const c = colors[accentColor] || colors.yellow;

  // Build extended array (3x repeat for seamless looping)
  const extendedCandidates = [...candidates, ...candidates, ...candidates];

  const animate = useCallback(() => {
    setOffset((prev) => {
      const next = prev + speedRef.current;
      return next % totalHeight;
    });
    rafRef.current = requestAnimationFrame(animate);
  }, [totalHeight]);

  // Spinning phase: accelerate then maintain speed
  useEffect(() => {
    if (spinning && !winner) {
      speedRef.current = 12; // pixels per frame (~720px/s at 60fps)
      rafRef.current = requestAnimationFrame(animate);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }
  }, [spinning, winner, animate]);

  // Deceleration when winner is set
  useEffect(() => {
    if (!winner || !spinning) return;

    const winnerIdx = candidates.findIndex((p) => p.id === winner.id);
    const targetOffset = winnerIdx * itemHeight;

    // Decelerate over ~1.5 seconds
    let currentSpeed = speedRef.current;
    const decelerate = () => {
      currentSpeed *= 0.96; // smooth deceleration
      if (currentSpeed < 1) {
        // Snap to winner
        cancelAnimationFrame(rafRef.current);
        setOffset(targetOffset);
        return;
      }
      speedRef.current = currentSpeed;
      setOffset((prev) => {
        const next = prev + currentSpeed;
        return next % totalHeight;
      });
      rafRef.current = requestAnimationFrame(decelerate);
    };

    // Cancel the constant speed animation, start deceleration
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // Add a brief delay so the speed feels right
    const timeout = setTimeout(() => {
      rafRef.current = requestAnimationFrame(decelerate);
    }, 200);

    return () => { clearTimeout(timeout); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [winner, spinning, candidates, itemHeight, totalHeight]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Calculate which items are visible (-1, 0, +1 around center)
  const centerIdx = Math.round(offset / itemHeight) % candidates.length;

  // For static display (intro), show first candidate centered
  const displayOffset = spinning || winner ? offset : 0;

  return (
    <div className="relative flex flex-col items-center">
      {/* Slot machine frame */}
      <div
        className="relative overflow-hidden rounded-xl border-2 border-gray-600/50 bg-black/60 backdrop-blur-sm"
        style={{
          width: '260px',
          height: `${itemHeight * 3}px`, // 3 visible slots
        }}
      >
        {/* Scrolling strip */}
        <div
          className="absolute left-0 right-0"
          style={{
            transform: `translateY(${-displayOffset + itemHeight}px)`, // +itemHeight to center the active item
          }}
        >
          {extendedCandidates.map((player, i) => {
            const actualIdx = i % candidates.length;
            const isCenter = spinning || winner
              ? Math.abs((i * itemHeight) - displayOffset) < itemHeight * 0.5
                || Math.abs((i * itemHeight) - displayOffset - totalHeight) < itemHeight * 0.5
              : i === 0;

            return (
              <div
                key={`${player.id}-${i}`}
                className={`flex items-center justify-center gap-3 transition-opacity duration-100 ${
                  isCenter ? 'opacity-100' : 'opacity-40'
                }`}
                style={{ height: `${itemHeight}px` }}
              >
                <CharacterThumb charId={player.chosenCharacter} size="w-16 h-16" emojiSize="text-5xl" rounded={false} />
                <span className="text-xl sm:text-2xl font-black text-white w-32 text-left truncate">
                  {player.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black/90 to-transparent pointer-events-none z-10" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-10" />

        {/* Center highlight frame */}
        <div
          className={`absolute left-0 right-0 z-20 pointer-events-none border-y-2 ${c.border}`}
          style={{
            top: `${itemHeight}px`,
            height: `${itemHeight}px`,
            boxShadow: `0 0 30px ${c.glow}, inset 0 0 30px ${c.glow}`,
            background: `linear-gradient(to right, transparent, ${c.glow.replace('0.4', '0.05')}, transparent)`,
          }}
        />
      </div>

      {/* Side decorations — slot machine arms */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-20 bg-gradient-to-b from-gray-600 via-gray-400 to-gray-600 rounded-full opacity-40" />
      <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-20 bg-gradient-to-b from-gray-600 via-gray-400 to-gray-600 rounded-full opacity-40" />
    </div>
  );
}
