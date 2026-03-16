import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

// Check if a slot is a string placeholder (not a resolved player ID)
const isPlaceholder = (id) => typeof id === 'string';
// Check if a match is fully resolved (both slots are real player IDs — numbers)
const isResolved = (m) => typeof m.p1Id === 'number' && typeof m.p2Id === 'number';

// ============================================
// BRACKET LOOKUP TABLE
// ============================================
const BRACKET_CONFIG = {
  2:  { base: 'Final', prelims: 0, byes: 0, wildcards: 0 },
  3:  { base: 'Final', prelims: 1, byes: 1, wildcards: 0 },
  4:  { base: 'SF',    prelims: 0, byes: 0, wildcards: 0 },
  5:  { base: 'SF',    prelims: 2, byes: 1, wildcards: 1 },
  6:  { base: 'SF',    prelims: 3, byes: 0, wildcards: 1 },
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

const roundsFrom = (base) => {
  const idx = ROUND_ORDER.indexOf(base);
  return ROUND_ORDER.slice(idx);
};

// Replace a placeholder string anywhere it appears in the bracket
const replacePlaceholder = (rounds, placeholder, realId) =>
  rounds.map((r) => ({
    ...r,
    matches: r.matches.map((m) => ({
      ...m,
      p1Id: m.p1Id === placeholder ? realId : m.p1Id,
      p2Id: m.p2Id === placeholder ? realId : m.p2Id,
    })),
  }));

const useGameStore = create(
  persist(
    (set, get) => ({
  // --- state ---
  gamePhase: 'splash',
  tournamentSize: 11,
  players: createPlayers(11),
  currentTurn: 1,

  // Tournament structure
  bracketStage: 'prelims', // 'prelims' | 'wildcards' | 'qf' | 'sf' | 'final'
  pendingMatches: [],
  completedMatches: [],
  knockoutRounds: [],      // [{ round, matches }] — FULL pre-generated tree with placeholders

  // Bachelor's 8 specifics
  vipPlayerId: null,        // Players with automatic byes
  wildcardCandidates: [],  // Loser IDs from prelims
  selectedWildcards: [],   // Resurrected player IDs
  bracketConfig: null,     // Current BRACKET_CONFIG entry

  // Current battle
  currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null, isFinal: false },
  selectedMap: null,
  matchWinner: null,

  // Audio
  audioResetTick: 0,
  hasSeenIntro: false,
  setHasSeenIntro: () => set({ hasSeenIntro: true }),
  isMusicPlaying: false,
  isMuted: false,
  bgmState: 'paused',
  currentTrack: 'theme',
  startMusic: () => set({ isMusicPlaying: true }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setBgmState: (newState, newTrack) => set((state) => ({ bgmState: newState, currentTrack: newTrack || state.currentTrack })),
  playSFX: (sfxId, vol = 1.0) => { try { const audio = new Audio(`/assets/audio/${sfxId}.mp3`); audio.volume = vol; audio.play().catch(() => {}); } catch (e) {} },

  // Tournament end
  tournamentWinner: null,
  isTournamentOver: false,

  // Data
  characters: gameData.characters,
  maps: gameData.maps,
  questions: gameData.content || [],
  askedQuestionIds: [],

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
      return { gamePhase: 'confirmation' };
    }),

  evaluateVipPhase: () => {
    const state = get();
    const config = BRACKET_CONFIG[state.players.length];
    if (!config) return;
    if (config.byes === 0) {
      set({ vipPlayerId: null });
      get().generateTournament();
      set({ gamePhase: 'tournament_overview' });
    } else {
      const alex = state.players.find((p) => p.chosenCharacter === 'alexander');
      if (alex) {
        set({ vipPlayerId: alex.id, gamePhase: 'vip_reveal' });
      } else {
        set({ gamePhase: 'vip_roulette' });
      }
    }
  },

  // ============================================
  // FIFA-STYLE PRE-DRAWN BRACKET GENERATION
  // ============================================
  generateTournament: () =>
    set((state) => {
      const { players } = state;
      const size = players.length;
      const config = BRACKET_CONFIG[size];
      if (!config) return {};

      // --- VIP (max 1, already set by evaluateVipPhase) ---
      const vipIds = state.vipPlayerId ? [state.vipPlayerId] : [];

      // --- Fighters = everyone not a VIP ---
      const fighterIds = shuffle(players.filter((p) => !vipIds.includes(p.id)).map((p) => p.id));

      // --- Build rounds array ---
      const rounds = [];

      // 1. Prelims (if any) — populated with real fighter IDs
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

      // 2. Build all knockout rounds from base to Final
      const activeRounds = roundsFrom(config.base);

      for (let ri = 0; ri < activeRounds.length; ri++) {
        const roundName = activeRounds[ri];
        const matchCount = ROUND_MATCH_COUNT[roundName] || 1;
        const matches = [];

        if (ri === 0) {
          // === BASE ROUND: build the draw pot with placeholders + real IDs ===
          const drawPot = [];

          if (config.prelims === 0) {
            // No prelims: all players go directly into base round
            drawPot.push(...fighterIds, ...vipIds);
          } else {
            // Prelim winner placeholders
            for (let i = 0; i < config.prelims; i++) {
              drawPot.push(`W_Prelims_${i}`);
            }
            // Wildcard placeholders
            for (let i = 0; i < config.wildcards; i++) {
              drawPot.push(`WC_${i}`);
            }
            // VIP placeholders
            for (let i = 0; i < config.byes; i++) {
              drawPot.push(`VIP_${i}`);
            }
          }

          // THE OFFICIAL DRAW — shuffle the pot!
          const drawnPot = shuffle(drawPot);

          for (let i = 0; i < matchCount; i++) {
            matches.push({
              p1Id: drawnPot[i * 2] ?? null,
              p2Id: drawnPot[i * 2 + 1] ?? null,
              round: roundName,
              label: ROUND_LABELS[roundName]?.(i) || roundName,
              isFinal: roundName === 'Final',
              completed: false,
              winnerId: null,
            });
          }
        } else {
          // === SUBSEQUENT ROUNDS: sequential winner placeholders from previous round ===
          const prevRoundName = activeRounds[ri - 1];
          const prevMatchCount = ROUND_MATCH_COUNT[prevRoundName] || 1;

          for (let i = 0; i < matchCount; i++) {
            matches.push({
              p1Id: `W_${prevRoundName}_${i * 2}`,
              p2Id: `W_${prevRoundName}_${i * 2 + 1}`,
              round: roundName,
              label: ROUND_LABELS[roundName]?.(i) || roundName,
              isFinal: roundName === 'Final',
              completed: false,
              winnerId: null,
            });
          }
        }

        rounds.push({ round: roundName, matches });
      }

      // --- Immediately resolve VIP placeholders ---
      vipIds.forEach((vipId, i) => {
        const placeholder = `VIP_${i}`;
        rounds.forEach((r) => {
          r.matches.forEach((m) => {
            if (m.p1Id === placeholder) m.p1Id = vipId;
            if (m.p2Id === placeholder) m.p2Id = vipId;
          });
        });
      });

      // --- Determine first active stage + pending matches ---
      const firstStage = config.prelims > 0 ? 'prelims' : config.base.toLowerCase();
      const firstRoundName = config.prelims > 0 ? 'Prelims' : config.base;
      const firstRound = rounds.find((r) => r.round === firstRoundName);
      const pending = firstRound
        ? firstRound.matches.filter((m) => isResolved(m) && !m.completed)
        : [];

      return {
        bracketConfig: config,
        // vipPlayerId already set by evaluateVipPhase
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
  // Resolves winner placeholders across the entire bracket
  // ============================================
  advanceTournament: () =>
    set((state) => {
      const { bracketStage, knockoutRounds, players, bracketConfig } = state;
      if (!bracketConfig) return {};

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

      // --- Replace winner placeholders across the ENTIRE bracket ---
      let updatedRounds = [...knockoutRounds.map((r) => ({
        ...r,
        matches: r.matches.map((m) => ({ ...m })),
      }))];

      currentRound.matches.forEach((match, matchIdx) => {
        const placeholder = `W_${currentRoundName}_${matchIdx}`;
        updatedRounds = replacePlaceholder(updatedRounds, placeholder, match.winnerId);
      });

      // --- For prelims without wildcards, also resolve VIP placeholders ---
      if (bracketStage === 'prelims' && bracketConfig.wildcards === 0) {
        (state.vipPlayerId ? [state.vipPlayerId] : []).forEach((vipId, i) => {
          updatedRounds = replacePlaceholder(updatedRounds, `VIP_${i}`, vipId);
        });
      }

      // Eliminate losers
      const updatedPlayers = players.map((p) =>
        loserIds.includes(p.id) ? { ...p, isEliminated: true } : p
      );

      // Find the next round and get resolved pending matches
      const nextRoundIdx = currentRoundIdx + 1;
      if (nextRoundIdx >= updatedRounds.length) return {};

      const nextRoundName = updatedRounds[nextRoundIdx].round;
      const nextStage = nextRoundName.toLowerCase();
      const nextPending = updatedRounds[nextRoundIdx].matches
        .filter((m) => isResolved(m) && !m.completed)
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
  // Resolves ALL placeholders: W_Prelims_*, WC_*, VIP_*
  // ============================================
  executeWildcards: () =>
    set((state) => {
      const { wildcardCandidates, vipPlayerId, players, knockoutRounds, bracketConfig } = state;
      if (!bracketConfig) return {};

      // Pick wildcards from prelim losers
      const shuffledLosers = shuffle([...wildcardCandidates]);
      const selected = shuffledLosers.slice(0, bracketConfig.wildcards);
      const eliminated = shuffledLosers.slice(bracketConfig.wildcards);

      // Eliminate the rest
      const updatedPlayers = players.map((p) =>
        eliminated.includes(p.id) ? { ...p, isEliminated: true } : p
      );

      // Get prelim winners
      const prelimWinnerIds = knockoutRounds
        .find((r) => r.round === 'Prelims')
        ?.matches.filter((m) => m.completed)
        .map((m) => m.winnerId) || [];

      // Resolve ALL placeholders across the entire bracket
      let updatedRounds = knockoutRounds.map((r) => ({
        ...r,
        matches: r.matches.map((m) => ({ ...m })),
      }));

      // Replace W_Prelims_* with actual prelim winners
      prelimWinnerIds.forEach((winnerId, i) => {
        updatedRounds = replacePlaceholder(updatedRounds, `W_Prelims_${i}`, winnerId);
      });

      // Replace WC_* with selected wildcards
      selected.forEach((wcId, i) => {
        updatedRounds = replacePlaceholder(updatedRounds, `WC_${i}`, wcId);
      });

      // Replace VIP_* with actual VIP player IDs
      (vipPlayerId ? [vipPlayerId] : []).forEach((vipId, i) => {
        updatedRounds = replacePlaceholder(updatedRounds, `VIP_${i}`, vipId);
      });

      // Find the base round (QF) and get resolved pending matches
      const baseRound = updatedRounds.find((r) => r.round === bracketConfig.base);
      const pending = baseRound
        ? baseRound.matches.filter((m) => isResolved(m) && !m.completed).map((m) => ({ ...m }))
        : [];

      return {
        players: updatedPlayers,
        selectedWildcards: selected,
        bracketStage: bracketConfig.base.toLowerCase(),
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
    const { currentMatch, setBgmState, questions, askedQuestionIds } = get();
    const track = currentMatch.isFinal ? 'final_game' : 'regular_game';

    // Select random unasked question
    let availableQuestions = questions.filter((q) => !askedQuestionIds.includes(q.id));
    if (availableQuestions.length === 0 && questions.length > 0) {
      availableQuestions = questions;
      set({ askedQuestionIds: [] });
    }
    const randomQ = availableQuestions.length > 0
      ? availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
      : null;

    set((state) => ({
      gamePhase: 'battle',
      currentMatch: { ...currentMatch, activeQuestion: randomQ },
      askedQuestionIds: randomQ ? [...state.askedQuestionIds, randomQ.id] : state.askedQuestionIds,
    }));
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

      // Immediate winner slotting into next round via placeholder resolution
      {
        const stageMap = { prelims: 'Prelims', qf: 'QF', sf: 'SF', final: 'Final' };
        const currentRoundName = stageMap[state.bracketStage];
        const currentRoundIdx = knockoutRounds.findIndex((r) => r.round === currentRoundName);
        if (currentRoundIdx !== -1) {
          const currentMatchIdx = knockoutRounds[currentRoundIdx].matches.findIndex(
            (rm) => rm.p1Id === m.player1.id && rm.p2Id === m.player2.id
          );
          const nextRoundIdx = currentRoundIdx + 1;
          if (knockoutRounds[nextRoundIdx] && currentMatchIdx !== -1) {
            const placeholder = `W_${currentRoundName}_${currentMatchIdx}`;
            // Deep clone and replace placeholder
            const nextRound = { ...knockoutRounds[nextRoundIdx] };
            const nextMatches = nextRound.matches.map((nm) => ({
              ...nm,
              p1Id: nm.p1Id === placeholder ? winner.id : nm.p1Id,
              p2Id: nm.p2Id === placeholder ? winner.id : nm.p2Id,
            }));
            nextRound.matches = nextMatches;
            knockoutRounds[nextRoundIdx] = nextRound;
          }
        }
      }

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
      if (state.gamePhase === 'confirmation') return { gamePhase: 'roster_select' };
      if (state.gamePhase === 'vip_reveal' || state.gamePhase === 'vip_roulette') return { gamePhase: 'confirmation' };
      if (state.gamePhase === 'tournament_overview') return {
        gamePhase: 'roster_select',
        knockoutRounds: [],
        pendingMatches: [],
        completedMatches: [],
        vipPlayerId: null,
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
      tournamentSize: 11,
      players: createPlayers(11),
      audioResetTick: state.audioResetTick + 1,
      hasSeenIntro: false,
      currentTurn: 1,
      bracketStage: 'prelims',
      pendingMatches: [],
      completedMatches: [],
      knockoutRounds: [],
      vipPlayerId: null,
      wildcardCandidates: [],
      selectedWildcards: [],
      bracketConfig: null,
      currentMatch: { player1: null, player2: null, p1Damage: 0, p2Damage: 0, activeQuestion: null, isFinal: false },
      selectedMap: null,
      matchWinner: null,
      tournamentWinner: null,
      isTournamentOver: false,
      askedQuestionIds: [],
      bgmState: 'paused',
      currentTrack: 'theme',
    })),
  }),
  {
    name: 'super-alex-bros-storage',
    partialize: (state) =>
      Object.fromEntries(
        Object.entries(state).filter(
          ([key]) => !['bgmState', 'isMusicPlaying', 'hasSeenIntro'].includes(key)
        )
      ),
  }
  )
);

export default useGameStore;
