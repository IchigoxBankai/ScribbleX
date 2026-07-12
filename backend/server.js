const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const roomManager = require('./socket/roomManager');
const gameManager = require('./socket/gameManager');
const drawingManager = require('./socket/drawingManager');
const chatManager = require('./socket/chatManager');
const WordManager = require('./socket/wordManager');

const app = express();
app.use(cors());
app.use(express.json());

// API endpoints (useful for debugging, frontend checks, etc)
app.get('/api/categories', (req, res) => {
  res.json(WordManager.getAvailableCategories());
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev/sandbox setup
    methods: ['GET', 'POST']
  }
});

// Pass IO to game manager for broadcasts
gameManager.setIo(io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 1. Create Room
  socket.on('createRoom', ({ name, avatar, settings }) => {
    try {
      const playerId = `player_${Math.random().toString(36).substr(2, 9)}`;
      const room = roomManager.createRoom(name, avatar, settings);
      
      const { player } = roomManager.addPlayer(room, playerId, name, avatar, socket.id);
      
      socket.join(room.code);
      
      // Reply to the creator with their playerId and room code
      socket.emit('roomJoined', {
        room: gameManager.getSanitizedRoom(room, playerId),
        playerId,
        isHost: true
      });
      
      console.log(`Room created: ${room.code} by ${name}`);
    } catch (e) {
      socket.emit('errorMsg', e.message);
    }
  });

  // 2. Join Room
  socket.on('joinRoom', ({ name, avatar, roomCode, playerId }) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) {
        socket.emit('errorMsg', 'Room not found.');
        return;
      }

      // Generate a new playerId if they don't have one
      const actualPlayerId = playerId || `player_${Math.random().toString(36).substr(2, 9)}`;
      
      const { player, isReconnect } = roomManager.addPlayer(room, actualPlayerId, name, avatar, socket.id);
      
      socket.join(room.code);
      
      // Reply to joiner
      socket.emit('roomJoined', {
        room: gameManager.getSanitizedRoom(room, actualPlayerId),
        playerId: actualPlayerId,
        isHost: player.isHost
      });

      // System notification in chat
      io.to(room.code).emit('chatMessage', {
        type: 'system',
        text: `${name} has ${isReconnect ? 'reconnected' : 'joined the room'}.`
      });

      // Send current drawing history if game is running and we reconnected/joined
      if (room.gameState.status === 'DRAWING') {
        socket.emit('drawingHistory', drawingManager.getDrawingHistory(room));
      }

      gameManager.broadcastRoomUpdate(room);
    } catch (e) {
      socket.emit('errorMsg', e.message);
    }
  });

  // 3. Start Game
  socket.on('startGame', ({ roomCode, playerId }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isHost) {
      socket.emit('errorMsg', 'Only the host can start the game.');
      return;
    }

    if (room.players.length < 2) {
      socket.emit('errorMsg', 'Need at least 2 players to start.');
      return;
    }

    gameManager.startGame(room);
    
    io.to(room.code).emit('chatMessage', {
      type: 'system',
      text: 'The game has started!'
    });
  });

  // 4. Settings Update
  socket.on('updateSettings', ({ roomCode, playerId, settings }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isHost) return;

    room.settings = {
      ...room.settings,
      ...settings
    };

    gameManager.broadcastRoomUpdate(room);
  });

  // 5. Select Word (from artist choice)
  socket.on('selectWord', ({ roomCode, playerId, word }) => {
    console.log('[SELECT_WORD_EVENT]', { roomCode, playerId, word });
    const room = roomManager.getRoom(roomCode);
    if (!room) {
      console.log('[SELECT_WORD_EVENT] Room not found');
      return;
    }

    console.log('[SELECT_WORD_EVENT] State verification:', {
      status: room.gameState.status,
      currentArtist: room.gameState.currentArtist,
      playerId,
      matches: room.gameState.currentArtist === playerId
    });

    if (room.gameState.status !== 'WORD_SELECTING' || room.gameState.currentArtist !== playerId) {
      console.log('[SELECT_WORD_EVENT] Validation failed');
      return;
    }

    gameManager.selectWord(room, word);
  });

  // 6. Draw Actions
  socket.on('draw', ({ roomCode, playerId, action }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.gameState.status !== 'DRAWING' || room.gameState.currentArtist !== playerId) {
      return;
    }

    // Save action to history
    drawingManager.addDrawingAction(room, action);

    // Broadcast draw action to room members (except drawing artist who generated it locally)
    socket.to(room.code).emit('drawAction', action);
  });

  // 7. Chat Guessing & Messages
  socket.on('chatMessage', ({ roomCode, playerId, text }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    // Rate Limit check
    if (chatManager.isRateLimited(playerId)) {
      socket.emit('errorMsg', 'Rate limit exceeded. Please wait before typing.');
      return;
    }

    const result = chatManager.processMessage(room, player, text);

    if (result.ignored) {
      socket.emit('chatMessage', {
        type: 'system',
        text: result.message
      });
      return;
    }

    if (result.isCorrect) {
      // Broadcast guess to everyone
      io.to(room.code).emit('chatMessage', {
        type: 'correct',
        text: `${player.name} guessed the word!`,
        playerId: player.id
      });

      // Play success sound trigger
      io.to(room.code).emit('correctGuessSound');

      // Update room layout scores
      gameManager.broadcastRoomUpdate(room);

      // Check if all players guessed correctly (early round end)
      gameManager.checkEarlyRoundEnd(room);
    } else {
      // Normal chat broadcast
      io.to(room.code).emit('chatMessage', {
        type: 'normal',
        sender: player.name,
        text: text,
        playerId: player.id
      });
    }
  });

  // 8. Kick Player
  socket.on('kickPlayer', ({ roomCode, playerId, targetPlayerId }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isHost) return;

    const targetIndex = room.players.findIndex(p => p.id === targetPlayerId);
    if (targetIndex !== -1) {
      const kicked = room.players.splice(targetIndex, 1)[0];
      
      // If kicked was active artist, skip
      if (room.gameState.currentArtist === targetPlayerId) {
        gameManager.moveToNextTurn(room);
      }

      // Tell the kicked player's socket to disconnect/leave
      if (kicked.socketId) {
        io.to(kicked.socketId).emit('kicked');
      }

      io.to(room.code).emit('chatMessage', {
        type: 'system',
        text: `${kicked.name} was kicked from the room.`
      });

      gameManager.broadcastRoomUpdate(room);
    }
  });

  // 9. Play Again / Restart Game
  socket.on('playAgain', ({ roomCode, playerId }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isHost) return;

    // Reset status back to Lobby
    room.gameState.status = 'LOBBY';
    room.gameState.currentRound = 0;
    room.gameState.artistIndex = -1;
    room.gameState.currentArtist = null;
    room.gameState.currentWord = '';
    room.gameState.wordChoices = [];
    room.gameState.correctGuessers = [];
    drawingManager.clearDrawing(room);

    gameManager.broadcastRoomUpdate(room);
  });

  // 10. Disconnect Handling
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    // Scan all rooms to see if this socket belongs to anyone
    roomManager.rooms.forEach((room, roomCode) => {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        roomManager.removePlayer(roomCode, player.id, () => {
          console.log(`Room empty, destroyed: ${roomCode}`);
        });

        // Notify others
        io.to(room.code).emit('chatMessage', {
          type: 'system',
          text: `${player.name} has disconnected. 30s to reconnect.`
        });

        // Update lists
        gameManager.broadcastRoomUpdate(room);
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`ScribbleX Server running on port ${PORT}`);
});
