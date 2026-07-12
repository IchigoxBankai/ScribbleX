import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('scribblex_playerId') || null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [drawingHistory, setDrawingHistory] = useState([]);
  const [correctGuessSoundTrigger, setCorrectGuessSoundTrigger] = useState(0);

  useEffect(() => {
    // Determine backend URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
    const newSocket = io(backendUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Save playerId when joined
    newSocket.on('roomJoined', ({ room: joinedRoom, playerId: joinedPlayerId, isHost: hostStatus }) => {
      setRoom(joinedRoom);
      setPlayerId(joinedPlayerId);
      setIsHost(hostStatus);
      setError(null);
      localStorage.setItem('scribblex_playerId', joinedPlayerId);
      localStorage.setItem('scribblex_roomCode', joinedRoom.code);
    });

    newSocket.on('roomUpdated', (updatedRoom) => {
      setRoom(updatedRoom);
      
      // Update isHost flag in case host changed
      const localPlayerId = localStorage.getItem('scribblex_playerId');
      const me = updatedRoom.players.find(p => p.id === localPlayerId);
      if (me) {
        setIsHost(me.isHost);
      }
    });

    newSocket.on('errorMsg', (msg) => {
      setError(msg);
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    });

    newSocket.on('chatMessage', (msg) => {
      setMessages(prev => [...prev, { ...msg, id: Math.random().toString(36).substr(2, 9) }]);
    });

    newSocket.on('drawingHistory', (history) => {
      setDrawingHistory(history);
    });

    newSocket.on('correctGuessSound', () => {
      setCorrectGuessSoundTrigger(prev => prev + 1);
    });

    newSocket.on('kicked', () => {
      setError('You were kicked from the room.');
      setRoom(null);
      localStorage.removeItem('scribblex_roomCode');
    });

    // Check for auto-reconnect if page refreshed
    const storedRoomCode = localStorage.getItem('scribblex_roomCode');
    const storedPlayerId = localStorage.getItem('scribblex_playerId');
    const storedName = localStorage.getItem('scribblex_name');
    const storedAvatar = localStorage.getItem('scribblex_avatar');

    if (storedRoomCode && storedPlayerId && storedName) {
      newSocket.emit('joinRoom', {
        name: storedName,
        avatar: storedAvatar || '🦊',
        roomCode: storedRoomCode,
        playerId: storedPlayerId
      });
    }

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = (name, avatar, settings) => {
    if (!socket) return;
    localStorage.setItem('scribblex_name', name);
    localStorage.setItem('scribblex_avatar', avatar);
    socket.emit('createRoom', { name, avatar, settings });
  };

  const joinRoom = (name, avatar, roomCode) => {
    if (!socket) return;
    localStorage.setItem('scribblex_name', name);
    localStorage.setItem('scribblex_avatar', avatar);
    socket.emit('joinRoom', { name, avatar, roomCode, playerId });
  };

  const leaveRoom = () => {
    if (!socket || !room) return;
    socket.emit('leaveRoom', { roomCode: room.code, playerId });
    setRoom(null);
    setMessages([]);
    setDrawingHistory([]);
    localStorage.removeItem('scribblex_roomCode');
  };

  const startGame = () => {
    if (!socket || !room) return;
    socket.emit('startGame', { roomCode: room.code, playerId });
  };

  const updateSettings = (settings) => {
    if (!socket || !room) return;
    socket.emit('updateSettings', { roomCode: room.code, playerId, settings });
  };

  const selectWord = (word) => {
    if (!socket || !room) return;
    socket.emit('selectWord', { roomCode: room.code, playerId, word });
  };

  const sendDrawAction = (action) => {
    if (!socket || !room) return;
    socket.emit('draw', { roomCode: room.code, playerId, action });
  };

  const sendChatMessage = (text) => {
    if (!socket || !room) return;
    socket.emit('chatMessage', { roomCode: room.code, playerId, text });
  };

  const kickPlayer = (targetPlayerId) => {
    if (!socket || !room) return;
    socket.emit('kickPlayer', { roomCode: room.code, playerId, targetPlayerId });
  };

  const playAgain = () => {
    if (!socket || !room) return;
    socket.emit('playAgain', { roomCode: room.code, playerId });
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      room,
      playerId,
      isHost,
      error,
      messages,
      drawingHistory,
      correctGuessSoundTrigger,
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
      updateSettings,
      selectWord,
      sendDrawAction,
      sendChatMessage,
      kickPlayer,
      playAgain,
      setError
    }}>
      {children}
    </SocketContext.Provider>
  );
};
