import React, { useRef, useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Send } from 'lucide-react';

export default function Chat({ isArtist }) {
  const { messages, sendChatMessage } = useSocket();
  const [inputText, setInputText] = useState('');
  const [rateLimitTimer, setRateLimitTimer] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isArtist || isBlocked) return;

    sendChatMessage(inputText);
    setInputText('');

    // Client-side rate-limit block of 500ms
    setIsBlocked(true);
    const timer = setTimeout(() => {
      setIsBlocked(false);
    }, 500);
    setRateLimitTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (rateLimitTimer) clearTimeout(rateLimitTimer);
    };
  }, [rateLimitTimer]);

  return (
    <div className="flex flex-col h-full glass-card rounded-xl border border-white/10 overflow-hidden text-white shadow-2xl">
      {/* Header */}
      <div className="bg-black/35 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide uppercase text-purple-400">Game Live Chat</span>
      </div>

      {/* Messages list */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-2 text-sm max-h-[300px] md:max-h-[500px]">
        {messages.map((m) => {
          if (m.type === 'system') {
            return (
              <div key={m.id} className="text-gray-400 italic bg-white/5 py-1 px-2.5 rounded-lg border border-white/5 text-center">
                {m.text}
              </div>
            );
          }
          if (m.type === 'correct') {
            return (
              <div key={m.id} className="text-green-400 font-bold bg-green-500/10 py-1.5 px-3 rounded-lg border border-green-500/20 text-center animate-bounce">
                {m.text} 🎉
              </div>
            );
          }
          return (
            <div key={m.id} className="flex flex-col bg-white/5 p-2 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
              <span className="font-bold text-xs text-purple-300">{m.sender}</span>
              <span className="text-gray-200 mt-0.5">{m.text}</span>
            </div>
          );
        })}
      </div>

      {!isArtist ? (
        <form onSubmit={handleSubmit} className="p-3 bg-black/20 border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isBlocked
                ? "Spam prevention active..."
                : "Type your guess here..."
            }
            disabled={isBlocked}
            className="flex-1 glass-input px-3.5 py-2 rounded-lg text-sm w-full placeholder:text-gray-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isBlocked}
            className="p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/50 disabled:opacity-50 text-white rounded-lg transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="p-3 bg-purple-950/20 text-purple-400 font-bold border-t border-white/10 text-center text-xs">
          You are the artist! Draw the word.
        </div>
      )}
    </div>
  );
}
