import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../contexts/SocketContext';
import { Settings, Play, Users, BookOpen, AlertCircle } from 'lucide-react';

const EMOJIS = ['🦊', '🐱', '🐶', '🦁', '🐻', '🐨', '🐼', '🐹', '🐰', '🐸', '🐙', '🦄', '🦖', '🐝', '🐬', '🎨'];

export default function Home() {
  const { createRoom, joinRoom, error, setError } = useSocket();

  const [activeTab, setActiveTab] = useState('join'); // 'create' | 'join' | 'how-to'
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(EMOJIS[0]);
  const [roomCode, setRoomCode] = useState('');

  // Create Room Settings
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(80);
  const [hintTime, setHintTime] = useState(30);
  const [wordChoicesCount, setWordChoicesCount] = useState(3);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(['general']);

  // Load categories from backend on mount
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    fetch(`${backendUrl}/api/categories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(['anime', 'sports', 'food', 'nature', 'general', 'technology', 'animals', 'space']);
        }
      })
      .catch(() => {
        // Fallback list
        setCategories(['anime', 'sports', 'food', 'nature', 'general', 'technology', 'animals', 'space']);
      });
  }, []);

  const handlePfpUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 150 * 1024) {
        setError('Image too large. Please select an image smaller than 150KB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    createRoom(name, avatar, {
      maxPlayers,
      rounds,
      drawTime,
      hintTime,
      wordChoicesCount,
      selectedCategories
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter the room code.');
      return;
    }
    joinRoom(name, avatar, roomCode.toUpperCase().trim());
  };

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(prev => prev.filter(c => c !== cat));
      }
    } else {
      setSelectedCategories(prev => [...prev, cat]);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden animated-bg select-none">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-purple-600/10 blur-3xl animate-pulse-glow" style={{ animationDelay: '0s' }}></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-pink-600/10 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

      {/* Floating Canvas/Drawing Ornaments */}
      <div className="hidden lg:block absolute top-1/4 left-20 text-7xl opacity-15 rotate-12 pointer-events-none select-none animate-float-slow">✏️</div>
      <div className="hidden lg:block absolute bottom-1/4 right-20 text-7xl opacity-15 -rotate-45 pointer-events-none select-none animate-float-medium">🎨</div>
      <div className="hidden lg:block absolute bottom-12 left-1/4 text-6xl opacity-15 rotate-45 pointer-events-none select-none animate-float-slow">🍕</div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-2xl w-full glass-card p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl z-10 text-white"
      >
        {/* Logo Header */}
        <div className="text-center mb-6">
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent tracking-tight leading-none filter drop-shadow-lg"
          >
            ScribbleX
          </motion.h1>
          <p className="text-xs text-gray-400 font-semibold tracking-widest uppercase mt-2">
            Realtime Drawing & Guessing Party Game
          </p>
        </div>

        {/* Errors display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center gap-2"
          >
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Tab switchers */}
        <div className="flex gap-2 mb-6 p-1 bg-black/35 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'join' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            Join Room
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'create' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            Create Room
          </button>
          <button
            onClick={() => setActiveTab('how-to')}
            className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
              activeTab === 'how-to' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            How to Play
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={12}
                placeholder="Enter nickname..."
                className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                maxLength={6}
                placeholder="6-character code (e.g. AF7KQ2)"
                className="w-full glass-input px-4 py-3 rounded-xl text-sm uppercase font-mono tracking-widest"
                required
              />
            </div>

            {/* Avatar Select */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Select Avatar</label>
                <label className="text-xs font-bold text-purple-400 hover:text-purple-300 cursor-pointer">
                  Upload Custom PFP
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePfpUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-2xl border border-white/5">
                {avatar.startsWith('data:image/') && (
                  <div className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden border-2 border-purple-500 shadow-md">
                    <img src={avatar} alt="custom pfp" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="grid grid-cols-8 gap-1.5 max-h-[100px] overflow-y-auto flex-1">
                  {EMOJIS.map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setAvatar(emo)}
                      className={`w-8 h-8 text-base flex items-center justify-center rounded-lg transition ${
                        avatar === emo ? 'bg-purple-600 scale-105 shadow-md ring-1 ring-white/15' : 'hover:bg-white/10'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 font-extrabold rounded-xl shadow-lg hover:shadow-purple-500/20 active:scale-95 transition text-sm flex items-center justify-center gap-2 border border-white/10 mt-6"
            >
              <Play className="w-4 h-4 fill-white" />
              JOIN ROOM
            </button>
          </form>
        )}

        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={12}
                  placeholder="Enter nickname..."
                  className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                  required
                />
              </div>

              {/* Avatar Select */}
              <div className="md:col-span-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Select Avatar</label>
                  <label className="text-xs font-bold text-purple-400 hover:text-purple-300 cursor-pointer">
                    Upload Custom PFP
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePfpUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-2xl border border-white/5">
                  {avatar.startsWith('data:image/') && (
                    <div className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden border-2 border-purple-500 shadow-md">
                      <img src={avatar} alt="custom pfp" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex gap-1.5 overflow-x-auto p-0.5 flex-1 max-w-[280px] md:max-w-none">
                    {EMOJIS.slice(0, 10).map((emo) => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => setAvatar(emo)}
                        className={`w-8 h-8 text-base flex items-center justify-center rounded-lg shrink-0 transition ${
                          avatar === emo ? 'bg-purple-600 scale-105 shadow-md ring-1 ring-white/15' : 'hover:bg-white/10'
                        }`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Settings togglers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Max Players</label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full glass-input px-2.5 py-1.5 rounded-lg text-xs"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                    <option key={n} value={n} className="bg-brand-dark">{n} Players</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Rounds</label>
                <select
                  value={rounds}
                  onChange={(e) => setRounds(parseInt(e.target.value))}
                  className="w-full glass-input px-2.5 py-1.5 rounded-lg text-xs"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n} className="bg-brand-dark">{n} Rounds</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Draw Time</label>
                <select
                  value={drawTime}
                  onChange={(e) => setDrawTime(parseInt(e.target.value))}
                  className="w-full glass-input px-2.5 py-1.5 rounded-lg text-xs"
                >
                  {[30, 45, 60, 80, 95, 120].map(n => (
                    <option key={n} value={n} className="bg-brand-dark">{n} Seconds</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Hint Interval</label>
                <select
                  value={hintTime}
                  onChange={(e) => setHintTime(parseInt(e.target.value))}
                  className="w-full glass-input px-2.5 py-1.5 rounded-lg text-xs"
                >
                  <option value={0} className="bg-brand-dark">No Hints</option>
                  {[15, 20, 25, 30, 40].map(n => (
                    <option key={n} value={n} className="bg-brand-dark">{n} Seconds</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Word Choices</label>
                <select
                  value={wordChoicesCount}
                  onChange={(e) => setWordChoicesCount(parseInt(e.target.value))}
                  className="w-full glass-input px-2.5 py-1.5 rounded-lg text-xs"
                >
                  <option value={0} className="bg-brand-dark">None (Auto)</option>
                  <option value={1} className="bg-brand-dark">1 Word</option>
                  <option value={2} className="bg-brand-dark">2 Words</option>
                  <option value={3} className="bg-brand-dark">3 Words</option>
                </select>
              </div>
            </div>

            {/* Word Categories checkbox lists */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Word Categories</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 p-3.5 bg-black/25 rounded-2xl border border-white/5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border truncate uppercase tracking-wider ${
                      selectedCategories.includes(cat)
                        ? 'bg-purple-600/35 border-purple-500/50 text-white'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 font-extrabold rounded-xl shadow-lg hover:shadow-purple-500/20 active:scale-95 transition text-sm flex items-center justify-center gap-2 border border-white/10 mt-6"
            >
              <Settings className="w-4 h-4 animate-spin-slow" />
              CREATE ROOM
            </button>
          </form>
        )}

        {activeTab === 'how-to' && (
          <div className="space-y-4 text-sm text-gray-300 max-h-[360px] overflow-y-auto pr-1">
            <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-white/10 pb-1.5">Game Mechanics</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>When it's your turn, choose one of the three random words provided to draw on the canvas.</li>
              <li>When other players draw, type your guesses in the chat box to gain points.</li>
              <li>Faster guesses receive speed bonuses (up to <span className="text-yellow-400 font-bold">+50 bonus pts</span>).</li>
              <li>Hints will reveal letters at <span className="text-purple-400 font-bold">20%</span>, <span className="text-purple-400 font-bold">50%</span>, and <span className="text-purple-400 font-bold">80%</span> of elapsed round time.</li>
              <li>If you disconnect, you can return to the room with your score intact within <span className="text-red-400 font-bold">30 seconds</span>!</li>
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  );
}
