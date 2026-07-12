import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import Canvas from '../components/Canvas';
import Chat from '../components/Chat';
import Scoreboard from '../components/Scoreboard';
import BrushToolbar from '../components/BrushToolbar';
import WordPopup from '../components/WordPopup';
import Timer from '../components/Timer';
import { Volume2, VolumeX, ShieldAlert } from 'lucide-react';

export default function Game() {
  const { room, playerId, isHost, playAgain, leaveRoom, correctGuessSoundTrigger, error } = useSocket();
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('brush'); // 'brush' | 'eraser' | 'fill'
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!room) return null;

  const isArtist = room.gameState.currentArtist === playerId;
  const artistName = room.players.find(p => p.id === room.gameState.currentArtist)?.name || 'Someone';

  // 1. Play Correct Guess ding sound
  useEffect(() => {
    if (correctGuessSoundTrigger > 0 && !isMuted) {
      playCorrectSound();
    }
  }, [correctGuessSoundTrigger]);

  // 2. Play Round End chime sound
  useEffect(() => {
    if (room.gameState.status === 'ROUND_END' && !isMuted) {
      playRoundEndSound();
    }
  }, [room.gameState.status]);

  const playCorrectSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  };

  const playRoundEndSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(392.00, audioCtx.currentTime); // G4
      osc.frequency.setValueAtTime(329.63, audioCtx.currentTime + 0.15); // E4
      osc.frequency.setValueAtTime(261.63, audioCtx.currentTime + 0.3); // C4

      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen w-full animated-bg text-white p-4 select-none relative flex flex-col justify-between">
      {/* Word selection overlay */}
      <WordPopup isArtist={isArtist} />

      {/* Round End display overlay */}
      {room.gameState.status === 'ROUND_END' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-purple-500/30 text-center shadow-2xl">
            <h2 className="text-xl font-extrabold text-purple-400 tracking-wider mb-2 uppercase">Round Complete</h2>
            <p className="text-xs text-gray-400 uppercase mb-6">The word was:</p>
            <h1 className="text-4xl font-black text-yellow-400 tracking-widest uppercase mb-8 border-y border-white/10 py-3">
              {room.gameState.currentWord}
            </h1>
            <p className="text-sm text-gray-300">
              Next round starting in <span className="text-purple-400 font-bold">{room.gameState.timer}s</span>
            </p>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="glass-card p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        {/* Left: Round & Artist */}
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Round</span>
            <div className="text-lg font-black text-purple-400">
              {room.gameState.currentRound} / {room.settings.rounds}
            </div>
          </div>
          <div className="h-8 w-px bg-white/15"></div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Drawing Artist</span>
            <div className="text-sm font-extrabold text-white truncate max-w-[120px]">
              {isArtist ? 'You!' : artistName}
            </div>
          </div>
          <div className="h-8 w-px bg-white/15"></div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Room Code</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-black font-mono tracking-widest text-white">{room.code}</span>
              <button
                onClick={copyRoomCode}
                className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 active:scale-95 transition text-[9px] font-bold rounded border border-white/10 text-purple-300"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Secret word hints */}
        <div className="flex-1 flex justify-center py-2 px-6 bg-black/35 rounded-xl border border-white/5 mx-2 max-w-md">
          {room.gameState.status === 'DRAWING' && (
            <span className="text-xl md:text-2xl font-black font-mono tracking-[0.25em] text-white select-none whitespace-pre">
              {isArtist
                ? room.gameState.currentWord.split('').map(char => char === ' ' ? '   ' : char).join(' ')
                : room.gameState.currentWord.split('').map(char => char === ' ' ? '   ' : char === '_' ? '_ ' : char).join('')}
            </span>
          )}
          {room.gameState.status === 'WORD_SELECTING' && (
            <span className="text-sm text-gray-400 italic">Selecting word...</span>
          )}
        </div>

        {/* Right: Audio Control, Reset Lobby, Leave Game & Timer */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/5 text-gray-300"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          {isHost && (
            <button
              onClick={playAgain}
              className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-lg border border-yellow-500/20 transition-colors"
              title="Return all players to lobby"
            >
              Reset Lobby
            </button>
          )}
          
          <button
            onClick={leaveRoom}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-colors"
          >
            Leave Game
          </button>

          <Timer />
        </div>
      </div>

      {/* Error alert toast */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Canvas & Sidebar Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch mb-4">
        {/* Canvas area (Col span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex-1">
            <Canvas
              isArtist={isArtist}
              brushColor={brushColor}
              brushSize={brushSize}
              tool={tool}
              setTool={setTool}
            />
          </div>
          {/* Toolbar overlay at bottom of canvas (Only for drawing artist) */}
          {isArtist && (
            <div className="block">
              <BrushToolbar
                brushColor={brushColor}
                setBrushColor={setBrushColor}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                tool={tool}
                setTool={setTool}
              />
            </div>
          )}
        </div>

        {/* Sidebar logs: Scoreboard and Chat (Col span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex-1 min-h-[220px] order-2 lg:order-1">
            <Scoreboard />
          </div>
          <div className="flex-1 min-h-[220px] order-1 lg:order-2">
            <Chat isArtist={isArtist} />
          </div>
        </div>
      </div>
    </div>
  );
}
