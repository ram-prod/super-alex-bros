import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import BackButton from './BackButton';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

const ROUND_HEADERS = { Prelims: '🥊 PRELIMS', QF: '⚔️ QUARTER-FINALS', SF: '🔥 SEMI-FINALS', Final: '👑 GRAND FINAL' };

// --- Compact player row ---
function PlayerSlot({ player, placeholder, isWinner, isVip, isWildcard }) {
  if (!player) {
    // Show placeholder label or TBD
    const label = placeholder
      ? placeholder.startsWith('W_') ? `Winner ${placeholder.split('_').slice(1).join(' ')}`
      : placeholder.startsWith('WC_') ? `🃏 Wildcard ${+placeholder.split('_')[1] + 1}`
      : placeholder.startsWith('VIP_') ? '👑 VIP Bye'
      : 'TBD'
      : 'TBD';
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/30 border border-dashed border-gray-700/30">
        <span className="text-[10px] text-gray-500 italic truncate">{label}</span>
      </div>
    );
  }
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
  const p1 = typeof match.p1Id === 'number' ? players.find((p) => p.id === match.p1Id) : null;
  const p2 = typeof match.p2Id === 'number' ? players.find((p) => p.id === match.p2Id) : null;
  const p1Placeholder = typeof match.p1Id === 'string' ? match.p1Id : null;
  const p2Placeholder = typeof match.p2Id === 'string' ? match.p2Id : null;

  return (
    <div className={`rounded-lg border p-1.5 space-y-0.5 min-w-0 transition-all ${
      isActive && !match.completed
        ? 'border-yellow-500/40 bg-yellow-500/5 shadow-[0_0_12px_rgba(250,204,21,0.1)]'
        : match.completed
        ? 'border-green-500/20 bg-gray-900/40'
        : 'border-gray-700/30 bg-gray-900/40'
    }`}>
      <PlayerSlot player={p1} placeholder={p1Placeholder} isWinner={match.completed && match.winnerId === p1?.id}
        isVip={vipPlayerIds?.includes(p1?.id)} isWildcard={selectedWildcards?.includes(p1?.id)} />
      <div className="text-center text-[8px] text-gray-600 font-bold">VS</div>
      <PlayerSlot player={p2} placeholder={p2Placeholder} isWinner={match.completed && match.winnerId === p2?.id}
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
    players, knockoutRounds, pendingMatches, completedMatches, bracketStage,
    vipPlayerIds, wildcardCandidates, selectedWildcards,
    isTournamentOver, generateTournament, advanceTournament, executeWildcards,
  } = useGameStore();

  const hasStarted = completedMatches.length > 0;

  // Generate tournament on first mount
  useEffect(() => {
    if (knockoutRounds.length === 0 && !isTournamentOver) {
      generateTournament();
    }
  }, []);

  // Auto-advance: check the ACTIVE round
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

  const stageToRound = { prelims: 'Prelims', qf: 'QF', sf: 'SF', final: 'Final' };
  const activeRoundName = stageToRound[bracketStage];

  // Handle proceed — Final goes to villa directly
  const handleProceed = () => {
    if (nextMatch?.isFinal) {
      useGameStore.setState({
        selectedMap: 'villa',
        gamePhase: 'vs_screen',
        currentMatch: { player1: nextP1, player2: nextP2, p1Damage: 0, p2Damage: 0, activeQuestion: null, isFinal: true },
        matchWinner: null,
      });
    } else {
      useGameStore.setState({ gamePhase: 'map_select' });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* BG */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')" }} />
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)' }} />

      {/* Header */}
      <div className="relative z-10 px-3 pt-3 pb-1 flex items-center justify-between">
        {!hasStarted ? <BackButton onClick={() => useGameStore.getState().goBack()} /> : <div className="w-16" />}
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 uppercase tracking-wider">
            {ROUND_HEADERS[activeRoundName] || 'TOURNAMENT'}
          </h2>
          <p className="text-gray-600 text-[10px] font-mono uppercase tracking-widest mt-1">
            Bachelor&apos;s Knockout
          </p>
        </div>
        <div className="w-16" />
      </div>

      {/* Wildcard overlay */}
      {bracketStage === 'wildcards' && (
        <WildcardRoulette candidates={wildcardCandidates} players={players} onComplete={executeWildcards} />
      )}

      {/* Bracket grid — single screen, centered */}
      {bracketStage !== 'wildcards' && (
        <div className="relative z-10 flex-1 flex items-center justify-center px-2 sm:px-4 pb-24 overflow-hidden">
          <div className="flex items-center justify-center h-full w-full max-w-6xl mx-auto">
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

                  {/* Arrow separator */}
                  {nextRound && (
                    <div className="flex items-center justify-center px-2 sm:px-4">
                      <motion.span
                        className="text-3xl sm:text-4xl text-yellow-500/40"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ➔
                      </motion.span>
                    </div>
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
                <span className="text-lg">{FIGHTER_EMOJI[nextP1?.chosenCharacter] || '❓'}</span>
                <span className="text-sm font-bold text-white">{nextP1?.name}</span>
                <span className="text-yellow-500 font-black text-xs">VS</span>
                <span className="text-sm font-bold text-white">{nextP2?.name}</span>
                <span className="text-lg">{FIGHTER_EMOJI[nextP2?.chosenCharacter] || '❓'}</span>
              </div>
              <motion.button
                onClick={handleProceed}
                className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider
                  bg-gradient-to-r from-yellow-500 to-orange-500 text-black
                  border-2 border-yellow-400/50"
                animate={{
                  boxShadow: ['0 0 10px rgba(250,204,21,0.2)', '0 0 30px rgba(250,204,21,0.4)', '0 0 10px rgba(250,204,21,0.2)'],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                {nextMatch?.isFinal ? '👑 ENTER FINAL DESTINATION' : '⚔️ PROCEED TO ARENA'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tournament complete — reveal champion */}
      {isTournamentOver && (
        <motion.div className="fixed bottom-0 left-0 right-0 z-40"
          initial={{ y: 80 }} animate={{ y: 0 }}>
          <div className="bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-6 px-4">
            <div className="max-w-md mx-auto text-center bg-gray-900/80 border border-yellow-500/50 rounded-2xl p-5 shadow-[0_0_40px_rgba(250,204,21,0.2)]">
              <h3 className="text-2xl font-black text-yellow-400 mb-1">🏆 TOURNAMENT COMPLETE!</h3>
              <p className="text-gray-400 text-xs uppercase tracking-widest font-mono mb-4">All matches have been played</p>
              <motion.button
                onClick={() => useGameStore.setState({ gamePhase: 'victory' })}
                className="w-full py-3 rounded-xl font-black text-lg uppercase tracking-wider
                  bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-black border-2 border-yellow-300/50"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}>
                👑 REVEAL CHAMPION
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
