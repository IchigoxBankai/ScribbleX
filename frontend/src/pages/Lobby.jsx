import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../contexts/SocketContext';
import { Play, LogOut, Crown, Trash2, ShieldAlert } from 'lucide-react';

export default function Lobby() {
  const { room, playerId, isHost, startGame, updateSettings, leaveRoom, kickPlayer, error } = useSocket();

  const [categories, setCategories] = useState([]);
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    fetch(`${backendUrl}/api/categories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  if (!room) return null;

  const handleStartGame = () => {
    startGame();
  };

  const handleMaxPlayersChange = (e) => {
    updateSettings({ maxPlayers: parseInt(e.target.value) });
  };

  const handleRoundsChange = (e) => {
    updateSettings({ rounds: parseInt(e.target.value) });
  };

  const handleDrawTimeChange = (e) => {
    updateSettings({ drawTime: parseInt(e.target.value) });
  };

  const handleHintTimeChange = (e) => {
    updateSettings({ hintTime: parseInt(e.target.value) });
  };

  const handleWordChoicesCountChange = (e) => {
    updateSettings({ wordChoicesCount: parseInt(e.target.value) });
  };

  const toggleCategory = (cat) => {
    const current = room.settings.selectedCategories;
    let next;
    if (current.includes(cat)) {
      if (current.length > 1) {
        next = current.filter(c => c !== cat);
      } else {
        return; // at least 1 must be selected
      }
    } else {
      next = [...current, cat];
    }
    updateSettings({ selectedCategories: next });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 animated-bg text-white select-none">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Columns (Lobby details & Host Settings) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-2 glass-card p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">Room Code</span>
                <div className="flex items-center gap-2 mt-1">
                  <h1 className="text-3xl font-black font-mono tracking-widest text-white leading-none">
                    {room.code}
                  </h1>
                  <button
                    onClick={copyRoomCode}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 active:scale-95 transition text-[10px] font-bold rounded border border-white/10 text-purple-300"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <button
                onClick={leaveRoom}
                className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Leave Lobby
              </button>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Settings controls */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-purple-300 border-b border-white/5 pb-1">
                Match Settings
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-black/25 p-3 rounded-xl">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Max Players</label>
                  <select
                    value={room.settings.maxPlayers}
                    onChange={handleMaxPlayersChange}
                    disabled={!isHost}
                    className="w-full glass-input px-2 py-1.5 rounded-lg text-xs"
                  >
                    {[2, 4, 6, 8, 10, 12].map(n => (
                      <option key={n} value={n} className="bg-brand-dark">{n} Players</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Rounds</label>
                  <select
                    value={room.settings.rounds}
                    onChange={handleRoundsChange}
                    disabled={!isHost}
                    className="w-full glass-input px-2 py-1.5 rounded-lg text-xs"
                  >
                    {[1, 2, 3, 4, 5, 8, 10].map(n => (
                      <option key={n} value={n} className="bg-brand-dark">{n} Rounds</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Draw Time</label>
                  <select
                    value={room.settings.drawTime}
                    onChange={handleDrawTimeChange}
                    disabled={!isHost}
                    className="w-full glass-input px-2 py-1.5 rounded-lg text-xs"
                  >
                    {[30, 45, 60, 80, 95, 120].map(n => (
                      <option key={n} value={n} className="bg-brand-dark">{n} Sec</option>
                    ))}
                  </select>
                </div>



                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Word Choices</label>
                  <select
                    value={room.settings.wordChoicesCount !== undefined ? room.settings.wordChoicesCount : 3}
                    onChange={handleWordChoicesCountChange}
                    disabled={!isHost}
                    className="w-full glass-input px-2 py-1.5 rounded-lg text-xs"
                  >
                    <option value={0} className="bg-brand-dark">None (Auto)</option>
                    <option value={1} className="bg-brand-dark">1 Word</option>
                    <option value={2} className="bg-brand-dark">2 Words</option>
                    <option value={3} className="bg-brand-dark">3 Words</option>
                  </select>
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Word Categories</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-black/20 p-3 rounded-xl border border-white/5 max-h-[140px] overflow-y-auto">
                  {categories.map((cat) => {
                    const isSelected = room.settings.selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        disabled={!isHost}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border truncate uppercase tracking-wider ${
                          isSelected
                            ? 'bg-purple-600/35 border-purple-500/50 text-white'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={room.players.length < 2}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:from-purple-900/40 disabled:to-pink-900/40 text-white font-extrabold rounded-xl shadow-lg border border-white/10 flex items-center justify-center gap-2 mt-6 active:scale-95 transition-transform"
            >
              <Play className="w-4 h-4 fill-white" />
              START GAME ({room.players.length}/2 min)
            </button>
          ) : (
            <div className="w-full py-3 text-center bg-purple-900/20 text-purple-300 font-bold border border-purple-500/20 rounded-xl mt-6">
              Waiting for host to start match...
            </div>
          )}
        </motion.div>

        {/* Right Column (Players List) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-4 rounded-2xl border border-white/10 shadow-2xl flex flex-col"
        >
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-3 border-b border-white/5 pb-1">
            Players ({room.players.length})
          </h2>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] md:max-h-[420px]">
            {room.players.map((player) => {
              const isMe = player.id === playerId;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    isMe ? 'bg-purple-600/25 border-purple-500/50' : 'bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-black/20 w-9.5 h-9.5 rounded-full flex items-center justify-center overflow-hidden shrink-0 text-xl">
                      {player.avatar && player.avatar.startsWith('data:image/') ? (
                        <img src={player.avatar} alt="pfp" className="w-full h-full object-cover" />
                      ) : (
                        player.avatar
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-semibold truncate max-w-[120px] ${isMe ? 'text-yellow-400' : ''}`}>
                        {player.name}
                      </span>
                      {player.isHost && <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                    </div>
                  </div>

                  {isHost && !isMe && (
                    <button
                      onClick={() => kickPlayer(player.id)}
                      className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      title="Kick Player"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
