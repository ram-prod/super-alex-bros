import { useEffect } from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import BackButton from './BackButton';

const FIGHTER_EMOJI = {
  ruggero: '🔥', koen: '⚡', matthew: '🌊', martin: '🗡️', robin: '🏹',
  frederik: '🛡️', vincent: '💎', devan: '🌀', gereon: '⚔️', noah: '🌩️', alexander: '👑',
};

const POOL_COLORS = { A: '#ef4444', B: '#3b82f6', C: '#22c55e' };
const POOL_LABELS = { A: 'Pool A', B: 'Pool B', C: 'Pool C' };

function PoolCard({ poolKey, playerIds, players, matches }) {
  const poolPlayers = playerIds
    .map((id) => players.find((p) => p.id === id))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  const poolMatches = matches.filter((m) => m.pool === poolKey);
  const completed = poolMatches.filter((m) => m.completed).length;
  const total = poolMatches.length;
  const color = POOL_COLORS[poolKey];

  return (
    <motion.div
      className="rounded-xl border border-gray-700/50 bg-gray-900/60 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: poolKey === 'A' ? 0.1 : poolKey === 'B' ? 0.2 : 0.3 }}
    >
      {/* Pool header */}
      <div className="px-4 py-3 border-b border-gray-700/50" style={{ background: `${color}15` }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black uppercase tracking-widest" style={{ color }}>
            {POOL_LABELS[poolKey]}
          </h3>
          <span className="text-xs font-mono text-gray-500">{completed}/{total} played</span>
        </div>
        <div className="h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            animate={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
            transition={{ type: 'spring', stiffness: 200 }}
          />
        </div>
      </div>

      {/* Player standings */}
      <div className="p-3 space-y-1.5">
        {poolPlayers.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors
              ${i < 2 ? 'bg-white/5 border border-gray-700/30' : 'opacity-60'}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm w-5 text-center font-mono text-gray-500">{i + 1}</span>
              <span className="text-base">{FIGHTER_EMOJI[p.chosenCharacter] || '?'}</span>
              <span className="text-sm font-bold text-white">{p.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-green-400">{p.wins}W</span>
              <span className="text-xs font-mono text-red-400">{p.losses}L</span>
            </div>
          </div>
        ))}
      </div>

      {/* Qualify indicator */}
      <div className="px-4 pb-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest text-center">
          Top 2 advance to Knockout
        </div>
      </div>
    </motion.div>
  );
}

