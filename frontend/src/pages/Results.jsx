import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../contexts/SocketContext';
import { Trophy, Home as HomeIcon, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Results() {
  const { room, playerId, isHost, playAgain, leaveRoom } = useSocket();

  if (!room) return null;

  // Players are already sorted by backend in scoreManager or gameManager, but let's sort again to be absolutely sure
  const podium = [...room.players].sort((a, b) => b.score - a.score);

  // Trigger confetti burst on load
  useEffect(() => {
    // Blast initial confetti
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    // Setup a continuous light shower
    const interval = setInterval(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const firstPlace = podium[0];
  const secondPlace = podium[1];
  const thirdPlace = podium[2];

  return (
    <div className="min-h-screen w-full animated-bg text-white p-4 flex flex-col items-center justify-center select-none">
      
      {/* Title Header */}
      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 flex flex-col items-center gap-2"
      >
        <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-glow fill-yellow-400/10 animate-bounce" />
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-yellow-300 via-purple-300 to-pink-400 bg-clip-text text-transparent tracking-tight leading-none uppercase">
          Match Complete!
        </h1>
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1">
          Final Standings Podium
        </p>
      </motion.div>

      {/* Podium Layout */}
      <div className="w-full max-w-2xl grid grid-cols-3 gap-3 md:gap-4 items-end mb-10 min-h-[300px]">
        {/* 2nd Place */}
        {secondPlace ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center overflow-hidden mb-1 bg-black/10 text-3xl md:text-4xl">
              {secondPlace.avatar && secondPlace.avatar.startsWith('data:image/') ? (
                <img src={secondPlace.avatar} alt="pfp" className="w-full h-full object-cover" />
              ) : (
                secondPlace.avatar
              )}
            </div>
            <div className="text-xs md:text-sm font-extrabold truncate max-w-[80px] md:max-w-[120px] text-gray-300">
              {secondPlace.name}
            </div>
            <div className="text-[10px] md:text-xs text-gray-400 mb-2 font-bold">{secondPlace.score} pts</div>
            <div className="w-full h-24 md:h-32 rounded-t-2xl podium-2nd flex flex-col items-center justify-center shadow-lg relative">
              <span className="text-3xl font-black text-gray-300/40">2nd</span>
            </div>
          </motion.div>
        ) : (
          <div />
        )}

        {/* 1st Place (Gold Winner) */}
        {firstPlace ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center z-10"
          >
            <div className="relative mb-2">
              <Trophy className="w-6 h-6 text-yellow-400 absolute -top-5 left-1/2 -translate-x-1/2 fill-yellow-400/20" />
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center overflow-hidden bg-black/10 text-5xl md:text-6xl border-2 border-yellow-400 mx-auto">
                {firstPlace.avatar && firstPlace.avatar.startsWith('data:image/') ? (
                  <img src={firstPlace.avatar} alt="pfp" className="w-full h-full object-cover" />
                ) : (
                  firstPlace.avatar
                )}
              </div>
            </div>
            <div className="text-sm md:text-base font-black truncate max-w-[90px] md:max-w-[140px] text-yellow-400">
              {firstPlace.name}
            </div>
            <div className="text-xs text-yellow-300 mb-2 font-extrabold">{firstPlace.score} pts</div>
            <div className="w-full h-32 md:h-44 rounded-t-2xl podium-1st flex flex-col items-center justify-center shadow-2xl relative ring-2 ring-yellow-400/35">
              <span className="text-4xl font-black text-yellow-400/40">1st</span>
            </div>
          </motion.div>
        ) : (
          <div />
        )}

        {/* 3rd Place */}
        {thirdPlace ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center overflow-hidden mb-1 bg-black/10 text-3xl md:text-4xl">
              {thirdPlace.avatar && thirdPlace.avatar.startsWith('data:image/') ? (
                <img src={thirdPlace.avatar} alt="pfp" className="w-full h-full object-cover" />
              ) : (
                thirdPlace.avatar
              )}
            </div>
            <div className="text-xs md:text-sm font-extrabold truncate max-w-[80px] md:max-w-[120px] text-amber-600">
              {thirdPlace.name}
            </div>
            <div className="text-[10px] md:text-xs text-gray-400 mb-2 font-bold">{thirdPlace.score} pts</div>
            <div className="w-full h-16 md:h-24 rounded-t-2xl podium-3rd flex flex-col items-center justify-center shadow-lg relative">
              <span className="text-3xl font-black text-amber-600/40">3rd</span>
            </div>
          </motion.div>
        ) : (
          <div />
        )}
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex gap-4 w-full max-w-sm"
      >
        {isHost ? (
          <button
            onClick={playAgain}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 font-extrabold rounded-xl border border-white/10 shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
        ) : (
          <div className="flex-1 text-center py-3 bg-purple-900/20 text-purple-300 font-bold border border-purple-500/20 rounded-xl">
            Waiting for host to restart...
          </div>
        )}
        <button
          onClick={leaveRoom}
          className="flex-1 py-3 bg-white/5 hover:bg-white/10 font-bold rounded-xl border border-white/5 active:scale-95 transition flex items-center justify-center gap-1.5 text-gray-300"
        >
          <HomeIcon className="w-4 h-4" />
          Quit Game
        </button>
      </motion.div>

    </div>
  );
}
