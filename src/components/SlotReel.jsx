import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import CharacterThumb from './CharacterThumb';
import useGameStore from '../store/useGameStore';

/**
 * Casino-style slot machine reel — characters scroll vertically.
 * Shows characters as portrait cards (same style as RosterView FighterCard).
 * Center card is sharp, top/bottom are faded for depth effect.
 *
 * No frame/border around the reel itself — clean, floating look.
 */
export default function SlotReel({ candidates, spinning, winner, accentColor = 'yellow', itemHeight = 140 }) {
  const [offset, setOffset] = useState(0);
  const speedRef = useRef(0);
  const rafRef = useRef(null);
  const totalHeight = candidates.length * itemHeight;
  const characters = useGameStore((s) => s.characters);

  const glowColor = accentColor === 'purple' ? 'rgba(168,85,247,0.5)' : 'rgba(250,204,21,0.5)';

  // Build extended array for seamless looping
  const extendedCandidates = [...candidates, ...candidates, ...candidates];

  const animate = useCallback(() => {
    setOffset((prev) => (prev + speedRef.current) % totalHeight);
    rafRef.current = requestAnimationFrame(animate);
  }, [totalHeight]);

  // Spinning: constant speed
  useEffect(() => {
    if (spinning && !winner) {
      speedRef.current = 14;
      rafRef.current = requestAnimationFrame(animate);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }
  }, [spinning, winner, animate]);

  // Deceleration when winner is set
  useEffect(() => {
    if (!winner || !spinning) return;
    const winnerIdx = candidates.findIndex((p) => p.id === winner.id);
    const targetOffset = winnerIdx * itemHeight;

    let currentSpeed = speedRef.current;
    const decelerate = () => {
      currentSpeed *= 0.955;
      if (currentSpeed < 0.8) {
        cancelAnimationFrame(rafRef.current);
        setOffset(targetOffset);
        return;
      }
      speedRef.current = currentSpeed;
      setOffset((prev) => (prev + currentSpeed) % totalHeight);
      rafRef.current = requestAnimationFrame(decelerate);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const timeout = setTimeout(() => {
      rafRef.current = requestAnimationFrame(decelerate);
    }, 150);
    return () => { clearTimeout(timeout); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [winner, spinning, candidates, itemHeight, totalHeight]);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const displayOffset = spinning || winner ? offset : 0;
  const gap = 12;

  return (
    <div className="relative flex flex-col items-center">
      {/* Reel viewport — no border, clean */}
      <div
        className="relative overflow-hidden"
        style={{
          width: `${itemHeight}px`,
          height: `${itemHeight * 3 + gap * 2}px`,
        }}
      >
        {/* Scrolling strip */}
        <div
          className="absolute left-0 right-0"
          style={{
            transform: `translateY(${-displayOffset + itemHeight + gap}px)`,
          }}
        >
          {extendedCandidates.map((player, i) => {
            const charData = characters.find((c) => c.id === player.chosenCharacter);
            const distFromCenter = Math.abs((i * itemHeight) - displayOffset);
            const distWrapped = Math.min(distFromCenter, Math.abs(distFromCenter - totalHeight));
            const isCenter = distWrapped < itemHeight * 0.6;
            const isFar = distWrapped > itemHeight * 1.4;

            return (
              <div
                key={`${player.id}-${i}`}
                className="flex items-center justify-center"
                style={{
                  height: `${itemHeight}px`,
                  marginBottom: `${gap}px`,
                  opacity: isCenter ? 1 : isFar ? 0.15 : 0.35,
                  transform: isCenter ? 'scale(1)' : 'scale(0.85)',
                  filter: isCenter ? 'none' : 'blur(2px)',
                  transition: 'opacity 0.1s, transform 0.1s, filter 0.1s',
                }}
              >
                {/* Card — same style as RosterView FighterCard */}
                <div
                  className={`relative rounded-xl overflow-hidden border-2 ${
                    isCenter
                      ? accentColor === 'purple' ? 'border-purple-400/80' : 'border-yellow-400/80'
                      : 'border-gray-700/40'
                  }`}
                  style={{
                    width: `${itemHeight}px`,
                    height: `${itemHeight}px`,
                    boxShadow: isCenter ? `0 0 30px ${glowColor}` : 'none',
                  }}
                >
                  {/* Portrait fills entire card */}
                  {charData?.portrait ? (
                    <img
                      src={`/assets/characters/${charData.portrait}`}
                      alt={player.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                      <span className="text-5xl">{
                        ({ ruggero:'🔥', koen:'⚡', matthew:'🌊', martin:'🗡️', robin:'🏹', frederik:'🛡️', vincent:'💎', devan:'🌀', gereon:'⚔️', noah:'🌩️', alexander:'👑' })[player.chosenCharacter] || '❓'
                      }</span>
                    </div>
                  )}

                  {/* Name overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-1.5 pt-5 pb-1.5">
                    <span className="block text-center text-xs sm:text-sm font-bold tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                      {player.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top fade for 3D depth */}
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
