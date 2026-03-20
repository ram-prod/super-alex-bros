import { useState, useEffect, useRef, useCallback } from 'react';
import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

/**
 * Casino slot reel. Cards scroll vertically, center card highlighted by a fixed frame.
 * No visible container — cards fade to full transparency outside center.
 * Deceleration lands smoothly on winner without sudden jumps.
 */
export default function SlotReel({ candidates, spinning, winner, accentColor = 'yellow', size = 180, onLanded }) {
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const speedRef = useRef(0);
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

  // Keep offsetRef in sync
  useEffect(() => { offsetRef.current = offset; }, [offset]);

  const tick = useCallback(() => {
    const newOffset = (offsetRef.current + speedRef.current) % totalHeight;
    offsetRef.current = newOffset;
    setOffset(newOffset);
    rafRef.current = requestAnimationFrame(tick);
  }, [totalHeight]);

  // Start spinning at constant speed
  useEffect(() => {
    if (spinning && !winner) {
      landedRef.current = false;
      speedRef.current = 18;
      rafRef.current = requestAnimationFrame(tick);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }
  }, [spinning, winner, tick]);

  // Decelerate and land exactly on winner
  useEffect(() => {
    if (!winner || !spinning || landedRef.current) return;

    const winnerIdx = candidates.findIndex((p) => p.id === winner.id);
    const targetOffset = winnerIdx * step;

    // Calculate how far we need to travel: at least 2 full rotations + distance to target
    const currentOff = offsetRef.current;
    let distance = targetOffset - currentOff;
    // Ensure we go forward at least 2 full cycles for dramatic effect
    while (distance < totalHeight * 2) distance += totalHeight;

    // Ease-out deceleration over the calculated distance
    const totalFrames = 120; // ~2 seconds at 60fps
    let frame = 0;

    const decelerate = () => {
      frame++;
      const progress = frame / totalFrames;
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const newOffset = (currentOff + distance * eased) % totalHeight;
      offsetRef.current = newOffset;
      setOffset(newOffset);

      if (frame >= totalFrames) {
        // Snap exactly to target
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
      {/* Scrolling cards */}
      <div className="absolute inset-0 overflow-hidden" style={{ background: 'transparent' }}>
        <div
          className="absolute left-1 right-1"
          style={{ transform: `translateY(${-displayOffset + step}px)` }}
        >
          {extended.map((player, i) => {
            const charData = characters.find((c) => c.id === player.chosenCharacter);
            const itemPos = i * step;
            const distFromCenter = Math.abs(itemPos - displayOffset);
            const distWrapped = Math.min(distFromCenter, Math.abs(distFromCenter - totalHeight));
            const isCenter = distWrapped < step * 0.5;
            const isNear = distWrapped < step * 1.2;

            // Cards outside viewport are fully invisible — prevents dark column
            if (!isCenter && !isNear) {
              return (
                <div key={`${player.id}-${i}`} style={{ height: `${itemHeight}px`, marginBottom: `${gap}px` }} />
              );
            }

            return (
              <div
                key={`${player.id}-${i}`}
                className="flex items-center justify-center"
                style={{
                  height: `${itemHeight}px`,
                  marginBottom: `${gap}px`,
                  opacity: isCenter ? 1 : 0.25,
                  transform: `scale(${isCenter ? 1 : 0.8})`,
                  filter: isCenter ? 'none' : 'blur(3px)',
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

      {/* Soft edge fades — match the page overlay (bg-black/85) */}
      <div className="absolute top-0 left-0 right-0 h-[38%] pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-[38%] pointer-events-none z-10"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%)' }} />

      {/* FIXED highlight frame */}
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
