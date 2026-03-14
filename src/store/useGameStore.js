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
    pool: null,
  }));

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Round-robin pairs for an array of player IDs
const roundRobin = (ids) => {
  const matches = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      matches.push({ p1Id: ids[i], p2Id: ids[j] });
    }
  }
  return shuffle(matches);
};

// Distribute N ids into K pools as evenly as possible
const splitIntoPools = (ids, poolCount) => {
  const labels = ['A', 'B', 'C'];
  const pools = {};
  for (let k = 0; k < poolCount; k++) pools[labels[k]] = [];
  ids.forEach((id, i) => pools[labels[i % poolCount]].push(id));
  return pools;
};

// Get sorted standings for a pool
const getPoolStandings = (poolIds, players) => {
  return poolIds
    .map((id) => players.find((p) => p.id === id))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
};

const useGameStore = create((set, get) => ({
  // --- state ---
  gamePhase: 'splash',
  tournamentSize: 11,
  players: createPlayers(11),
  currentTurn: 1,

  // Tournament structure
  pools: {},              // { A: [ids], B: [ids], C: [ids] }
  poolCount: 0,
  tournamentPhase: 'groups', // 'groups' | 'knockout'
  pendingMatches: [],     // matches yet to be played
  completedMatches: [],   // finished matches
  knockoutRounds: [],     // for bracket display: [{ round, matches: [...] }]

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
    set({ tournamentSize: clamped, players: createPlayers(clamped), currentTurn: 1 });
  },

  assignCharacter: (playerId, characterId) =>
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);
      if (!player) return {};
      if (player.chosenCharacter === characterId) {
        return { players: state.players.map((p) => p.id === playerId ? { ...p, chosenCharacter: null, name: `Player ${p.id}` } : p) };
      }
      if (state.players.find((p) => p.id !== playerId && p.chosenCharacter === characterId)) return {};
      const charName = state.characters.find((c) => c.id === characterId)?.name || `Player ${playerId}`;
      const players = state.players.map((p) => p.id === playerId ? { ...p, chosenCharacter: characterId, name: charName } : p);
      const nextUnchosen = players.find((p) => p.id > playerId && !p.chosenCharacter);
      const firstUnchosen = players.find((p) => !p.chosenCharacter);
      return { players, currentTurn: nextUnchosen?.id || firstUnchosen?.id || state.currentTurn };
    }),

  confirmRoster: () =>
    set((state) => {
      if (!state.players.every((p) => p.chosenCharacter !== null)) return {};
      return { gamePhase: 'tournament_overview' };
    }),

  // ============================================
  // DYNAMIC TOURNAMENT GENERATION
  // ============================================
  generateTournament: () =>
    set((state) => {
      const size = state.tournamentSize;
      const ids = shuffle(state.players.map((p) => p.id));

      // --- Size 2: Direct final, no groups ---
      if (size === 2) {
        const players = state.players.map((p) => ({ ...p, pool: null }));
        return {
          players,
          pools: {},
          poolCount: 0,
          tournamentPhase: 'knockout',
          pendingMatches: [{ p1Id: ids[0], p2Id: ids[1], pool: null, round: 'Final', label: 'GRAND FINAL', isFinal: true }],
          completedMatches: [],
          knockoutRounds: [{ round: 'Final', matches: [{ p1Id: ids[0], p2Id: ids[1], completed: false, winnerId: null }] }],
          isTournamentOver: false,
          tournamentWinner: null,
        };
      }

      // --- Determine pool count ---
      let poolCount;
      if (size <= 5) poolCount = 1;
      else if (size <= 8) poolCount = 2;
      else poolCount = 3;

      const pools = splitIntoPools(ids, poolCount);

      // Tag players with pool
      const players = state.players.map((p) => {
        for (const [label, pIds] of Object.entries(pools)) {
          if (pIds.includes(p.id)) return { ...p, pool: label, wins: 0, losses: 0, isEliminated: false };
        }
        return { ...p, wins: 0, losses: 0, isEliminated: false };
      });

      // Generate round-robin matches per pool, interleaved
      const poolLabels = Object.keys(pools);
      const poolMatches = {};
      poolLabels.forEach((label) => {
        poolMatches[label] = roundRobin(pools[label]).map((m) => ({ ...m, pool: label, round: 'Group', label: `Pool ${label}` }));
      });

      // Interleave matches across pools
      const pending = [];
      const maxLen = Math.max(...poolLabels.map((l) => poolMatches[l].length));
      for (let i = 0; i < maxLen; i++) {
        poolLabels.forEach((l) => {
          if (i < poolMatches[l].length) pending.push(poolMatches[l][i]);
        });
      }

      return {
        players,
        pools,
        poolCount,
        tournamentPhase: 'groups',
        pendingMatches: pending,
        completedMatches: [],
        knockoutRounds: [],
        isTournamentOver: false,
        tournamentWinner: null,
      };
    }),

  // ============================================
  // KNOCKOUT BRACKET GENERATION
  // ============================================
  generateKnockoutBracket: () =>
    set((state) => {
      const { pools, poolCount, players } = state;

      if (poolCount === 0) return {}; // size 2, already in knockout

      const poolLabels = Object.keys(pools);
      let qualifierIds = [];
      let knockoutMatches = [];

      if (poolCount === 1) {
        // Top 2 from Pool A → Grand Final
        const standings = getPoolStandings(pools.A, players);
        qualifierIds = standings.slice(0, 2).map((p) => p.id);
        knockoutMatches = [
          { p1Id: qualifierIds[0], p2Id: qualifierIds[1], round: 'Final', label: 'GRAND FINAL', isFinal: true, completed: false, winnerId: null },
        ];
      } else if (poolCount === 2) {
        // Top 2 from each pool → Semi-Finals: A1 vs B2, B1 vs A2
        const standA = getPoolStandings(pools.A, players);
        const standB = getPoolStandings(pools.B, players);
        const a1 = standA[0], a2 = standA[1], b1 = standB[0], b2 = standB[1];
        qualifierIds = [a1, a2, b1, b2].map((p) => p.id);
        knockoutMatches = [
          { p1Id: a1.id, p2Id: b2.id, round: 'SF', label: 'Semi Final 1', completed: false, winnerId: null },
          { p1Id: b1.id, p2Id: a2.id, round: 'SF', label: 'Semi Final 2', completed: false, winnerId: null },
        ];
      } else {
        // 3 pools: 3 pool winners + best runner-up → Semi-Finals
        const standings = poolLabels.map((l) => getPoolStandings(pools[l], players));
        const winners = standings.map((s) => s[0]); // 3 pool winners
        const runnersUp = standings
          .map((s) => s[1])
          .filter(Boolean)
          .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
        const bestRunnerUp = runnersUp[0];

        const semiFighters = [...winners];
        if (bestRunnerUp) semiFighters.push(bestRunnerUp);

        qualifierIds = semiFighters.map((p) => p.id);

        if (semiFighters.length === 4) {
          // Seed: Pool A winner vs best runner-up, Pool B winner vs Pool C winner
          knockoutMatches = [
            { p1Id: semiFighters[0].id, p2Id: semiFighters[3].id, round: 'SF', label: 'Semi Final 1', completed: false, winnerId: null },
            { p1Id: semiFighters[1].id, p2Id: semiFighters[2].id, round: 'SF', label: 'Semi Final 2', completed: false, winnerId: null },
          ];
        } else if (semiFighters.length === 3) {
          // 3 fighters: #1 seed gets bye, #2 vs #3
          knockoutMatches = [
            { p1Id: semiFighters[1].id, p2Id: semiFighters[2].id, round: 'SF', label: 'Semi Final', completed: false, winnerId: null },
          ];
          // Store bye player
          set({ _byePlayerId: semiFighters[0].id });
        } else {
          // 2 fighters: direct final
          knockoutMatches = [
            { p1Id: semiFighters[0].id, p2Id: semiFighters[1].id, round: 'Final', label: 'GRAND FINAL', isFinal: true, completed: false, winnerId: null },
          ];
        }
      }

      // Mark non-qualifiers as eliminated
      const updatedPlayers = players.map((p) => ({
        ...p,
        isEliminated: !qualifierIds.includes(p.id),
      }));

      return {
        players: updatedPlayers,
        tournamentPhase: 'knockout',
        pendingMatches: knockoutMatches,
        knockoutRounds: [{ round: knockoutMatches[0]?.round || 'Final', matches: knockoutMatches.map((m) => ({ ...m })) }],
        gamePhase: 'tournament_overview',
      };
    }),

  // ============================================
  // ADVANCE KNOCKOUT (generate next round)
  // ============================================
  advanceKnockout: () =>
    set((state) => {
      const { completedMatches, knockoutRounds, _byePlayerId, players } = state;

      // Find winners from the latest round
      const lastRound = knockoutRounds[knockoutRounds.length - 1];
      if (!lastRound) return {};

      const roundWinnerIds = lastRound.matches
        .filter((m) => m.completed)
        .map((m) => m.winnerId);

      if (lastRound.round === 'Final') {
        // Tournament over
        const winner = players.find((p) => p.id === roundWinnerIds[0]);
        return { isTournamentOver: true, tournamentWinner: winner };
      }

      // Generate next round
      let nextMatches = [];
      let nextRound = 'Final';

      if (lastRound.round === 'SF') {
        if (roundWinnerIds.length === 2) {
          nextMatches = [
            { p1Id: roundWinnerIds[0], p2Id: roundWinnerIds[1], round: 'Final', label: 'GRAND FINAL', isFinal: true, completed: false, winnerId: null },
          ];
        } else if (roundWinnerIds.length === 1 && _byePlayerId) {
          nextMatches = [
            { p1Id: roundWinnerIds[0], p2Id: _byePlayerId, round: 'Final', label: 'GRAND FINAL', isFinal: true, completed: false, winnerId: null },
          ];
        }
      }

      // Eliminate losers
      const loserIds = lastRound.matches
        .filter((m) => m.completed)
        .map((m) => m.winnerId === m.p1Id ? m.p2Id : m.p1Id);
      const updatedPlayers = players.map((p) => loserIds.includes(p.id) ? { ...p, isEliminated: true } : p);

      return {
        players: updatedPlayers,
        pendingMatches: nextMatches,
        knockoutRounds: [...knockoutRounds, { round: nextRound, matches: nextMatches.map((m) => ({ ...m })) }],
        gamePhase: 'tournament_overview',
      };
    }),

  // ============================================
  // MAP SELECT → loads next pending match
  // ============================================
  selectMap: (mapId) =>
    set((state) => {
      const { pendingMatches, players } = state;
      if (pendingMatches.length === 0) return {};

      const nextMatch = pendingMatches[0];
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

  // ============================================
  // AWARD DAMAGE + auto KO
  // ============================================
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

      if (!winner) return { currentMatch: newMatch };

      // Remove match from pending, add to completed
      const pending = [...state.pendingMatches];
      const completed = [...state.completedMatches];
      const matchData = pending.shift();
      if (matchData) {
        completed.push({ ...matchData, completed: true, winnerId: winner.id });
      }

      // Update knockout round tracking
      const knockoutRounds = state.knockoutRounds.map((round) => ({
        ...round,
        matches: round.matches.map((rm) =>
          rm.p1Id === m.player1.id && rm.p2Id === m.player2.id && !rm.completed
            ? { ...rm, completed: true, winnerId: winner.id }
            : rm
        ),
      }));

      // Update player stats
      const players = state.players.map((p) => {
        if (p.id === winner.id) return { ...p, wins: p.wins + 1 };
        if (p.id === loserId) return { ...p, losses: p.losses + 1 };
        return p;
      });

      return {
        currentMatch: newMatch,
        players,
        matchWinner: winner,
        gamePhase: 'victory',
        pendingMatches: pending,
        completedMatches: completed,
        knockoutRounds,
      };
    }),

  // ============================================
  // NEXT MATCH → back to tournament overview
  // ============================================
  nextMatch: () =>
    set(() => ({
      gamePhase: 'tournament_overview',
      selectedMap: null,
      matchWinner: null,
      currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
    })),

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
      pools: {},
      poolCount: 0,
      tournamentPhase: 'groups',
      pendingMatches: [],
      completedMatches: [],
      knockoutRounds: [],
      currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
      selectedMap: null,
      matchWinner: null,
      tournamentWinner: null,
      isTournamentOver: false,
      _byePlayerId: null,
    })),
}));

export default useGameStore;
