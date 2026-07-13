import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import Canvas from '../components/Canvas';
import Chat from '../components/Chat';
import Scoreboard from '../components/Scoreboard';
import BrushToolbar from '../components/BrushToolbar';
import WordPopup from '../components/WordPopup';
import Timer from '../components/Timer';
import { Volume2, VolumeX, ShieldAlert, Send } from 'lucide-react';

export default function Game() {
  const { room, playerId, isHost, playAgain, leaveRoom, correctGuessSoundTrigger, error, messages, sendChatMessage } = useSocket();
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('brush'); // 'brush' | 'eraser' | 'fill'
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileInputText, setMobileInputText] = useState('');
  
  const mobileChatRef = useRef(null);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Scroll mobile chat to bottom on new messages
  useEffect(() => {
    if (mobileChatRef.current) {
      mobileChatRef.current.scrollTop = mobileChatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMobileSubmit = (e) => {
    e.preventDefault();
    if (!mobileInputText.trim() || isArtist) return;
    sendChatMessage(mobileInputText);
    setMobileInputText('');
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
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.36); // C6

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
    <div className="min-h-screen w-full animated-bg text-white p-2 md:p-4 select-none relative flex flex-col justify-between overflow-hidden">
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
      <div className="glass-card p-3 rounded-xl border border-white/10 flex flex-row justify-between items-center gap-2 mb-2 md:mb-4">
        {/* Left: Round, Artist & Room code */}
        <div className="flex items-center gap-2 md:gap-4">
          <div>
            <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Round</span>
            <div className="text-xs md:text-sm font-black text-purple-400">
              {room.gameState.currentRound}/{room.settings.rounds}
            </div>
          </div>
          <div className="h-6 w-px bg-white/15"></div>
          <div>
            <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Artist</span>
            <div className="text-xs md:text-sm font-extrabold text-white truncate max-w-[80px] md:max-w-[120px]">
              {isArtist ? 'You!' : artistName}
            </div>
          </div>
          <div className="h-6 w-px bg-white/15"></div>
          <div className="hidden sm:block">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">Room Code</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-black font-mono tracking-widest text-white">{room.code}</span>
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
        <div className="flex-1 flex justify-center py-1 md:py-2 px-3 md:px-6 bg-black/35 rounded-xl border border-white/5 mx-1 max-w-[180px] sm:max-w-md">
          {room.gameState.status === 'DRAWING' && (
            <span className="text-base md:text-xl font-black font-mono tracking-[0.15em] md:tracking-[0.25em] text-white select-none whitespace-pre truncate">
              {isArtist
                ? room.gameState.currentWord.split('').map(char => char === ' ' ? '   ' : char).join(' ')
                : room.gameState.currentWord.split('').map(char => char === ' ' ? '   ' : char === '_' ? '_ ' : char).join('')}
            </span>
          )}
          {room.gameState.status === 'WORD_SELECTING' && (
            <span className="text-[10px] md:text-xs text-gray-400 italic">Choosing word...</span>
          )}
        </div>

        {/* Right: Actions & Timer */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/5 text-gray-300"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          </button>
          
          <button
            onClick={leaveRoom}
            className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/20 transition-colors"
          >
            Leave
          </button>

          <Timer />
        </div>
      </div>

      {/* Error alert toast */}
      {error && (
        <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] rounded-xl flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* DESKTOP LAYOUT (Hidden on mobile) */}
      {/* ============================================================== */}
      <div className="hidden lg:grid grid-cols-4 gap-4 items-stretch flex-1 min-h-0 mb-4">
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
          <div className="flex-1 min-h-[220px] order-2">
            <Scoreboard />
          </div>
          <div className="flex-1 min-h-[220px] order-1">
            <Chat isArtist={isArtist} />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE LAYOUT (Hidden on desktop) */}
      {/* ============================================================== */}
      <div className="flex lg:hidden flex-col gap-2 overflow-y-auto flex-1">
        {/* Canvas / Whiteboard area */}
        <div className="w-full relative flex flex-col justify-center items-center shrink-0 h-auto">
          <Canvas
            isArtist={isArtist}
            brushColor={brushColor}
            brushSize={brushSize}
            tool={tool}
            setTool={setTool}
          />

          {/* Floating chat bubbles on mobile (Scribble/Skribbl style overlay on right) */}
          <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1 pointer-events-none z-10">
            {messages.slice(-3).map((m) => {
              if (m.type === 'system') return null;
              const isCorrect = m.type === 'correct';
              return (
                <div 
                  key={m.id} 
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md border ${
                    isCorrect 
                      ? 'bg-green-600/90 text-white border-green-500' 
                      : 'bg-black/80 text-gray-200 border-white/10'
                  }`}
                >
                  {!isCorrect && <span className="text-purple-400 font-bold mr-1">{m.sender}:</span>}
                  <span>{m.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BrushToolbar directly under canvas for Artist */}
        {isArtist && (
          <div className="shrink-0 p-1 bg-black/25 rounded-xl border border-white/5">
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

        {/* Split Box: Scoreboard (Left 1/3) & Chat Log (Right 2/3) */}
        <div className="h-[96px] md:h-28 shrink-0 flex border border-white/10 rounded-xl overflow-hidden bg-black/25">
          {/* Scoreboard List */}
          <div className="w-[30%] border-r border-white/10 overflow-y-auto p-1.5 space-y-1 bg-black/10">
            {room.players.map((p) => (
              <div 
                key={p.id} 
                className={`flex items-center gap-1.5 p-1 rounded ${
                  p.id === playerId ? 'bg-purple-600/35 border border-purple-500/50' : 'bg-white/5'
                }`}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-white/10 flex items-center justify-center bg-black/30 text-[9px]">
                  {p.avatar.startsWith('data:image/') ? (
                    <img src={p.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <span>{p.avatar}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-bold truncate leading-tight">{p.name}</div>
                  <div className="text-[8px] text-yellow-400 font-extrabold leading-none">{p.score}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Messages Log */}
          <div ref={mobileChatRef} className="w-[70%] overflow-y-auto p-2 space-y-1 bg-black/20 text-[10px] flex flex-col">
            {messages.map((m) => {
              if (m.type === 'system') {
                return (
                  <div key={m.id} className="text-gray-400 italic">
                    {m.text}
                  </div>
                );
              }
              if (m.type === 'correct') {
                return (
                  <div key={m.id} className="text-green-400 font-bold bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/10">
                    {m.text} 🎉
                  </div>
                );
              }
              return (
                <div key={m.id} className="text-gray-200">
                  <span className="font-bold text-purple-300">{m.sender}:</span> {m.text}
                </div>
              );
            })}
          </div>
        </div>

        {/* Full-width Guess chat input row */}
        {!isArtist ? (
          <form onSubmit={handleMobileSubmit} className="flex gap-2 p-1 bg-black/35 rounded-xl border border-white/10 shrink-0">
            <input
              type="text"
              value={mobileInputText}
              onChange={(e) => setMobileInputText(e.target.value)}
              placeholder="Type your guess here..."
              className="flex-1 bg-transparent border-none text-white px-3 py-2 rounded-lg text-xs md:text-sm w-full placeholder:text-gray-500 focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              disabled={!mobileInputText.trim()}
              className="p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/50 disabled:opacity-50 text-white rounded-lg transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="p-2.5 bg-purple-950/20 text-purple-400 font-bold border border-purple-500/10 text-center text-[10px] rounded-xl shrink-0">
            You are drawing! Draw the word.
          </div>
        )}
      </div>
    </div>
  );
}
