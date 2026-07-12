import React from 'react';
import { useSocket } from './contexts/SocketContext';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Results from './pages/Results';

function AppContent() {
  const { room } = useSocket();

  if (!room) {
    return <Home />;
  }

  const { status } = room.gameState;

  switch (status) {
    case 'LOBBY':
      return <Lobby />;
    case 'WORD_SELECTING':
    case 'DRAWING':
    case 'ROUND_END':
      return <Game />;
    case 'GAME_END':
      return <Results />;
    default:
      return <Home />;
  }
}

export default function App() {
  return <AppContent />;
}
