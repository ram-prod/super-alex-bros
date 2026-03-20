import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import BackButton from './BackButton';
import CharacterThumb from './CharacterThumb';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

const ROUND_HEADERS = { Prelims: '🥊 PRELIMS', QF: '⚔️ QUARTER-FINALS', SF: '🔥 SEMI-FINALS', Final: '👑 GRAND FINAL' };

// --- Player slot in a match card ---
function PlayerSlot({ player, placeholder, isWinner, isVip, isWildcard }) {
  if (!player) {
    const label = placeholder
      ? placeholder.startsWith('W_') ? `Winner ${placeholder.split('_')[1]} ${parseInt(placeholder.split('_')[2]) + 1}`
      : placeholder.startsWith('WC_') ? `🃏 Wildcard ${+placeholder.split('_')[1] + 1}`
      : placeholder.startsWith('VIP_') ? '👑 VIP Bye'
      : 'TBD'
      : 'TBD';
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800/30 border border-dashed border-gray-700/30">
        <span className="text-xs sm:text-sm text-gray-500 italic truncate">{label}</span>
      </div>
    );
  }
  const charId = player.chosenCharacter;

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-md font-bold transition-all ${
      isWinner ? 'bg-green-500/15 text-green-300 border border-green-500/30' : player.isEliminated ? 'bg-red-500/5 text-red-400/50 line-through border border-red-500/10' : 'bg-white/5 text-white border border-white/10'
    }`}>
      <CharacterThumb charId={charId} size="w-10 h-10" emojiSize="text-2xl" />
      <span className="text-base sm:text-lg truncate">{player.name}</span>
      {isVip && <span className="text-xs text-yellow-400 ml-auto">👑</span>}
      {isWildcard && <span className="text-xs text-purple-400 ml-auto">🃏</span>}
      {isWinner && <span className="ml-auto text-green-400 text-sm">✓</span>}
    </div>
  );
}

function MatchCard({ match, players, vipPlayerId, selectedWildcards, isActive, animDelay = 0 }) {
  const p1 = typeof match.p1Id === 'number' ? players.find((p) => p.id === match.p1Id) : null;
  const p2 = typeof match.p2Id === 'number' ? players.find((p) => p.id === match.p2Id) : null;
  const p1Placeholder = typeof match.p1Id === 'string' ? match.p1Id : null;
  const p2Placeholder = typeof match.p2Id === 'string' ? match.p2Id : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animDelay, duration: 0.3, type: 'tween', ease: 'easeOut' }}
    >
      <div className={`rounded-lg border p-2 space-y-1 min-w-0 transition-all ${
        isActive && !match.completed
          ? 'border-yellow-500/40 bg-yellow-500/5 shadow-[0_0_15px_rgba(250,204,21,0.15)]'
          : match.completed
          ? 'border-green-500/20 bg-gray-900/40'
          : 'border-gray-700/30 bg-gray-900/40'
      }`}>
        <PlayerSlot player={p1} placeholder={p1Placeholder} isWinner={match.completed && match.winnerId === p1?.id}
          isVip={p1?.id === vipPlayerId} isWildcard={selectedWildcards?.includes(p1?.id)} />
        <div className="text-center text-xs text-gray-600 font-black tracking-widest py-0.5">VS</div>
        <PlayerSlot player={p2} placeholder={p2Placeholder} isWinner={match.completed && match.winnerId === p2?.id}
          isVip={p2?.id === vipPlayerId} isWildcard={selectedWildcards?.includes(p2?.id)} />
      </div>
    </motion.div>
  );
}

function VipBadge({ player }) {
  if (!player) return null;
  return (
    <div className="relative flex flex-col items-center">
      {/* Crown centered above the card */}
      <div className="text-2xl sm:text-3xl mb-1 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.6))' }}>👑</div>
      {/* Card — same layout as PlayerSlot but with VIP gold styling */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-md border-2 border-yellow-500/50 bg-yellow-500/10 font-bold text-yellow-300"
        style={{ boxShadow: '0 0 20px rgba(250,204,21,0.15)' }}>
        <CharacterThumb charId={player.chosenCharacter} size="w-10 h-10" emojiSize="text-2xl" />
        <div className="flex flex-col">
          <span className="text-base sm:text-lg">{player.name}</span>
          <span className="text-[10px] sm:text-xs text-yellow-500/60 font-mono uppercase tracking-wider">VIP Bye</span>
        </div>
      </div>
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
      const count = useGameStore.getState().bracketConfig?.wildcards || 1;
      setRevealed(shuffled.slice(0, count));
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

        <motion.p className="text-sm sm:text-base font-bold uppercase tracking-widest text-gray-300 drop-shadow-md mb-8" initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {candidates.length} fighters have fallen. Only <span className="text-purple-300 font-bold">
          {useGameStore.getState().bracketConfig?.wildcards || 2}</span> will be resurrected.
        </motion.p>

        {phase === 'spinning' && currentDisplay && (
          <motion.div className="mb-8">
            <motion.div key={displayIdx} className="text-6xl mb-2" initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.05 }}>
              <CharacterThumb charId={currentDisplay.chosenCharacter} size="w-16 h-16" emojiSize="text-6xl" rounded={false} />
            </motion.div>
            <div className="text-xl font-black text-white">{currentDisplay.name}</div>
          </motion.div>
        )}

        <AnimatePresence>
          {phase === 'reveal' && (
            <motion.div className="mb-8 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <div className="text-purple-400 text-xs uppercase tracking-widest font-bold mb-3">
                {revealed.length === 1 ? '🃏 The Wildcard Is...' : '🃏 The Wildcards Are...'}
              </div>
              <div className="flex justify-center gap-4">
                {revealed.map((p, i) => (
                  <motion.div key={p.id}
                    className="bg-purple-500/10 border-2 border-purple-400/50 rounded-xl p-4 text-center min-w-[120px]"
                    initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.3, delay: 0.5 + i * 0.4 }}
                    style={{ boxShadow: '0 0 25px rgba(168,85,247,0.2)' }}>
                    <div className="mb-1 flex justify-center"><CharacterThumb charId={p.chosenCharacter} size="w-12 h-12" emojiSize="text-4xl" rounded={false} /></div>
                    <div className="text-white font-black">{p.name}</div>
                    <div className="text-purple-300 text-[10px] font-bold mt-1">RESURRECTED 🃏</div>
                  </motion.div>
                ))}
              </div>
              <motion.button onClick={() => onComplete(revealed.map((p) => p.id))}
                className="group mt-6"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <div className="px-8 py-3 border-2 border-purple-400/50 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-sm group-hover:border-purple-300 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-200"
                  style={{ transform: 'skewX(-10deg)' }}>
                  <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-base text-purple-200">
                    ⚔️ TO THE QUARTER-FINALS
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'intro' && (
          <>
            <motion.button onClick={() => setPhase('spinning')}
              className="group"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <div className="px-10 py-4 border-2 border-purple-400/50 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-sm group-hover:border-purple-300 group-hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] transition-all duration-200"
                style={{ transform: 'skewX(-10deg)' }}>
                <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-xl text-purple-200">
                  🎰 SPIN ROULETTE
                </div>
              </div>
            </motion.button>
            <motion.div className="mt-6 flex flex-wrap justify-center gap-2"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              {candidatePlayers.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/50 border border-gray-700/30">
                  <CharacterThumb charId={p.chosenCharacter} size="w-5 h-5" emojiSize="text-sm" />
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
    vipPlayerId, wildcardCandidates, selectedWildcards,
    isTournamentOver, generateTournament, advanceTournament, executeWildcards,
  } = useGameStore();

  const hasStarted = completedMatches.length > 0;
  const [showRoulette, setShowRoulette] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  useEffect(() => {
    if (knockoutRounds.length === 0 && !isTournamentOver) {
      generateTournament();
    }
  }, []);

  useEffect(() => {
    if (bracketStage === 'wildcards') return;
    const stageToRound = { prelims: 'Prelims', qf: 'QF', sf: 'SF', final: 'Final' };
    const activeRound = knockoutRounds.find((r) => r.round === stageToRound[bracketStage]);
    if (activeRound && pendingMatches.length === 0 && !isTournamentOver) {
      const allDone = activeRound.matches.every((m) => m.completed);
      if (allDone) advanceTournament();
    }
  }, [pendingMatches.length, knockoutRounds, bracketStage, isTournamentOver]);

  const vipPlayer = vipPlayerId ? players.find((p) => p.id === vipPlayerId) : null;
  const nextMatch = pendingMatches[0];
  const nextP1 = nextMatch ? players.find((p) => p.id === nextMatch.p1Id) : null;
  const nextP2 = nextMatch ? players.find((p) => p.id === nextMatch.p2Id) : null;

  const stageToRound = { prelims: 'Prelims', qf: 'QF', sf: 'SF', final: 'Final' };
  const activeRoundName = stageToRound[bracketStage];

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

      {/* Exit modal */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div className="absolute inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowExitModal(false)} />
            <motion.div
              className="relative z-10 panel-smash border-red-500/80 p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.4)]"
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}>
              <div className="panel-smash-content">
                <h3 className="text-smash text-3xl text-red-500 mb-2">⚠️ End Tournament?</h3>
                <p className="text-gray-300 text-lg mb-8 uppercase">Are you sure? All progress will be lost.</p>
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => setShowExitModal(false)}
                    className="group flex-1"
                    whileTap={{ scale: 0.95 }}>
                    <div className="py-3 border-2 border-gray-600 rounded-sm hover:border-gray-400 transition-colors"
                      style={{ transform: 'skewX(-5deg)' }}>
                      <div style={{ transform: 'skewX(5deg)' }} className="text-smash text-sm text-gray-300">Cancel</div>
                    </div>
                  </motion.button>
                  <motion.button
                    onClick={() => useGameStore.getState().resetGame()}
                    className="group flex-1"
                    whileTap={{ scale: 0.95 }}>
                    <div className="py-3 border-2 border-red-500/50 bg-red-600 rounded-sm hover:bg-red-500 transition-colors"
                      style={{ transform: 'skewX(-5deg)' }}>
                      <div style={{ transform: 'skewX(5deg)' }} className="text-smash text-sm text-white">End Tournament</div>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10 px-3 pt-3 pb-1 flex items-center justify-between">
        {!hasStarted ? (
          <BackButton onClick={() => useGameStore.getState().goBack()} />
        ) : (
          <motion.button onClick={() => setShowExitModal(true)}
            className="group flex items-center gap-2 z-50"
            whileHover={{ x: -4 }} whileTap={{ scale: 0.93 }}>
            <div className="flex items-center gap-2 px-4 py-2 border-2 border-red-600/60 bg-gray-900/80 backdrop-blur-sm text-red-400 text-sm font-bold uppercase tracking-wider group-hover:border-red-400/60 group-hover:text-red-300 group-hover:bg-red-500/10 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all duration-200"
              style={{ transform: 'skewX(-10deg)' }}>
              <span style={{ transform: 'skewX(10deg)' }} className="flex items-center gap-2"><span className="text-lg">✕</span><span>Exit</span></span>
            </div>
          </motion.button>
        )}
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 uppercase tracking-wider">
            {ROUND_HEADERS[activeRoundName] || 'TOURNAMENT'}
          </h2>
          <p className="text-gray-500 text-sm sm:text-base uppercase tracking-[0.3em] drop-shadow-sm mt-1">
            Bachelor&apos;s Knockout
          </p>
        </div>
        <div className="w-16" />
      </div>

      {/* Wildcard overlay */}
      {bracketStage === 'wildcards' && showRoulette && (
        <WildcardRoulette candidates={wildcardCandidates} players={players} onComplete={executeWildcards} />
      )}

      {/* Bracket grid */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-2 sm:px-4 pb-24 overflow-hidden">
        <div className="flex items-center justify-center h-full w-full max-w-7xl mx-auto gap-1 sm:gap-2">
          {knockoutRounds.map((round, roundIdx) => {
            const nextRound = knockoutRounds[roundIdx + 1];
            const isActiveRound = round.round === activeRoundName;

            return (
              <div key={roundIdx} className="contents">
                {/* Round column */}
                <div className="flex flex-col flex-1 min-w-0">
                  {/* Round label */}
                  <div className={`text-center mb-2 ${isActiveRound ? 'text-yellow-400' : 'text-gray-500'}`}>
                    <div className="text-sm sm:text-base font-black uppercase tracking-widest drop-shadow-sm">
                      {ROUND_HEADERS[round.round] || round.round}
                    </div>
                    <div className="text-xs font-mono text-gray-600">
                      {round.matches.filter((m) => m.completed).length}/{round.matches.length}
                    </div>
                  </div>

                  {/* VIP badge in prelims column */}
                  {round.round === 'Prelims' && vipPlayer && (
                    <div className="flex justify-center mb-2">
                      <VipBadge player={vipPlayer} />
                    </div>
                  )}

                  {/* Matches */}
                  <div className="flex flex-col justify-around flex-1 gap-1.5">
                    {round.matches.map((match, mIdx) => (
                      <MatchCard
                        key={mIdx}
                        match={match}
                        players={players}
                        vipPlayerId={vipPlayerId}
                        selectedWildcards={selectedWildcards}
                        isActive={isActiveRound}
                        animDelay={0.1 + (roundIdx * 0.15) + (mIdx * 0.05)}
                      />
                    ))}
                  </div>
                </div>

                {/* Arrow separator */}
                {nextRound && (
                  <motion.div className="flex items-center justify-center px-1 sm:px-3"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + (roundIdx * 0.15), duration: 0.5, type: 'tween', ease: 'easeOut' }}>
                    <motion.span
                      className="text-4xl sm:text-6xl text-yellow-500/40"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ➔
                    </motion.span>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom action bar — Wildcard draw */}
      {bracketStage === 'wildcards' && !showRoulette && (
        <motion.div className="fixed bottom-0 left-0 right-0 z-30"
          initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}>
          <div className="bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-4 px-4">
            <div className="max-w-md mx-auto text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-purple-300 drop-shadow-md mb-4">
                🃏 {wildcardCandidates.length} fighters eliminated — wildcards must be drawn!
              </p>
              <motion.button
                onClick={() => setShowRoulette(true)}
                className="group w-full"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                <div className="w-full py-4 border-2 border-purple-400/50 bg-purple-600/20 rounded-sm group-hover:bg-purple-500/30 group-hover:border-purple-400 group-hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all duration-200"
                  style={{ transform: 'skewX(-10deg)' }}>
                  <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-lg text-purple-200">
                    🎰 DRAW WILDCARDS
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom action bar — Proceed to next match */}
      {bracketStage !== 'wildcards' && nextMatch && (
        <motion.div className="fixed bottom-0 left-0 right-0 z-30"
          initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}>
          <div className="bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-4 px-4">
            <div className="max-w-lg mx-auto">
              {/* Next match preview */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <CharacterThumb charId={nextP1?.chosenCharacter} size="w-14 h-14" emojiSize="text-4xl" />
                  <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">{nextP1?.name}</span>
                </div>
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-red-500 mx-1" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.2)' }}>VS</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">{nextP2?.name}</span>
                  <CharacterThumb charId={nextP2?.chosenCharacter} size="w-14 h-14" emojiSize="text-4xl" />
                </div>
              </div>
              <motion.button
                onClick={handleProceed}
                className="group w-full"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                <div className="w-full py-4 border-2 border-yellow-400/50 bg-yellow-500/10 rounded-sm group-hover:bg-yellow-500/20 group-hover:border-yellow-400 group-hover:shadow-[0_0_40px_rgba(250,204,21,0.4)] transition-all duration-200"
                  style={{ transform: 'skewX(-10deg)' }}>
                  <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-lg text-yellow-300">
                    {nextMatch?.isFinal ? '👑 ENTER FINAL DESTINATION' : '⚔️ PROCEED TO ARENA'}
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tournament complete */}
      {isTournamentOver && (
        <motion.div className="fixed bottom-0 left-0 right-0 z-40"
          initial={{ y: 80 }} animate={{ y: 0 }}>
          <div className="bg-gradient-to-t from-black via-black/95 to-transparent pt-6 pb-6 px-4">
            <div className="max-w-md mx-auto text-center bg-gray-900/80 border border-yellow-500/50 rounded-2xl p-5 shadow-[0_0_40px_rgba(250,204,21,0.2)]">
              <h3 className="text-2xl font-black text-yellow-400 mb-1">🏆 TOURNAMENT COMPLETE!</h3>
              <p className="text-sm font-bold uppercase tracking-widest text-gray-300 drop-shadow-md mb-5">All matches have been played</p>
              <motion.button
                onClick={() => useGameStore.setState({ gamePhase: 'victory' })}
                className="group w-full"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <div className="w-full py-4 border-2 border-red-500/60 bg-red-500/10 rounded-sm group-hover:bg-red-500/20 group-hover:border-yellow-400 group-hover:shadow-[0_0_40px_rgba(250,204,21,0.4)] transition-all duration-200"
                  style={{ transform: 'skewX(-10deg)' }}>
                  <div style={{ transform: 'skewX(10deg)' }} className="text-smash text-lg text-yellow-300">
                    👑 REVEAL CHAMPION
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
