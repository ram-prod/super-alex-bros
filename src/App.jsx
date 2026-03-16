import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useGameStore from './store/useGameStore';
import SplashView from './components/SplashView';
import RosterView from './components/RosterView';
import TournamentBracketView from './components/TournamentBracketView';
import MapSelectView from './components/MapSelectView';
import VsScreenView from './components/VsScreenView';
import BattleView from './components/BattleView';
import VictoryView from './components/VictoryView';
import RulesView from './components/RulesView';
import ConfirmationView from './components/ConfirmationView';
import VipRevealView from './components/VipRevealView';
import VipRouletteView from './components/VipRouletteView';

const views = {
  splash: SplashView,
  roster_select: RosterView,
  tournament_overview: TournamentBracketView,
  map_select: MapSelectView,
  vs_screen: VsScreenView,
  battle: BattleView,
  victory: VictoryView,
  rules: RulesView,
  confirmation: ConfirmationView,
  vip_reveal: VipRevealView,
  vip_roulette: VipRouletteView,
};

function App() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const isBgmMuted = useGameStore((s) => s.isBgmMuted);
  const isSfxMuted = useGameStore((s) => s.isSfxMuted);
  const bgmState = useGameStore((s) => s.bgmState);
  const currentTrack = useGameStore((s) => s.currentTrack);
  const toggleBgmMute = useGameStore((s) => s.toggleBgmMute);
  const toggleSfxMute = useGameStore((s) => s.toggleSfxMute);
  const audioResetTick = useGameStore((s) => s.audioResetTick);
  const audioRef = useRef(null);
  const prevTrackRef = useRef(currentTrack);
  const View = views[gamePhase];

  // Track change: pause old, load new, play
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (prevTrackRef.current !== currentTrack) {
      audio.pause();
      audio.src = `/assets/audio/${currentTrack}.mp3`;
      audio.volume = 0.4;
      if (bgmState === 'playing') audio.play().catch(() => {});
      prevTrackRef.current = currentTrack;
      return; // skip fade logic on track switch — starts at full volume
    }
  }, [currentTrack, bgmState]);

  // BGM fader
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (bgmState === 'paused') {
      audio.pause();
      return;
    }

    if (audio.paused) audio.play().catch(() => {});

    const targetVolume = bgmState === 'faded' ? 0.0 : 0.4;
    const step = bgmState === 'faded' ? -0.04 : 0.04;

    const interval = setInterval(() => {
      let newVol = audio.volume + step;
      if (newVol >= 0.4) { newVol = 0.4; clearInterval(interval); }
      if (newVol <= 0.0) { newVol = 0.0; clearInterval(interval); }
      audio.volume = newVol;
    }, 100);

    return () => clearInterval(interval);
  }, [bgmState]);

  // Audio reset (on game reset)
  useEffect(() => {
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, [audioResetTick]);

  // Global button click SFX
  useEffect(() => {
    const handler = (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const sfxType = btn.dataset.sound;
      if (sfxType === 'epic') {
        useGameStore.getState().playSFX('click_epic', 1.0);
      } else if (sfxType === 'special') {
        useGameStore.getState().playSFX('click_special', 0.8);
      } else {
        useGameStore.getState().playSFX('click', 1.0);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Mute toggle
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isBgmMuted;
  }, [isBgmMuted]);

  return (
    <>
      <audio ref={audioRef} src={`/assets/audio/${currentTrack}.mp3`} loop />

      <AnimatePresence mode="wait">
        <motion.div
          key={gamePhase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {View ? <View /> : null}
        </motion.div>
      </AnimatePresence>

      {bgmState !== 'paused' && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-2 group">
          {/* Expanded Menu (Shows on Hover) */}
          <div className="flex flex-col gap-2 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 bg-black/80 backdrop-blur-md border border-white/20 rounded-full p-2 shadow-xl">
            <button onClick={toggleBgmMute}
              className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-xl transition-colors"
              title="Toggle Music">
              {isBgmMuted ? '🔇' : '🎵'}
            </button>
            <button onClick={toggleSfxMute}
              className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-xl transition-colors"
              title="Toggle Sound Effects">
              {isSfxMuted ? '🔕' : '💥'}
            </button>
          </div>
          {/* Main Icon */}
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-2xl flex items-center justify-center cursor-pointer shadow-lg group-hover:bg-black/80 transition-colors">
            {isBgmMuted && isSfxMuted ? '🔇' : '🔊'}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
