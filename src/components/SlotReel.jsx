import { useState, useEffect, useRef, useCallback } from 'react';
import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

/**
 * Casino slot reel — characters scroll vertically through a transparent viewport.
 * No visible container/background. A fixed highlight frame stays centered while cards scroll through it.
 */
export default function SlotReel({ candidates, spinning, winner, accentColor = 'yellow', size = 180 }) {
  const [offset, setOffset] = useState(0);
  const speedRef = useRef(0);
  const rafRef = useRef(null);
  const characters = useGameStore((s) => s.characters);

  const itemHeight = size;
  const gap = 14;
  const step = itemHeight + gap;
  const totalHeight = candidates.length * step;

  const glowColor = accentColor === 'purple' ? 'rgba(168,85,247,0.5)' : 'rgba(250,204,21,0.5)';
  const borderClass = accentColor === 'purple' ? 'border-purple-400/80' : 'border-yellow-400/80';

  // 3x repeat for seamless loop
  const extended = [...candidates, ...candidates, ...candidates];

  const animate = useCallback(() => {
    setOffset((prev) => (prev + speedRef.current) % totalHeight);
    rafRef.current = requestAnimationFrame(animate);
  }, [totalHeight]);

  // Constant speed while spinning
  useEffect(() => {
    if (spinning && !winner) {
      speedRef.current = 16;
      rafRef.current = requestAnimationFrame(animate);
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }
  }, [spinning, winner, animate]);

  // Decelerate to winner
  useEffect(() => {
    if (!winner || !spinning) return;
    const winnerIdx = candidates.findIndex((p) => p.id === winner.id);
    const targetOffset = winnerIdx * step;

    let currentSpeed = speedRef.current;
    const decelerate = () => {
      currentSpeed *= 0.955;
      if (currentSpeed < 0.6) {
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
  }, [winner, spinning, candidates, step, totalHeight]);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const displayOffset = spinning || winner ? offset : 0;
  // Viewport shows 3 items
  const viewportHeight = step * 3;

  return (
    <div className="relative flex flex-col items-center" style={{ width: `${size}px`, height: `${viewportHeight}px` }}>
      {/* Scrolling cards — no background, fully transparent */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute left-0 right-0"
          style={{ transform: `translateY(${-displayOffset + step}px)` }}
        >
          {extended.map((player, i) => {
            const charData = characters.find((c) => c.id === player.chosenCharacter);
            const itemPos = i * step;
            const distFromCenter = Math.abs(itemPos - displayOffset);
            const distWrapped = Math.min(distFromCenter, Math.abs(distFromCenter - totalHeight));
            const isCenter = distWrapped < step * 0.5;
            const isFar = distWrapped > step * 1.5;

            return (
              <div
                key={`${player.id}-${i}`}
                className="flex items-center justify-center"
                style={{
                  height: `${itemHeight}px`,
                  marginBottom: `${gap}px`,
                  opacity: isCenter ? 1 : isFar ? 0.1 : 0.3,
                  transform: `scale(${isCenter ? 1 : 0.82})`,
                  filter: isCenter ? 'none' : `blur(${isFar ? 4 : 2}px)`,
                  transition: spinning && !winner ? 'none' : 'opacity 0.2s, transform 0.2s, filter 0.2s',
                }}
              >
                {/* Card — no border, portrait fills card */}
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
                  {/* Name overlay */}
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

      {/* Top + bottom fade — blends into background, no hard edges */}
      <div className="absolute top-0 left-0 right-0 h-[35%] bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none z-10" />

      {/* FIXED highlight frame — does NOT move with the reel */}
      <div
        className={`absolute z-20 pointer-events-none border-2 ${borderClass} rounded-xl`}
        style={{
          top: `${step}px`,
          left: '-4px',
          right: '-4px',
          height: `${itemHeight}px`,
          boxShadow: `0 0 35px ${glowColor}, 0 0 15px ${glowColor}`,
        }}
      />
    </div>
  );
}
