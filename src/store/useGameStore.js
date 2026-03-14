import { create } from 'zustand';
import gameData from '../data/gamedata.json';

// --- helpers ---
const createPlayers = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    chosenCharacter: null,
    isEliminated: false,
    wins: 0,
    losses: 0,
    pool: null, // 'A', 'B', or 'C'
  }));

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Generate round-robin pairs for an array of player IDs
const roundRobin = (playerIds) => {
  const matches = [];
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      matches.push({ p1Id: playerIds[i], p2Id: playerIds[j], completed: false, winnerId: null });
    }
  }
  return shuffle(matches); // randomize match order within pool
};

const useGameStore = create((set, get) => ({
  // --- state ---
  gamePhase: 'splash',
  // 'splash' | 'roster_select' | 'tournament_overview' | 'map_select' | 'vs_screen' | 'battle' | 'victory'
  tournamentSize: 11,
  players: createPlayers(11),
  currentTurn: 1,

  // Tournament structure
  pools: { A: [], B: [], C: [] }, // arrays of player IDs
  groupMatches: [],    // all group stage matches
  knockoutMatches: [],  // knockout bracket matches
  tournamentPhase: 'group', // 'group' | 'knockout' | 'final' | 'finished'
  currentMatchIndex: -1, // index into groupMatches or knockoutMatches

  // Current battle
  currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
  selectedMap: null,
  matchWinner: null,

  // Tournament end
  tournamentWinner: null,
  isTournamentOver: false,

  // Data
  characters: gameData.characters,
  maps: gameData.maps,

  // --- actions ---
  setTournamentSize: (size) => {
    const clamped = Math.max(2, Math.min(11, size));
    set({
      tournamentSize: clamped,
      players: createPlayers(clamped),
      currentTurn: 1,
    });
  },

  assignCharacter: (playerId, characterId) =>
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);
      if (!player) return {};

      if (player.chosenCharacter === characterId) {
        return { players: state.players.map((p) => p.id === playerId ? { ...p, chosenCharacter: null } : p) };
      }

      const takenBy = state.players.find((p) => p.id !== playerId && p.chosenCharacter === characterId);
      if (takenBy) return {};

      const players = state.players.map((p) => p.id === playerId ? { ...p, chosenCharacter: characterId } : p);
      const nextUnchosen = players.find((p) => p.id > playerId && !p.chosenCharacter);
      const firstUnchosen = players.find((p) => !p.chosenCharacter);
      const nextTurn = nextUnchosen?.id || firstUnchosen?.id || state.currentTurn;

      return { players, currentTurn: nextTurn };
    }),

  confirmRoster: () =>
    set((state) => {
      const allLocked = state.players.every((p) => p.chosenCharacter !== null);
      if (!allLocked) return {};
      return { gamePhase: 'tournament_overview' };
    }),

  // Generate full tournament structure
  generateTournament: () =>
    set((state) => {
      const ids = shuffle(state.players.map((p) => p.id));
      const size = ids.length;

      // Split into 3 pools: A gets ceil(n/3), B gets ceil((n-A)/2), C gets rest
      const poolASize = Math.ceil(size / 3);
      const poolBSize = Math.ceil((size - poolASize) / 2);
      const poolA = ids.slice(0, poolASize);
      const poolB = ids.slice(poolASize, poolASize + poolBSize);
      const poolC = ids.slice(poolASize + poolBSize);

      // Tag players with pool
      const players = state.players.map((p) => {
        if (poolA.includes(p.id)) return { ...p, pool: 'A' };
        if (poolB.includes(p.id)) return { ...p, pool: 'B' };
        return { ...p, pool: 'C' };
      });

      // Generate round-robin matches per pool, tagged with pool label
      const matchesA = roundRobin(poolA).map((m) => ({ ...m, pool: 'A' }));
      const matchesB = roundRobin(poolB).map((m) => ({ ...m, pool: 'B' }));
      const matchesC = roundRobin(poolC).map((m) => ({ ...m, pool: 'C' }));

      // Interleave: A, B, C, A, B, C... so pools alternate
      const groupMatches = [];
      const maxLen = Math.max(matchesA.length, matchesB.length, matchesC.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < matchesA.length) groupMatches.push(matchesA[i]);
        if (i < matchesB.length) groupMatches.push(matchesB[i]);
        if (i < matchesC.length) groupMatches.push(matchesC[i]);
      }

      return {
        players,
        pools: { A: poolA, B: poolB, C: poolC },
        groupMatches,
        knockoutMatches: [],
        tournamentPhase: 'group',
        currentMatchIndex: -1,
        isTournamentOver: false,
        tournamentWinner: null,
      };
    }),

  // Generate knockout bracket from top 2 per pool
  generateKnockout: () =>
    set((state) => {
      const { players, pools } = state;

      // Get top 2 from each pool by wins, then losses as tiebreaker
      const getTop2 = (poolIds) => {
        const poolPlayers = poolIds.map((id) => players.find((p) => p.id === id));
        poolPlayers.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
        return poolPlayers.slice(0, 2);
      };

      const topA = getTop2(pools.A);
      const topB = getTop2(pools.B);
      const topC = getTop2(pools.C);

      const qualifiers = [...topA, ...topB, ...topC]; // 6 players

      // Knockout bracket: QF (3 matches) → SF (will be generated after) → Final
      // Seed: 1A vs 2C, 1B vs 2A, 1C vs 2B
      const knockoutMatches = [
        { p1Id: topA[0].id, p2Id: topC[1]?.id || topC[0]?.id, completed: false, winnerId: null, round: 'QF', label: 'QF 1' },
        { p1Id: topB[0].id, p2Id: topA[1].id, completed: false, winnerId: null, round: 'QF', label: 'QF 2' },
        { p1Id: topC[0].id, p2Id: topB[1].id, completed: false, winnerId: null, round: 'QF', label: 'QF 3' },
      ];

      // Mark non-qualifiers as eliminated
      const qualifierIds = qualifiers.map((q) => q.id);
      const updatedPlayers = players.map((p) => ({
        ...p,
        isEliminated: !qualifierIds.includes(p.id),
      }));

      return {
        players: updatedPlayers,
        knockoutMatches,
        tournamentPhase: 'knockout',
        currentMatchIndex: -1,
      };
    }),

  // Advance knockout: generate next round from winners
  advanceKnockout: () =>
    set((state) => {
      const { knockoutMatches } = state;
      const currentRound = knockoutMatches.filter((m) => !m.completed);
      if (currentRound.length > 0) return {}; // not all done

      const completedRounds = knockoutMatches.filter((m) => m.completed);
      const lastRound = completedRounds[completedRounds.length - 1]?.round;

      if (lastRound === 'Final') {
        // Tournament is over
        const finalMatch = knockoutMatches.find((m) => m.round === 'Final' && m.completed);
        const winner = state.players.find((p) => p.id === finalMatch?.winnerId);
        return { tournamentPhase: 'finished', isTournamentOver: true, tournamentWinner: winner };
      }

      // Collect winners from last round
      const roundMatches = knockoutMatches.filter((m) => m.round === lastRound && m.completed);
      const winnerIds = roundMatches.map((m) => m.winnerId);

      let newMatches = [];
      if (lastRound === 'QF') {
        // 3 QF winners → SF: #1 vs #2, #3 gets bye to final
        if (winnerIds.length === 3) {
          newMatches = [
            { p1Id: winnerIds[0], p2Id: winnerIds[1], completed: false, winnerId: null, round: 'SF', label: 'Semi Final' },
          ];
          // Store bye player for final
          set((s) => ({ _byePlayerId: winnerIds[2] }));
        }
      } else if (lastRound === 'SF') {
        const byeId = state._byePlayerId;
        const sfWinner = winnerIds[0];
        newMatches = [
          { p1Id: sfWinner, p2Id: byeId, completed: false, winnerId: null, round: 'Final', label: 'GRAND FINAL' },
        ];
      }

      // Eliminate losers
      const allWinnerIds = knockoutMatches.filter((m) => m.completed).map((m) => m.winnerId);
      const byeId = state._byePlayerId;
      const stillInIds = [...new Set([...winnerIds, ...(byeId ? [byeId] : [])])];

      return {
        knockoutMatches: [...knockoutMatches, ...newMatches],
        currentMatchIndex: -1,
      };
    }),

  selectMap: (mapId) =>
    set((state) => {
      const { tournamentPhase, groupMatches, knockoutMatches, players } = state;
      const matches = tournamentPhase === 'group' ? groupMatches : knockoutMatches;
      const nextMatch = matches.find((m) => !m.completed);

      if (!nextMatch) return {};

      const player1 = players.find((p) => p.id === nextMatch.p1Id);
      const player2 = players.find((p) => p.id === nextMatch.p2Id);

      return {
        selectedMap: mapId,
        gamePhase: 'vs_screen',
        currentMatch: { player1, player2, p1Damage: 0, p2Damage: 0, activeQuestion: null },
        matchWinner: null,
      };
    }),

  startBattle: () => set({ gamePhase: 'battle' }),

  awardDamage: (loserPlayerId) =>
    set((state) => {
      const m = state.currentMatch;
      const isP1 = m.player1?.id === loserPlayerId;

      const newP1Damage = isP1 ? Math.min(m.p1Damage + 100, 200) : m.p1Damage;
      const newP2Damage = !isP1 ? Math.min(m.p2Damage + 100, 200) : m.p2Damage;
      const newMatch = { ...m, p1Damage: newP1Damage, p2Damage: newP2Damage };

      let winner = null;
      let loserId = null;
      if (newP1Damage >= 200) { winner = m.player2; loserId = m.player1.id; }
      else if (newP2Damage >= 200) { winner = m.player1; loserId = m.player2.id; }

      if (winner) {
        const { tournamentPhase, groupMatches, knockoutMatches } = state;
        const matches = tournamentPhase === 'group' ? groupMatches : knockoutMatches;
        const matchKey = tournamentPhase === 'group' ? 'groupMatches' : 'knockoutMatches';

        // Mark match completed
        const updatedMatches = matches.map((mt) => {
          if (!mt.completed && mt.p1Id === m.player1.id && mt.p2Id === m.player2.id) {
            return { ...mt, completed: true, winnerId: winner.id };
          }
          return mt;
        });

        // Update player stats
        const players = state.players.map((p) => {
          if (p.id === winner.id) return { ...p, wins: p.wins + 1 };
          if (p.id === loserId) {
            const update = { ...p, losses: p.losses + 1 };
            // In knockout, loser is eliminated
            if (tournamentPhase !== 'group') update.isEliminated = true;
            return update;
          }
          return p;
        });

        return {
          currentMatch: newMatch,
          players,
          matchWinner: winner,
          gamePhase: 'victory',
          [matchKey]: updatedMatches,
        };
      }

      return { currentMatch: newMatch };
    }),

  // After victory sequence, go back to tournament overview
  nextMatch: () =>
    set((state) => {
      return {
        gamePhase: 'tournament_overview',
        selectedMap: null,
        matchWinner: null,
        currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
      };
    }),

  goBack: () =>
    set((state) => {
      if (state.gamePhase === 'map_select') return { gamePhase: 'tournament_overview' };
      if (state.gamePhase === 'tournament_overview') return { gamePhase: 'roster_select' };
      if (state.gamePhase === 'roster_select') return { gamePhase: 'splash' };
      return {};
    }),

  resetGame: () =>
    set((state) => ({
      gamePhase: 'splash',
      players: createPlayers(state.tournamentSize),
      currentTurn: 1,
      pools: { A: [], B: [], C: [] },
      groupMatches: [],
      knockoutMatches: [],
      tournamentPhase: 'group',
      currentMatchIndex: -1,
      currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
      selectedMap: null,
      matchWinner: null,
      tournamentWinner: null,
      isTournamentOver: false,
      _byePlayerId: null,
    })),
}));

export default useGameStore;
