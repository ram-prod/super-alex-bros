import useGameStore from './store/useGameStore';
import SplashView from './components/SplashView';
import RosterView from './components/RosterView';
import MapSelectView from './components/MapSelectView';

function App() {
  const {
    gamePhase, players, currentMatch, selectedMap, maps, matchWinner,
    startBattle, awardDamage, nextMatch, resetGame,
  } = useGameStore();

  if (gamePhase === 'splash') return <SplashView />;
  if (gamePhase === 'roster_select') return <RosterView />;
  if (gamePhase === 'map_select') return <MapSelectView />;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-mono">
      <h1 className="text-4xl font-bold text-yellow-400 mb-2">⚡ Super Alex Bros</h1>
      <p className="text-lg mb-6">
        Phase: <span className="text-cyan-400 font-bold">{gamePhase}</span>
        {selectedMap && <> | Map: <span className="text-green-400">{selectedMap}</span></>}
      </p>

      {/* VS Screen */}
      {gamePhase === 'vs_screen' && currentMatch.player1 && (
        <div className="mb-6 text-center">
          <h2 className="text-3xl text-red-400 font-bold mb-4">
            {currentMatch.player1.name} ⚔️ {currentMatch.player2.name}
          </h2>
          <button onClick={startBattle}
            className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg text-xl font-bold">
            START BATTLE
          </button>
        </div>
      )}

      {/* Battle */}
      {gamePhase === 'battle' && currentMatch.player1 && (
        <div className="mb-6">
          <h2 className="text-xl mb-3 text-yellow-300">Battle!</h2>
          <div className="flex gap-8 justify-center text-center">
            {[['player1', 'p1Damage'], ['player2', 'p2Damage']].map(([pk, dk]) => (
              <div key={pk} className="bg-gray-900 rounded-lg p-4 w-48">
                <div className="font-bold text-lg">{currentMatch[pk].name}</div>
                <div className="text-3xl my-2">{currentMatch[dk]}%</div>
                <button
                  onClick={() => awardDamage(currentMatch[pk].id)}
                  className="bg-orange-600 hover:bg-orange-500 px-3 py-1 rounded text-sm mt-1"
                >
                  +100% dmg
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Victory */}
      {gamePhase === 'victory' && (
        <div className="text-center mb-6">
          {matchWinner && players.filter((p) => !p.isEliminated).length <= 1 ? (
            <h2 className="text-4xl text-yellow-400 font-bold">🏆 {matchWinner.name} WINS THE TOURNAMENT!</h2>
          ) : matchWinner ? (
            <h2 className="text-3xl text-green-400 font-bold">🎉 {matchWinner.name} wins the round!</h2>
          ) : (
            <h2 className="text-3xl text-green-400 font-bold">🎉 Round over!</h2>
          )}
          <div className="flex gap-3 justify-center mt-4">
            <button onClick={nextMatch}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold">Next Match</button>
            <button onClick={resetGame}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">Reset Game</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