function KnockoutBracket({ matches, players }) {
  const rounds = ['QF', 'SF', 'Final'];

  return (
    <div className="mt-6">
      <h3 className="text-xl font-black text-yellow-400 uppercase tracking-widest text-center mb-4">
        ⚔️ Knockout Bracket
      </h3>
      <div className="space-y-2 max-w-lg mx-auto">
        {rounds.map((round) => {
          const roundMatches = matches.filter((m) => m.round === round);
          if (roundMatches.length === 0) return null;
          return (
            <div key={round}>
              <div className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-1">{round === 'QF' ? 'Quarter Finals' : round === 'SF' ? 'Semi Final' : '🏆 Grand Final'}</div>
              {roundMatches.map((m, i) => {
                const p1 = players.find((p) => p.id === m.p1Id);
                const p2 = players.find((p) => p.id === m.p2Id);
                return (
                  <div key={i} className={`flex items-center justify-between px-4 py-2 rounded-lg mb-1
                    ${m.completed ? 'bg-gray-800/50' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                    <span className={`text-sm font-bold ${m.completed && m.winnerId === p1?.id ? 'text-green-400' : m.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {FIGHTER_EMOJI[p1?.chosenCharacter]} {p1?.name}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">vs</span>
                    <span className={`text-sm font-bold ${m.completed && m.winnerId === p2?.id ? 'text-green-400' : m.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {p2?.name} {FIGHTER_EMOJI[p2?.chosenCharacter]}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TournamentBracketView() {
  const {
    players, pools, groupMatches, knockoutMatches, tournamentPhase,
    generateTournament, generateKnockout, advanceKnockout, goBack,
    isTournamentOver, tournamentWinner,
  } = useGameStore();

  // Auto-generate tournament on first mount if pools empty
  useEffect(() => {
    if (pools.A.length === 0) {
      generateTournament();
    }
  }, []);

  // Check if group stage is complete → generate knockout
  const allGroupsDone = groupMatches.length > 0 && groupMatches.every((m) => m.completed);
  const isKnockout = tournamentPhase === 'knockout' || tournamentPhase === 'final' || tournamentPhase === 'finished';

  useEffect(() => {
    if (allGroupsDone && tournamentPhase === 'group') {
      generateKnockout();
    }
  }, [allGroupsDone, tournamentPhase]);

  // Check if knockout round complete → advance
  useEffect(() => {
    if (isKnockout && knockoutMatches.length > 0) {
      const pending = knockoutMatches.filter((m) => !m.completed);
      if (pending.length === 0 && !isTournamentOver) {
        advanceKnockout();
      }
    }
  }, [knockoutMatches, isKnockout, isTournamentOver]);

  // Find next match
  const matches = tournamentPhase === 'group' ? groupMatches : knockoutMatches;
  const nextMatch = matches.find((m) => !m.completed);
  const nextP1 = nextMatch ? players.find((p) => p.id === nextMatch.p1Id) : null;
  const nextP2 = nextMatch ? players.find((p) => p.id === nextMatch.p2Id) : null;

  const goToMapSelect = () => {
    useGameStore.setState({ gamePhase: 'map_select' });
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center scale-110"
        style={{ backgroundImage: "url('/assets/maps/tuscany.jpg')", filter: 'blur(6px)' }} />
      <div className="absolute inset-0 bg-black/65" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="relative pt-6 pb-2 px-6">
          <div className="absolute top-6 left-6 z-20">
            <BackButton onClick={goBack} label="Roster" />
          </div>

          <motion.div className="text-center pt-2"
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 className="text-3xl sm:text-4xl font-black italic">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
                {isKnockout ? 'KNOCKOUT STAGE' : 'GROUP STAGE'}
              </span>
            </h1>
            <motion.div className="w-24 h-0.5 mx-auto mt-2 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.6 }} />
          </motion.div>
        </div>

        {/* Pool cards — Group stage */}
        {!isKnockout && (
          <div className="px-4 sm:px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {['A', 'B', 'C'].map((key) => (
                <PoolCard
                  key={key}
                  poolKey={key}
                  playerIds={pools[key]}
                  players={players}
                  matches={groupMatches}
                />
              ))}
            </div>
          </div>
        )}

        {/* Knockout bracket */}
        {isKnockout && (
          <div className="px-4 sm:px-6 py-4">
            <KnockoutBracket matches={knockoutMatches} players={players} />
          </div>
        )}

        {/* Next match banner */}
        {nextMatch && !isTournamentOver && (
          <motion.div
            className="mx-auto max-w-md w-full px-4 pb-6 mt-auto"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-gray-900/80 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-5 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-mono">
                {nextMatch.label || `${nextMatch.pool ? `Pool ${nextMatch.pool}` : ''} Match`} — Next Up
              </div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl mb-1">{FIGHTER_EMOJI[nextP1?.chosenCharacter]}</div>
                  <div className="text-sm font-bold text-white">{nextP1?.name}</div>
                </div>
                <div className="text-xl font-black text-yellow-400">VS</div>
                <div className="text-center">
                  <div className="text-2xl mb-1">{FIGHTER_EMOJI[nextP2?.chosenCharacter]}</div>
                  <div className="text-sm font-bold text-white">{nextP2?.name}</div>
                </div>
              </div>
              <motion.button
                onClick={goToMapSelect}
                className="w-full py-3 rounded-xl text-lg font-black uppercase tracking-wide
                  bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-black
                  shadow-[0_0_30px_rgba(250,204,21,0.3)] hover:shadow-[0_0_50px_rgba(250,204,21,0.5)] transition-all"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(250,204,21,0.2)',
                    '0 0 40px rgba(250,204,21,0.4)',
                    '0 0 20px rgba(250,204,21,0.2)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
              >
                ⚔️ START MATCH
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Tournament over — waiting for SIKE */}
        {isTournamentOver && (
          <motion.div
            className="mx-auto max-w-md w-full px-4 pb-6 mt-auto text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-gray-900/80 backdrop-blur-md border border-yellow-500/30 rounded-2xl p-5">
              <h3 className="text-2xl font-black text-yellow-400 mb-2">🏆 Tournament Complete!</h3>
              <p className="text-gray-400 text-sm mb-4">All matches have been played</p>
              <motion.button
                onClick={() => useGameStore.setState({ gamePhase: 'victory' })}
                className="w-full py-3 rounded-xl text-lg font-black uppercase tracking-wide
                  bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-black transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
              >
                👑 REVEAL CHAMPION
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
