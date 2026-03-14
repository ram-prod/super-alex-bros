import { AnimatePresence, motion } from 'framer-motion';
import useGameStore from './store/useGameStore';
import SplashView from './components/SplashView';
import RosterView from './components/RosterView';
import TournamentBracketView from './components/TournamentBracketView';
import MapSelectView from './components/MapSelectView';
import VsScreenView from './components/VsScreenView';
import BattleView from './components/BattleView';
import VictoryView from './components/VictoryView';

const views = {
  splash: SplashView,
  roster_select: RosterView,
  tournament_overview: TournamentBracketView,
  map_select: MapSelectView,
  vs_screen: VsScreenView,
  battle: BattleView,
  victory: VictoryView,
};

function App() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const View = views[gamePhase];

  return (
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
  );
}

export default App;
