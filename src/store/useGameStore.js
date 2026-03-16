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
  knockoutRounds: [],      // [{ round, matches }]

  // Bachelor's 8 specifics
  vipPlayerId: null,
  wildcardCandidates: [],  // loser IDs from prelims
  selectedWildcards: [],   // the 2 resurrected player IDs

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
  // BACHELOR'S 8 TOURNAMENT GENERATION
  // ============================================
  generateTournament: () =>
    set((state) => {
      const { players } = state;

      // Find VIP (alexander) or pick random
      const vipPlayer = players.find((p) => p.chosenCharacter === 'alexander');
      const vipId = vipPlayer ? vipPlayer.id : shuffle(players.map((p) => p.id))[0];

      // Remaining 10 fighters
      const fighterIds = shuffle(players.filter((p) => p.id !== vipId).map((p) => p.id));

      // Create 5 Prelim matches
      const prelimMatches = [];
      for (let i = 0; i < fighterIds.length; i += 2) {
        prelimMatches.push({
          p1Id: fighterIds[i],
          p2Id: fighterIds[i + 1],
          round: 'Prelims',
          label: `Prelim ${Math.floor(i / 2) + 1}`,
          isFinal: false,
          completed: false,
          winnerId: null,
        });
      }

      return {
        vipPlayerId: vipId,
        bracketStage: 'prelims',
        pendingMatches: [...prelimMatches],
        completedMatches: [],
        knockoutRounds: [{ round: 'Prelims', matches: prelimMatches.map((m) => ({ ...m })) }],
        wildcardCandidates: [],
        selectedWildcards: [],
        isTournamentOver: false,
        tournamentWinner: null,
        players: players.map((p) => ({ ...p, wins: 0, losses: 0, isEliminated: false })),
      };
    }),

  // ============================================
  // ADVANCE TOURNAMENT (called after all pending matches complete)
  // ============================================
  advanceTournament: () =>
    set((state) => {
      const { bracketStage, knockoutRounds, players } = state;

      // Get latest round results
      const lastRound = knockoutRounds[knockoutRounds.length - 1];
      if (!lastRound) return {};

      const completedInRound = lastRound.matches.filter((m) => m.completed);
      const winnerIds = completedInRound.map((m) => m.winnerId);
      const loserIds = completedInRound.map((m) => m.winnerId === m.p1Id ? m.p2Id : m.p1Id);

      if (bracketStage === 'prelims') {
        // Move losers to wildcard candidates — do NOT eliminate yet
        return {
          bracketStage: 'wildcards',
          wildcardCandidates: loserIds,
          pendingMatches: [],
        };
      }

      if (bracketStage === 'qf') {
        // Eliminate QF losers, generate 2 SF matches
        const updatedPlayers = players.map((p) =>
          loserIds.includes(p.id) ? { ...p, isEliminated: true } : p
        );
        const shuffledWinners = shuffle(winnerIds);
        const sfMatches = [
          { p1Id: shuffledWinners[0], p2Id: shuffledWinners[1], round: 'SF', label: 'Semi Final 1', isFinal: false, completed: false, winnerId: null },
          { p1Id: shuffledWinners[2], p2Id: shuffledWinners[3], round: 'SF', label: 'Semi Final 2', isFinal: false, completed: false, winnerId: null },
        ];
        return {
          players: updatedPlayers,
          bracketStage: 'sf',
          pendingMatches: [...sfMatches],
          knockoutRounds: [...knockoutRounds, { round: 'SF', matches: sfMatches.map((m) => ({ ...m })) }],
          gamePhase: 'tournament_overview',
        };
      }

      if (bracketStage === 'sf') {
        // Eliminate SF losers, generate Final
        const updatedPlayers = players.map((p) =>
          loserIds.includes(p.id) ? { ...p, isEliminated: true } : p
        );
        const finalMatch = {
          p1Id: winnerIds[0], p2Id: winnerIds[1], round: 'Final', label: 'GRAND FINAL', isFinal: true, completed: false, winnerId: null,
        };
        return {
          players: updatedPlayers,
          bracketStage: 'final',
          pendingMatches: [{ ...finalMatch }],
          knockoutRounds: [...knockoutRounds, { round: 'Final', matches: [{ ...finalMatch }] }],
          gamePhase: 'tournament_overview',
        };
      }

      if (bracketStage === 'final') {
        const winner = players.find((p) => p.id === winnerIds[0]);
        return {
          isTournamentOver: true,
          tournamentWinner: winner,
        };
      }

      return {};
    }),

  // ============================================
  // WILDCARD ROULETTE
  // ============================================
  executeWildcards: () =>
    set((state) => {
      const { wildcardCandidates, vipPlayerId, players, knockoutRounds } = state;

      // Pick 2 random wildcards from the 5 prelim losers
      const shuffled = shuffle([...wildcardCandidates]);
      const selected = shuffled.slice(0, 2);
      const eliminated = shuffled.slice(2);

      // Eliminate the 3 who didn't make it
      const updatedPlayers = players.map((p) =>
        eliminated.includes(p.id) ? { ...p, isEliminated: true } : p
      );

      // 8 players: 5 prelim winners + 1 VIP + 2 wildcards
      const prelimWinnerIds = knockoutRounds
        .find((r) => r.round === 'Prelims')
        ?.matches.filter((m) => m.completed)
        .map((m) => m.winnerId) || [];

      const qfPlayerIds = shuffle([...prelimWinnerIds, vipPlayerId, ...selected]);

      // Generate 4 QF matches
      const qfMatches = [];
      for (let i = 0; i < qfPlayerIds.length; i += 2) {
        qfMatches.push({
          p1Id: qfPlayerIds[i],
          p2Id: qfPlayerIds[i + 1],
          round: 'QF',
          label: `Quarter Final ${Math.floor(i / 2) + 1}`,
          isFinal: false,
          completed: false,
          winnerId: null,
        });
      }

      return {
        players: updatedPlayers,
        selectedWildcards: selected,
        bracketStage: 'qf',
        pendingMatches: [...qfMatches],
        knockoutRounds: [...knockoutRounds, { round: 'QF', matches: qfMatches.map((m) => ({ ...m })) }],
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
      if (state.gamePhase === 'tournament_overview') return { gamePhase: 'roster_select' };
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
      vipPlayerId: null,
      wildcardCandidates: [],
      selectedWildcards: [],
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
