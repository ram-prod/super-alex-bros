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
  const isMuted = useGameStore((s) => s.isMuted);
  const bgmState = useGameStore((s) => s.bgmState);
  const currentTrack = useGameStore((s) => s.currentTrack);
  const toggleMute = useGameStore((s) => s.toggleMute);
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
      const sfx = btn.dataset.sound === 'special' ? 'click_special' : 'click';
      useGameStore.getState().playSFX(sfx);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Mute toggle
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = isMuted;
  }, [isMuted]);

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
        <button
          onClick={toggleMute}
          className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-2xl flex items-center justify-center hover:bg-black/80 transition-colors"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      )}
    </>
  );
}

export default App;
