import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import BackButton from './BackButton';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

const FIGHTER_COLORS = {
  ruggero: '#ff4444', koen: '#44aaff', matthew: '#44ff88', martin: '#ff8844', robin: '#aa44ff',
  frederik: '#ffdd44', vincent: '#ff44aa', devan: '#44ffdd', gereon: '#8888ff', noah: '#ff6666', alexander: '#ffd700',
};

const ROUND_HEADERS = { Prelims: '🥊 PRELIMS', QF: '⚔️ QF', SF: '🔥 SF', Final: '👑 FINAL' };

// --- Compact player row inside a match card ---
function PlayerSlot({ player, isWinner, isVip, isWildcard }) {
  if (!player) return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/30 border border-dashed border-gray-700/30">
      <span className="text-xs text-gray-600">TBD</span>
    </div>
  );
  const charId = player.chosenCharacter;
  const emoji = FIGHTER_EMOJI[charId] || '❓';

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold transition-all ${
      isWinner ? 'bg-green-500/15 text-green-300' : player.isEliminated ? 'bg-red-500/5 text-red-400/50 line-through' : 'bg-white/5 text-white'
    }`}>
      <span className="text-sm">{emoji}</span>
      <span className="truncate">{player.name}</span>
      {isVip && <span className="text-[9px] text-yellow-400">👑</span>}
      {isWildcard && <span className="text-[9px] text-purple-400">🃏</span>}
      {isWinner && <span className="ml-auto text-green-400 text-[9px]">✓</span>}
    </div>
  );
}

function MatchCard({ match, players, vipPlayerIds, selectedWildcards, isActive }) {
  const p1 = match.p1Id ? players.find((p) => p.id === match.p1Id) : null;
  const p2 = match.p2Id ? players.find((p) => p.id === match.p2Id) : null;

  return (
    <div className={`rounded-lg border p-1.5 space-y-0.5 min-w-0 transition-all ${
      isActive && !match.completed
        ? 'border-yellow-500/40 bg-yellow-500/5 shadow-[0_0_12px_rgba(250,204,21,0.1)]'
        : match.completed
        ? 'border-green-500/20 bg-gray-900/40'
        : 'border-gray-700/30 bg-gray-900/40'
    }`}>
      <PlayerSlot player={p1} isWinner={match.completed && match.winnerId === p1?.id}
        isVip={vipPlayerIds?.includes(p1?.id)} isWildcard={selectedWildcards?.includes(p1?.id)} />
      <div className="text-center text-[8px] text-gray-600 font-bold">VS</div>
      <PlayerSlot player={p2} isWinner={match.completed && match.winnerId === p2?.id}
        isVip={vipPlayerIds?.includes(p2?.id)} isWildcard={selectedWildcards?.includes(p2?.id)} />
    </div>
  );
}

function VipBadge({ player }) {
  if (!player) return null;
  const emoji = FIGHTER_EMOJI[player.chosenCharacter] || '❓';
  return (
    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-1.5 text-center">
      <div className="text-lg">{emoji}</div>
      <div className="text-[10px] font-bold text-yellow-300 truncate">{player.name}</div>
      <div className="text-[8px] text-yellow-500/50 font-mono">VIP BYE</div>
    </div>
  );
}

// Connective lines between rounds
function BracketConnector({ matchCount, nextMatchCount }) {
  if (!nextMatchCount || nextMatchCount === 0) return null;

  return (
    <div className="flex flex-col justify-around w-6 sm:w-8 shrink-0 relative">
      {Array.from({ length: nextMatchCount }, (_, i) => {
        // Each connector groups 2 source matches into 1 target
        const topPct = ((i * 2) + 0.5) / matchCount * 100;
        const botPct = ((i * 2 + 1) + 0.5) / matchCount * 100;
        const midPct = (topPct + botPct) / 2;

        return (
          <div key={i} className="absolute left-0 right-0" style={{ top: `${topPct}%`, height: `${botPct - topPct}%` }}>
            {/* Vertical line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-600/40" />
            {/* Top horizontal */}
            <div className="absolute left-0 top-0 h-px w-1/2 bg-gray-600/40" />
            {/* Bottom horizontal */}
            <div className="absolute left-0 bottom-0 h-px w-1/2 bg-gray-600/40" />
            {/* Mid horizontal to next */}
            <div className="absolute right-0 h-px w-1/2 bg-gray-600/40" style={{ top: '50%' }} />
          </div>
        );
      })}
    </div>
  );
}

// =============================================
// WILDCARD ROULETTE
// =============================================
function WildcardRoulette({ candidates, players, onComplete }) {
  const [phase, setPhase] = useState('intro');
  const [displayIdx, setDisplayIdx] = useState(0);
  const [revealed, setRevealed] = useState([]);

  const candidatePlayers = candidates.map((id) => players.find((p) => p.id === id)).filter(Boolean);

  useEffect(() => {
    if (phase !== 'spinning') return;
    const interval = setInterval(() => {
      setDisplayIdx((i) => (i + 1) % candidatePlayers.length);
    }, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      const shuffled = [...candidatePlayers].sort(() => Math.random() - 0.5);
      setRevealed([shuffled[0], shuffled[1]]);
      setPhase('reveal');
    }, 3000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [phase, candidatePlayers.length]);

  const currentDisplay = candidatePlayers[displayIdx];

  return (
    <motion.div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      <div className="relative z-10 text-center max-w-lg">
        <motion.h1
          className="text-5xl sm:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-4 -skew-x-6"
          style={{ filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.6))' }}
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}>
          WILDCARD DRAW
        </motion.h1>

        <motion.p className="text-gray-400 text-sm mb-8" initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {candidates.length} fighters have fallen. Only <span className="text-purple-300 font-bold">
          {useGameStore.getState().bracketConfig?.wildcards || 2}</span> will be resurrected.
        </motion.p>

        {phase === 'spinning' && currentDisplay && (
          <motion.div className="mb-8">
            <motion.div key={displayIdx} className="text-6xl mb-2" initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.05 }}>
              {FIGHTER_EMOJI[currentDisplay.chosenCharacter] || '❓'}
            </motion.div>
            <div className="text-xl font-black text-white">{currentDisplay.name}</div>
          </motion.div>
        )}

        <AnimatePresence>
          {phase === 'reveal' && (
            <motion.div className="mb-8 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <div className="text-purple-400 text-xs uppercase tracking-widest font-bold mb-3">🃏 The Wildcards Are...</div>
              <div className="flex justify-center gap-4">
                {revealed.map((p, i) => (
                  <motion.div key={p.id}
                    className="bg-purple-500/10 border-2 border-purple-400/50 rounded-xl p-4 text-center min-w-[120px]"
                    initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.3, delay: 0.5 + i * 0.4 }}
                    style={{ boxShadow: '0 0 25px rgba(168,85,247,0.2)' }}>
                    <div className="text-4xl mb-1">{FIGHTER_EMOJI[p.chosenCharacter] || '❓'}</div>
                    <div className="text-white font-black">{p.name}</div>
                    <div className="text-purple-300 text-[10px] font-bold mt-1">RESURRECTED 🃏</div>
                  </motion.div>
                ))}
              </div>
              <motion.button onClick={onComplete}
                className="mt-6 px-8 py-3 rounded-xl font-black text-base uppercase tracking-wider
                  bg-gradient-to-r from-purple-600 to-pink-600 text-white border-2 border-purple-400/50"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(168,85,247,0.4)' }}
                whileTap={{ scale: 0.95 }}>
                ⚔️ TO THE QUARTER-FINALS
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'intro' && (
          <>
            <motion.button onClick={() => setPhase('spinning')}
              className="px-10 py-4 rounded-xl font-black text-xl uppercase tracking-wider
                bg-gradient-to-r from-purple-600 to-pink-600 text-white border-2 border-purple-400/50"
              animate={{
                boxShadow: ['0 0 20px rgba(168,85,247,0.2)', '0 0 50px rgba(168,85,247,0.5)', '0 0 20px rgba(168,85,247,0.2)'],
                scale: [1, 1.03, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              🎰 SPIN ROULETTE
            </motion.button>
            <motion.div className="mt-6 flex flex-wrap justify-center gap-2"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              {candidatePlayers.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/50 border border-gray-700/30">
                  <span className="text-sm">{FIGHTER_EMOJI[p.chosenCharacter] || '❓'}</span>
                  <span className="text-xs text-gray-300 font-bold">{p.name}</span>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// =============================================
// MAIN VIEW
// =============================================
export default function TournamentBracketView() {
  const {
    players, knockoutRounds, pendingMatches, bracketStage,
    vipPlayerIds, wildcardCandidates, selectedWildcards,
    isTournamentOver, generateTournament, advanceTournament, executeWildcards,
  } = useGameStore();

  // Generate tournament on first mount
  useEffect(() => {
    if (knockoutRounds.length === 0 && !isTournamentOver) {
      generateTournament();
    }
  }, []);

  // Auto-advance: check the ACTIVE round, not the last one
  useEffect(() => {
    if (bracketStage === 'wildcards') return;
    const stageToRound = { prelims: 'Prelims', qf: 'QF', sf: 'SF', final: 'Final' };
    const activeRound = knockoutRounds.find((r) => r.round === stageToRound[bracketStage]);
    if (activeRound && pendingMatches.length === 0 && !isTournamentOver) {
      const allDone = activeRound.matches.every((m) => m.completed);
      if (allDone) advanceTournament();
    }
  }, [pendingMatches.length, knockoutRounds, bracketStage, isTournamentOver]);

  const vipPlayers = vipPlayerIds.map((id) => players.find((p) => p.id === id)).filter(Boolean);
  const nextMatch = pendingMatches[0];
  const nextP1 = nextMatch ? players.find((p) => p.id === nextMatch.p1Id) : null;
  const nextP2 = nextMatch ? players.find((p) => p.id === nextMatch.p2Id) : null;

  // Active round name for highlighting
  const stageToRound = { prelims: 'Prelims', qf: 'QF', sf: 'SF', final: 'Final' };
  const activeRoundName = stageToRound[bracketStage];

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* BG */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }} />
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)' }} />

      {/* Header */}
      <div className="relative z-10 px-3 pt-3 pb-1 flex items-center justify-between">
        <BackButton />
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 uppercase tracking-wider">
            {ROUND_HEADERS[activeRoundName] || 'TOURNAMENT'}
          </h2>
          <p className="text-gray-600 text-[9px] font-mono uppercase tracking-widest">
            Bachelor&apos;s Knockout
          </p>
        </div>
        <div className="w-16" />
      </div>

      {/* Wildcard overlay */}
      {bracketStage === 'wildcards' && (
        <WildcardRoulette candidates={wildcardCandidates} players={players} onComplete={executeWildcards} />
      )}

      {/* Bracket grid — single screen, no scroll */}
      {bracketStage !== 'wildcards' && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-2 sm:px-4 pb-24 overflow-hidden">
          <div className="flex items-center h-full max-h-[70vh] w-full max-w-5xl">
            {knockoutRounds.map((round, roundIdx) => {
              const nextRound = knockoutRounds[roundIdx + 1];
              const isActiveRound = round.round === activeRoundName;

              return (
                <div key={roundIdx} className="contents">
                  {/* Round column */}
                  <div className="flex flex-col flex-1 min-w-0 max-w-[220px]">
                    {/* Round label */}
                    <div className={`text-center mb-2 ${isActiveRound ? 'text-yellow-400' : 'text-gray-500'}`}>
                      <div className="text-[10px] font-black uppercase tracking-wider">
                        {ROUND_HEADERS[round.round] || round.round}
                      </div>
                      <div className="text-[8px] font-mono text-gray-600">
                        {round.matches.filter((m) => m.completed).length}/{round.matches.length}
                      </div>
                    </div>

                    {/* VIP badges in prelims column */}
                    {round.round === 'Prelims' && vipPlayers.length > 0 && (
                      <div className="flex gap-1 justify-center mb-2">
                        {vipPlayers.map((vp) => <VipBadge key={vp.id} player={vp} />)}
                      </div>
                    )}

                    {/* Matches — spread vertically */}
                    <div className="flex flex-col justify-around flex-1 gap-1">
                      {round.matches.map((match, mIdx) => (
                        <MatchCard
                          key={mIdx}
                          match={match}
                          players={players}
                          vipPlayerIds={vipPlayerIds}
                          selectedWildcards={selectedWildcards}
                          isActive={isActiveRound}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Connector lines to next round */}
                  {nextRound && round.matches.length > 1 && (
                    <BracketConnector matchCount={round.matches.length} nextMatchCount={nextRound.matches.length} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      {bracketStage !== 'wildcards' && nextMatch && (
        <motion.div className="fixed bottom-0 left-0 right-0 z-30"
          initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}>
          <div className="bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-4 px-4">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-base">{FIGHTER_EMOJI[nextP1?.chosenCharacter] || '❓'}</span>
                <span className="text-xs font-bold text-white">{nextP1?.name}</span>
                <span className="text-yellow-500 font-black text-[10px]">VS</span>
                <span className="text-xs font-bold text-white">{nextP2?.name}</span>
                <span className="text-base">{FIGHTER_EMOJI[nextP2?.chosenCharacter] || '❓'}</span>
              </div>
              <motion.button
                onClick={() => useGameStore.setState({ gamePhase: 'map_select' })}
                className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider
                  bg-gradient-to-r from-yellow-500 to-orange-500 text-black
                  border-2 border-yellow-400/50"
                animate={{
                  boxShadow: ['0 0 10px rgba(250,204,21,0.2)', '0 0 30px rgba(250,204,21,0.4)', '0 0 10px rgba(250,204,21,0.2)'],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                ⚔️ PROCEED TO ARENA
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
