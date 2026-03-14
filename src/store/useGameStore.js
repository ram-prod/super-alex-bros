import { create } from 'zustand';
import gameData from '../data/gamedata.json';

const createPlayers = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    chosenCharacter: null,
    isEliminated: false,
  }));

const pickNextTwo = (players) => {
  const alive = players.filter((p) => !p.isEliminated);
  if (alive.length < 2) return null;
  return { player1: alive[0], player2: alive[1] };
};

const useGameStore = create((set, get) => ({
  // --- state ---
  gamePhase: 'splash',
  tournamentSize: 11,
  players: createPlayers(11),
  currentTurn: 1, // which player is currently selecting
  currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
  selectedMap: null,
  matchWinner: null,
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

      // If clicking the same character they already have → deselect
      if (player.chosenCharacter === characterId) {
        const players = state.players.map((p) =>
          p.id === playerId ? { ...p, chosenCharacter: null } : p
        );
        return { players };
      }

      // Check if character is taken by someone else
      const takenBy = state.players.find(
        (p) => p.id !== playerId && p.chosenCharacter === characterId
      );
      if (takenBy) return {}; // can't take it

      // Assign new character
      const players = state.players.map((p) =>
        p.id === playerId ? { ...p, chosenCharacter: characterId } : p
      );

      // Auto-advance turn to next player without a character
      const nextUnchosen = players.find((p) => p.id > playerId && !p.chosenCharacter);
      const firstUnchosen = players.find((p) => !p.chosenCharacter);
      const nextTurn = nextUnchosen?.id || firstUnchosen?.id || state.currentTurn;

      // Do NOT auto-change phase — wait for confirmRoster
      return { players, currentTurn: nextTurn };
    }),

  confirmRoster: () =>
    set((state) => {
      const allLocked = state.players.every((p) => p.chosenCharacter !== null);
      if (!allLocked) return {};
      return { gamePhase: 'map_select' };
    }),

  selectMap: (mapId) =>
    set((state) => {
      const pair = pickNextTwo(state.players);
      if (!pair) return {};
      return {
        selectedMap: mapId,
        gamePhase: 'vs_screen',
        currentMatch: { ...pair, p1Damage: 0, p2Damage: 0, activeQuestion: null },
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

      // Instant checkMatchWinner
      if (newP1Damage >= 200) {
        return {
          currentMatch: newMatch,
          players: state.players.map((p) =>
            p.id === m.player1.id ? { ...p, isEliminated: true } : p
          ),
          matchWinner: m.player2,
          gamePhase: 'victory',
        };
      }
      if (newP2Damage >= 200) {
        return {
          currentMatch: newMatch,
          players: state.players.map((p) =>
            p.id === m.player2.id ? { ...p, isEliminated: true } : p
          ),
          matchWinner: m.player1,
          gamePhase: 'victory',
        };
      }

      return { currentMatch: newMatch };
    }),

  nextMatch: () =>
    set((state) => {
      const alive = state.players.filter((p) => !p.isEliminated);
      if (alive.length < 2) {
        return {
          gamePhase: 'victory',
          matchWinner: alive[0] || null,
          currentMatch: { player1: alive[0] || null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
        };
      }
      return {
        gamePhase: 'map_select',
        selectedMap: null,
        matchWinner: null,
        currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
      };
    }),

  goBack: () =>
    set((state) => {
      if (state.gamePhase === 'map_select') return { gamePhase: 'roster_select' };
      if (state.gamePhase === 'roster_select') return { gamePhase: 'splash' };
      return {};
    }),

  resetGame: () =>
    set((state) => ({
      gamePhase: 'splash',
      players: createPlayers(state.tournamentSize),
      currentTurn: 1,
      currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null },
      selectedMap: null,
      matchWinner: null,
    })),
}));

export default useGameStore;
