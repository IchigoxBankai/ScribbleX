import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Brush, CheckCircle, Ban } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

export default function Scoreboard() {
  const { room, playerId, kickPlayer } = useSocket();

  if (!room) return null;

  // Sort players by score descending to calculate live ranking
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);

  // Check if I am host
  const me = room.players.find(p => p.id === playerId);
  const amIHost = me ? me.isHost : false;

  return (
    <div className="flex flex-col h-full glass-card rounded-xl border border-white/10 shadow-2xl overflow-hidden text-white w-full">
      {/* Header */}
      <div className="bg-black/35 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide uppercase text-purple-400">Scoreboard</span>
        <span className="text-xs bg-purple-900/50 border border-purple-500/30 px-2 py-0.5 rounded-full text-purple-300">
          {room.players.length} Players
        </span>
      </div>

      {/* Players List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 max-h-[400px] md:max-h-[600px]">
        <AnimatePresence initial={false}>
          {sortedPlayers.map((player, index) => {
            const isMe = player.id === playerId;
            const isArtist = room.gameState.currentArtist === player.id;
            const hasGuessed = player.hasGuessedCorrectly;

            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`relative flex items-center justify-between p-3 rounded-lg border transition ${
                  isArtist
                    ? 'bg-purple-600/20 border-purple-500/50 neon-glow-purple'
                    : hasGuessed
                    ? 'bg-green-500/10 border-green-500/30 ring-1 ring-green-500/20'
                    : !player.connected
                    ? 'opacity-40 bg-gray-900/20 border-white/5'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                {/* Left Section: Rank, Avatar, Details */}
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <span className="text-xs font-bold text-gray-400 w-4">{index + 1}</span>

                  {/* Avatar */}
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-lg overflow-hidden shadow-inner shrink-0">
                    {player.avatar && player.avatar.startsWith('data:image/') ? (
                      <img src={player.avatar} alt="pfp" className="w-full h-full object-cover" />
                    ) : (
                      player.avatar
                    )}
                    {!player.connected && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-red-500 border-2 border-brand-dark animate-pulse" />
                    )}
                  </div>

                  {/* Name and State Icons */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-semibold truncate max-w-[100px] md:max-w-[120px] ${isMe ? 'text-yellow-400 font-extrabold' : ''}`}>
                        {player.name}
                      </span>
                      {player.isHost && <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" title="Room Host" />}
                      {isArtist && <Brush className="w-3.5 h-3.5 text-purple-400 animate-pulse" title="Drawing Now" />}
                      {hasGuessed && <CheckCircle className="w-3.5 h-3.5 text-green-400 fill-green-400/20" title="Guessed Correctly" />}
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {!player.connected ? 'Disconnecting...' : hasGuessed ? 'Correct!' : isArtist ? 'Artist' : 'Guessing'}
                    </span>
                  </div>
                </div>

                {/* Right Section: Score / Kick Button */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-extrabold text-white">{player.score}</span>
                    <span className="text-[9px] text-purple-300 font-medium">pts</span>
                  </div>

                  {/* Host Kick Action */}
                  {amIHost && !isMe && (
                    <button
                      onClick={() => kickPlayer(player.id)}
                      className="p-1 rounded bg-red-500/10 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors ml-1"
                      title="Kick Player"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
