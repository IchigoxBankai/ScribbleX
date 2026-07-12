import React, { useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

export default function Timer() {
  const { room } = useSocket();
  const lastSecRef = useRef(-1);

  if (!room || (room.gameState.status !== 'DRAWING' && room.gameState.status !== 'WORD_SELECTING' && room.gameState.status !== 'ROUND_END')) {
    return null;
  }

  const { timer, status } = room.gameState;
  const totalDrawTime = room.settings.drawTime || 80;
  
  // Choose maximum progress values depending on state
  let maxDuration = totalDrawTime;
  if (status === 'WORD_SELECTING') maxDuration = 10;
  if (status === 'ROUND_END') maxDuration = 8;

  // Calculate stroke dashoffset for visual circular timer
  const percentageRemaining = Math.max(0, Math.min(100, (timer / maxDuration) * 100));
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentageRemaining / 100) * circumference;

  // Choose color based on remaining time
  let colorClass = 'stroke-purple-500';
  let textClass = 'text-white';
  
  if (status === 'DRAWING') {
    if (timer <= 10) {
      colorClass = 'stroke-red-500 animate-pulse';
      textClass = 'text-red-400 font-extrabold';
    } else if (timer <= 20) {
      colorClass = 'stroke-yellow-500';
      textClass = 'text-yellow-400 font-bold';
    }
  }

  // Synthesize short procedural ticking sound in final 10s
  useEffect(() => {
    if (status === 'DRAWING' && timer <= 10 && timer > 0 && timer !== lastSecRef.current) {
      lastSecRef.current = timer;
      playTickSound();
    }
  }, [timer, status]);

  const playTickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(timer === 1 ? 880 : 440, audioCtx.currentTime); // higher pitch for last second
      
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      // Ignored if browser blocks audio autoplay initially
    }
  };

  return (
    <div className="relative flex items-center justify-center w-14 h-14 bg-black/45 backdrop-blur-md rounded-full shadow-lg border border-white/10 select-none">
      <svg className="w-full h-full transform -rotate-90">
        {/* Track circle */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="stroke-white/5 fill-transparent"
          strokeWidth="3.5"
        />
        {/* Dynamic progress circle */}
        <circle
          cx="28"
          cy="28"
          r={radius}
          className={`fill-transparent transition-all duration-1000 ${colorClass}`}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      {/* Clock seconds */}
      <span className={`absolute text-sm font-extrabold tracking-tight ${textClass}`}>
        {timer}
      </span>
    </div>
  );
}
