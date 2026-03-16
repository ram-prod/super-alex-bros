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
  }));

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ============================================
// BRACKET LOOKUP TABLE
// prelims  = number of prelim matches
// byes     = players who skip to the base round
// wildcards = losers resurrected from prelims
// base     = first "real" knockout round
//
// Math check for every N:
//   fighters_in_prelims = prelims * 2
//   fighters_in_prelims + byes = N
//   prelim_winners + byes + wildcards = slots in base round
// ============================================
const BRACKET_CONFIG = {
  2:  { base: 'Final', prelims: 0, byes: 0, wildcards: 0 },
  3:  { base: 'Final', prelims: 1, byes: 1, wildcards: 0 },
  4:  { base: 'SF',    prelims: 0, byes: 0, wildcards: 0 },
  5:  { base: 'SF',    prelims: 1, byes: 3, wildcards: 0 },
  6:  { base: 'SF',    prelims: 2, byes: 2, wildcards: 0 },
  7:  { base: 'SF',    prelims: 3, byes: 1, wildcards: 0 },
  8:  { base: 'QF',    prelims: 0, byes: 0, wildcards: 0 },
  9:  { base: 'QF',    prelims: 4, byes: 1, wildcards: 3 },
  10: { base: 'QF',    prelims: 5, byes: 0, wildcards: 3 },
  11: { base: 'QF',    prelims: 5, byes: 1, wildcards: 2 },
};

const ROUND_ORDER = ['Prelims', 'QF', 'SF', 'Final'];
const ROUND_MATCH_COUNT = { QF: 4, SF: 2, Final: 1 };
const ROUND_LABELS = {
  QF: (i) => `Quarter Final ${i + 1}`,
  SF: (i) => `Semi Final ${i + 1}`,
  Final: () => 'GRAND FINAL',
};

// Build empty matches for a round
const emptyMatches = (round, count) =>
  Array.from({ length: count }, (_, i) => ({
    p1Id: null,
    p2Id: null,
    round,
    label: ROUND_LABELS[round]?.(i) || round,
    isFinal: round === 'Final',
    completed: false,
    winnerId: null,
  }));

// Get rounds that come after a given base (inclusive)
const roundsFrom = (base) => {
  const idx = ROUND_ORDER.indexOf(base);
  return ROUND_ORDER.slice(idx);
};

