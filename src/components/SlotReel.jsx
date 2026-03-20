import { useState, useEffect, useRef, useCallback } from 'react';
import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

/**
 * Casino slot reel. No visible container — uses CSS mask-image for seamless fade.
 * Scrolls top-to-bottom. Decelerates smoothly to land on winner.
 */
export default function SlotReel({ candidates, spinning, winner, accentColor = 'yellow', size = 180, onLanded }) {
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const rafRef = useRef(null);
  const landedRef = useRef(false);
  const characters = useGameStore((s) => s.characters);

  const itemHeight = size;
  const gap = 14;
  const step = itemHeight + gap;
  const totalHeight = candidates.length * step;

  const glowColor = accentColor === 'purple' ? 'rgba(168,85,247,0.5)' : 'rgba(250,204,21,0.5)';
  const borderClass = accentColor === 'purple' ? 'border-purple-400/80' : 'border-yellow-400/80';

  const extended = [...candidates, ...candidates, ...candidates];

  useEffect(() => { offsetRef.current = offset; }, [offset]);

  const tick = useCallback(() => {
    // Decrease offset → -displayOffset increases → strip moves down → top-to-bottom scroll
    const newOffset = (offsetRef.current - 18 + totalHeight) % totalHeight;
    offsetRef.current = newOffset;
    setOffset(newOffset);
    rafRef.current = requestAnimationFrame(tick);
  }, [totalHeight]);

  // Start spinning
  useEffect(() => {
    if (spinning && !winner) {
      landedRef.current = false;
      rafRef.current = requestAnimationFrame(tick);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }
  }, [spinning, winner, tick]);

  // Decelerate and land on winner
  useEffect(() => {
    if (!winner || !spinning || landedRef.current) return;

    const winnerIdx = candidates.findIndex((p) => p.id === winner.id);
    const targetOffset = winnerIdx * step;

    const currentOff = offsetRef.current;
    // Distance to travel backwards (decreasing offset) — at least 2 full rotations
    let distance = currentOff - targetOffset;
    while (distance < totalHeight * 2) distance += totalHeight;

    const totalFrames = 120;
    let frame = 0;

    const decelerate = () => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      // Subtract: going backwards through the reel
      const newOffset = (currentOff - distance * eased + totalHeight * 100) % totalHeight;
      offsetRef.current = newOffset;
      setOffset(newOffset);

      if (frame >= totalFrames) {
        offsetRef.current = targetOffset;
        setOffset(targetOffset);
        landedRef.current = true;
        if (onLanded) onLanded();
        return;
      }
      rafRef.current = requestAnimationFrame(decelerate);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(decelerate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [winner, spinning, candidates, step, totalHeight, onLanded]);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const displayOffset = spinning || winner ? offset : 0;
  const viewportHeight = step * 3;

  return (
    <div className="relative flex flex-col items-center" style={{ width: `${size + 8}px`, height: `${viewportHeight}px` }}>
      {/*
        Masked container — CSS mask-image fades ALL edges (top, bottom, AND sides)
        to transparent. No hard clip edges visible against any background.
      */}
      <div
        className="absolute inset-0"
        style={{
          maskImage: `
            linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)
          `,
          WebkitMaskImage: `
            linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)
          `,
          overflow: 'hidden',
        }}
      >
        <div
          className="absolute left-1 right-1"
          style={{ transform: `translateY(${-displayOffset + step}px)` }}
        >
          {extended.map((player, i) => {
            const charData = characters.find((c) => c.id === player.chosenCharacter);

            return (
              <div
                key={`${player.id}-${i}`}
                className="flex items-center justify-center"
                style={{
                  height: `${itemHeight}px`,
                  marginBottom: `${gap}px`,
                }}
              >
                <div className="relative rounded-xl overflow-hidden w-full h-full">
                  {charData?.portrait ? (
                    <img
                      src={`/assets/characters/${charData.portrait}`}
                      alt={player.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl">
                      <span className="text-6xl sm:text-7xl">{FIGHTER_EMOJI[player.chosenCharacter] || '❓'}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2 pt-6 pb-2">
                    <span className="block text-center text-sm sm:text-base font-bold tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                      {player.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FIXED highlight frame — centered, doesn't move */}
      <div
        className={`absolute z-20 pointer-events-none border-2 ${borderClass} rounded-xl`}
        style={{
          top: `${step}px`,
          left: '0',
          right: '0',
          height: `${itemHeight}px`,
          boxShadow: `0 0 35px ${glowColor}, 0 0 15px ${glowColor}`,
        }}
      />
    </div>
  );
}
