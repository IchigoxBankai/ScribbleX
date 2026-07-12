import React from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../contexts/SocketContext';

export default function WordPopup({ isArtist }) {
  const { room, selectWord } = useSocket();

  if (!room || room.gameState.status !== 'WORD_SELECTING') return null;

  const artistName = room.players.find(p => p.id === room.gameState.currentArtist)?.name || 'The artist';

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {isArtist ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card max-w-md w-full p-6 rounded-2xl border border-purple-500/30 text-center shadow-2xl relative overflow-hidden"
        >
          {/* Neon BG decorative glows */}
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/20 blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full bg-pink-500/20 blur-xl"></div>

          <h2 className="text-2xl font-extrabold text-white mb-2 tracking-wide neon-text-purple">
            CHOOSE A WORD
          </h2>
          <p className="text-xs text-gray-300 mb-6 uppercase tracking-wider">
            You have <span className="text-yellow-400 font-bold">{room.gameState.timer} seconds</span> remaining
          </p>

          <div className="flex flex-col gap-3">
            {room.gameState.wordChoices.map((word) => (
              <button
                key={word}
                onClick={() => selectWord(word)}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 active:scale-95 text-white font-extrabold rounded-xl shadow-lg transition-transform border border-white/10"
              >
                {word}
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-sm text-white"
        >
          <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-purple-500 border-b-transparent border-l-transparent animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-bold tracking-wide">
            {artistName} is choosing a word...
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            Round starting in <span className="text-yellow-400 font-bold">{room.gameState.timer}s</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
