import useGameStore from '../store/useGameStore';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

/**
 * Compact character portrait thumbnail. Replaces emoji with portrait image where available.
 * @param {string} charId - character id (e.g. 'matthew')
 * @param {string} size - tailwind size classes (default: 'w-8 h-8')
 * @param {string} emojiSize - tailwind text size for emoji fallback (default: 'text-2xl')
 * @param {boolean} rounded - use rounded-full or rounded-md (default: rounded-full)
 */
export default function CharacterThumb({ charId, size = 'w-8 h-8', emojiSize = 'text-2xl', rounded = true }) {
  const characters = useGameStore((s) => s.characters);
  const charData = characters.find((c) => c.id === charId);

  if (charData?.portrait) {
    return (
      <img
        src={`/assets/characters/${charData.portrait}`}
        alt={charData.name}
        className={`${size} ${rounded ? 'rounded-full' : 'rounded-md'} object-cover border border-white/20 shadow-md`}
      />
    );
  }

  return <span className={emojiSize}>{FIGHTER_EMOJI[charId] || '❓'}</span>;
}