const useGameStore = create((set, get) => ({
  // --- state ---
  gamePhase: 'splash',
  tournamentSize: 11,
  players: createPlayers(11),
  currentTurn: 1,

  // Tournament structure
  bracketStage: 'prelims', // 'prelims' | 'wildcards' | 'qf' | 'sf' | 'final'
  pendingMatches: [],
  completedMatches: [],
  knockoutRounds: [],      // [{ round, matches }] — FULL pre-generated tree

  // Bachelor's 8 specifics
  vipPlayerIds: [],        // Players with automatic byes
  wildcardCandidates: [],  // Loser IDs from prelims
  selectedWildcards: [],   // Resurrected player IDs
  bracketConfig: null,     // Current BRACKET_CONFIG entry

  // Current battle
  currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null, isFinal: false },
  selectedMap: null,
  matchWinner: null,

  // Audio
  isMusicPlaying: false,
  isMuted: false,
  bgmState: 'paused',
  currentTrack: 'theme',
  startMusic: () => set({ isMusicPlaying: true }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setBgmState: (newState, newTrack) => set((state) => ({ bgmState: newState, currentTrack: newTrack || state.currentTrack })),
  playSFX: (sfxId) => { try { const audio = new Audio(`/assets/audio/${sfxId}.mp3`); audio.volume = 1.0; audio.play().catch(() => {}); } catch (e) {} },

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
  // FULL BRACKET GENERATION
  // ============================================
  generateTournament: () =>
    set((state) => {
      const { players } = state;
      const size = players.length;
      const config = BRACKET_CONFIG[size];
      if (!config) return {};

      // --- Identify VIPs (bye players) ---
      const alex = players.find((p) => p.chosenCharacter === 'alexander');
      const vipIds = [];

      if (config.byes > 0) {
        // Alexander is always first VIP if present
        if (alex) vipIds.push(alex.id);
        // Fill remaining byes randomly from non-alexander players
        const nonAlexIds = shuffle(players.filter((p) => p.id !== alex?.id).map((p) => p.id));
        while (vipIds.length < config.byes) {
          vipIds.push(nonAlexIds.shift());
        }
      }

      // --- Fighters = everyone not a VIP ---
      const fighterIds = shuffle(players.filter((p) => !vipIds.includes(p.id)).map((p) => p.id));

      // --- Build full knockoutRounds tree ---
      const rounds = [];

      // Prelims (if any)
      if (config.prelims > 0) {
        const prelimMatches = [];
        for (let i = 0; i < config.prelims; i++) {
          prelimMatches.push({
            p1Id: fighterIds[i * 2],
            p2Id: fighterIds[i * 2 + 1],
            round: 'Prelims',
            label: `Prelim ${i + 1}`,
            isFinal: false,
            completed: false,
            winnerId: null,
          });
        }
        rounds.push({ round: 'Prelims', matches: prelimMatches });
      }

      // Base round + subsequent rounds (all empty initially)
      const activeRounds = roundsFrom(config.base);
      for (const roundName of activeRounds) {
        const matchCount = ROUND_MATCH_COUNT[roundName] || 1;
        rounds.push({ round: roundName, matches: emptyMatches(roundName, matchCount) });
      }

      // --- If NO prelims, place all fighters directly into base round ---
      if (config.prelims === 0) {
        const allIds = shuffle([...fighterIds, ...vipIds]);
        const baseRound = rounds.find((r) => r.round === config.base);
        for (let i = 0; i < baseRound.matches.length; i++) {
          baseRound.matches[i].p1Id = allIds[i * 2];
          baseRound.matches[i].p2Id = allIds[i * 2 + 1];
        }
      }

      // --- If prelims exist but NO wildcards, place byes into base round ---
      // (for N=3,5,6,7: prelim winners will be slotted by advanceTournament)
      if (config.prelims > 0 && config.wildcards === 0 && config.byes > 0) {
        const baseRound = rounds.find((r) => r.round === config.base);
        // Place byes into alternating empty slots to spread them across matches
        let byeIdx = 0;
        for (let m = 0; m < baseRound.matches.length && byeIdx < vipIds.length; m++) {
          // Fill p1 slot first, skip if we want to spread
          if (baseRound.matches[m].p1Id === null) {
            baseRound.matches[m].p1Id = vipIds[byeIdx++];
          } else if (baseRound.matches[m].p2Id === null) {
            baseRound.matches[m].p2Id = vipIds[byeIdx++];
          }
        }
      }

      // --- Determine first active stage + pending matches ---
      const firstStage = config.prelims > 0 ? 'prelims' : config.base.toLowerCase();
      const firstRound = rounds.find((r) =>
        r.round === (config.prelims > 0 ? 'Prelims' : config.base)
      );
      const pending = firstRound ? firstRound.matches.filter((m) => m.p1Id && m.p2Id && !m.completed) : [];

      return {
        bracketConfig: config,
        vipPlayerIds: vipIds,
        bracketStage: firstStage,
        knockoutRounds: rounds,
        pendingMatches: pending.map((m) => ({ ...m })),
        completedMatches: [],
        wildcardCandidates: [],
        selectedWildcards: [],
        isTournamentOver: false,
        tournamentWinner: null,
        players: players.map((p) => ({ ...p, wins: 0, losses: 0, isEliminated: false })),
      };
    }),

  // ============================================
  // ADVANCE TOURNAMENT
  // Fills winners into next round's empty slots
  // ============================================
  advanceTournament: () =>
    set((state) => {
      const { bracketStage, knockoutRounds, players, bracketConfig } = state;
      if (!bracketConfig) return {};

      // Map bracketStage to round name
      const stageToRound = { prelims: 'Prelims', qf: 'QF', sf: 'SF', final: 'Final' };
      const currentRoundName = stageToRound[bracketStage];
      const currentRoundIdx = knockoutRounds.findIndex((r) => r.round === currentRoundName);
      if (currentRoundIdx === -1) return {};

      const currentRound = knockoutRounds[currentRoundIdx];
      const allDone = currentRound.matches.every((m) => m.completed);
      if (!allDone) return {};

      const winnerIds = currentRound.matches.map((m) => m.winnerId);
      const loserIds = currentRound.matches.map((m) => m.winnerId === m.p1Id ? m.p2Id : m.p1Id);

      // --- PRELIMS with wildcards: pause for roulette ---
      if (bracketStage === 'prelims' && bracketConfig.wildcards > 0) {
        return {
          bracketStage: 'wildcards',
          wildcardCandidates: loserIds,
          pendingMatches: [],
        };
      }

      // --- FINAL: tournament over ---
      if (bracketStage === 'final') {
        const winner = players.find((p) => p.id === winnerIds[0]);
        return { isTournamentOver: true, tournamentWinner: winner };
      }

      // --- Standard advance: fill winners into next round ---
      const nextRoundIdx = currentRoundIdx + 1;
      if (nextRoundIdx >= knockoutRounds.length) return {};

      const updatedRounds = knockoutRounds.map((r, i) => {
        if (i !== nextRoundIdx) return r;

        const nextMatches = r.matches.map((m) => ({ ...m }));

        // Queue-based slot filling: winners fill empty slots left-to-right
        const winnersQueue = [...winnerIds];
        nextMatches.forEach((m) => {
          if (m.p1Id === null && winnersQueue.length > 0) m.p1Id = winnersQueue.shift();
          if (m.p2Id === null && winnersQueue.length > 0) m.p2Id = winnersQueue.shift();
        });

        return { ...r, matches: nextMatches };
      });

      // Eliminate losers
      const updatedPlayers = players.map((p) =>
        loserIds.includes(p.id) ? { ...p, isEliminated: true } : p
      );

      // Determine next stage
      const nextRoundName = updatedRounds[nextRoundIdx].round;
      const nextStage = nextRoundName.toLowerCase(); // 'qf' | 'sf' | 'final'

      // Pending = next round's matches that have both players filled
      const nextPending = updatedRounds[nextRoundIdx].matches
        .filter((m) => m.p1Id && m.p2Id && !m.completed)
        .map((m) => ({ ...m }));

      return {
        players: updatedPlayers,
        bracketStage: nextStage,
        knockoutRounds: updatedRounds,
        pendingMatches: nextPending,
        gamePhase: 'tournament_overview',
      };
    }),

  // ============================================
  // WILDCARD ROULETTE
  // ============================================
  executeWildcards: () =>
    set((state) => {
      const { wildcardCandidates, vipPlayerIds, players, knockoutRounds, bracketConfig } = state;
      if (!bracketConfig) return {};

      // Pick wildcards from prelim losers
      const shuffledLosers = shuffle([...wildcardCandidates]);
      const selected = shuffledLosers.slice(0, bracketConfig.wildcards);
      const eliminated = shuffledLosers.slice(bracketConfig.wildcards);

      // Eliminate the rest
      const updatedPlayers = players.map((p) =>
        eliminated.includes(p.id) ? { ...p, isEliminated: true } : p
      );

      // Gather all players for the QF round
      const prelimWinnerIds = knockoutRounds
        .find((r) => r.round === 'Prelims')
        ?.matches.filter((m) => m.completed)
        .map((m) => m.winnerId) || [];

      const qfPlayerIds = shuffle([...prelimWinnerIds, ...vipPlayerIds, ...selected]);

      // Fill the QF round slots
      const updatedRounds = knockoutRounds.map((r) => {
        if (r.round !== 'QF') return r;
        const matches = r.matches.map((m, i) => ({
          ...m,
          p1Id: qfPlayerIds[i * 2] || null,
          p2Id: qfPlayerIds[i * 2 + 1] || null,
        }));
        return { ...r, matches };
      });

      const qfRound = updatedRounds.find((r) => r.round === 'QF');
      const pending = qfRound
        ? qfRound.matches.filter((m) => m.p1Id && m.p2Id && !m.completed).map((m) => ({ ...m }))
        : [];

      return {
        players: updatedPlayers,
        selectedWildcards: selected,
        bracketStage: 'qf',
        knockoutRounds: updatedRounds,
        pendingMatches: pending,
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
        currentMatch: { player1, player2, p1Damage: 0, p2Damage: 0, activeQuestion: null, isFinal: !!nextMatch.isFinal },
        matchWinner: null,
      };
    }),

  startBattle: () => {
    const { currentMatch, setBgmState } = get();
    const track = currentMatch.isFinal ? 'final_game' : 'regular_game';
    set({ gamePhase: 'battle' });
    setBgmState('playing', track);
  },

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
      bgmState: 'playing',
      currentTrack: 'theme',
      currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null, isFinal: false },
    })),

  goBack: () =>
    set((state) => {
      if (state.gamePhase === 'map_select') return { gamePhase: 'tournament_overview' };
      if (state.gamePhase === 'tournament_overview') return {
        gamePhase: 'roster_select',
        knockoutRounds: [],
        pendingMatches: [],
        completedMatches: [],
        vipPlayerIds: [],
        wildcardCandidates: [],
        selectedWildcards: [],
        bracketConfig: null,
        bracketStage: 'prelims',
      };
      if (state.gamePhase === 'roster_select') return { gamePhase: 'splash' };
      return {};
    }),

  resetGame: () =>
    set((state) => ({
      gamePhase: 'splash',
      players: createPlayers(state.tournamentSize),
      currentTurn: 1,
      bracketStage: 'prelims',
      pendingMatches: [],
      completedMatches: [],
      knockoutRounds: [],
      vipPlayerIds: [],
      wildcardCandidates: [],
      selectedWildcards: [],
      bracketConfig: null,
      currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null, isFinal: false },
      selectedMap: null,
      matchWinner: null,
      tournamentWinner: null,
      isTournamentOver: false,
      bgmState: 'paused',
      currentTrack: 'theme',
    })),
}));

export default useGameStore;
