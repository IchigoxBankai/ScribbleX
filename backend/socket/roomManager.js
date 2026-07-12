const { generateRoomCode } = require('../utils/random');
const WordManager = require('./wordManager');

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> RoomObject
  }

  createRoom(hostName, hostAvatar, settings = {}) {
    const code = generateRoomCode(6);
    const room = {
      code,
      settings: {
        maxPlayers: settings.maxPlayers || 8,
        rounds: settings.rounds || 3,
        drawTime: settings.drawTime || 80,
        hintTime: settings.hintTime || 30,
        wordChoicesCount: settings.hasOwnProperty('wordChoicesCount') ? settings.wordChoicesCount : 3,
        selectedCategories: settings.selectedCategories || ['general']
      },
      players: [],
      gameState: {
        status: 'LOBBY', // LOBBY, WORD_SELECTING, DRAWING, ROUND_END, GAME_END
        currentRound: 0,
        artistOrder: [], // list of playerId in order of drawing
        artistIndex: -1,
        currentArtist: null, // playerId
        currentWord: '',
        wordChoices: [],
        wordList: [], // pool of shuffled words for the match
        usedWords: new Set(),
        timer: 0,
        timerInterval: null,
        hints: [],
        revealedHints: 0,
        drawingHistory: [], // stores canvas events for sync
        guesses: [], // chat history for current round
        correctGuessers: [] // list of playerIds who guessed correctly
      }
    };

    this.rooms.set(code, room);
    return room;
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(code.toUpperCase());
  }

  removeRoom(code) {
    const room = this.getRoom(code);
    if (room) {
      if (room.gameState.timerInterval) {
        clearInterval(room.gameState.timerInterval);
      }
      this.rooms.delete(code.toUpperCase());
    }
  }

  addPlayer(room, playerId, name, avatar, socketId) {
    // Check if player is reconnecting
    let player = room.players.find(p => p.id === playerId);
    if (player) {
      // Reconnection
      if (player.disconnectTimeout) {
        clearTimeout(player.disconnectTimeout);
        player.disconnectTimeout = null;
      }
      player.socketId = socketId;
      player.connected = true;
      return { player, isReconnect: true };
    }

    // New join
    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error('Room is full');
    }

    const isHost = room.players.length === 0;
    player = {
      id: playerId,
      name,
      avatar,
      score: 0,
      isReady: isHost, // Host is ready by default
      isHost,
      socketId,
      connected: true
    };
    room.players.push(player);
    return { player, isReconnect: false };
  }

  removePlayer(roomCode, playerId, callbackOnEmpty) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return null;

    const player = room.players[playerIndex];
    player.connected = false;
    player.socketId = null;

    // Start 30s reconnect timeout
    player.disconnectTimeout = setTimeout(() => {
      // Find the player index again in case array modified
      const currentIdx = room.players.findIndex(p => p.id === playerId);
      if (currentIdx !== -1) {
        const removed = room.players.splice(currentIdx, 1)[0];
        
        // If they were host, pass host to someone else
        if (removed.isHost && room.players.length > 0) {
          const newHost = room.players.find(p => p.connected);
          if (newHost) {
            newHost.isHost = true;
            newHost.isReady = true;
          }
        }

        // If no connected players left, clean up room
        const hasConnected = room.players.some(p => p.connected);
        if (!hasConnected) {
          this.removeRoom(roomCode);
          if (callbackOnEmpty) callbackOnEmpty();
        }
      }
    }, 30000); // 30 seconds

    return player;
  }
}

module.exports = new RoomManager();
