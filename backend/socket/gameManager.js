const WordManager = require('./wordManager');
const hintManager = require('./hintManager');
const drawingManager = require('./drawingManager');
const shuffle = require('../utils/shuffle');

class GameManager {
  setIo(io) {
    this.io = io;
  }

  /**
   * Helper to sanitize room data for a specific player (to prevent word-snooping)
   */
  getSanitizedRoom(room, playerId) {
    const isArtist = room.gameState.currentArtist === playerId;
    const hasGuessed = room.gameState.correctGuessers.includes(playerId);

    const sanitizedGameState = {
      ...room.gameState,
      // Hide choice words and target word from non-artists/guessers
      currentWord: (isArtist || room.gameState.status === 'ROUND_END' || room.gameState.status === 'GAME_END') 
        ? room.gameState.currentWord 
        : (room.gameState.hintState ? room.gameState.hintState.currentHint.join('') : ''),
      wordChoices: isArtist ? room.gameState.wordChoices : []
    };

    // Remove raw interval objects and unnecessary internals
    delete sanitizedGameState.timerInterval;
    delete sanitizedGameState.hintState;
    delete sanitizedGameState.wordList;

    return {
      code: room.code,
      settings: room.settings,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        isReady: p.isReady,
        isHost: p.isHost,
        connected: p.connected,
        hasGuessedCorrectly: room.gameState.correctGuessers.includes(p.id)
      })),
      gameState: sanitizedGameState
    };
  }

  /**
   * Send room update to all sockets in the room
   */
  broadcastRoomUpdate(room) {
    if (!this.io) return;
    room.players.forEach(player => {
      if (player.connected && player.socketId) {
        const sanitized = this.getSanitizedRoom(room, player.id);
        this.io.to(player.socketId).emit('roomUpdated', sanitized);
      }
    });
  }

  /**
   * Initialize a new match and start the first round
   */
  startGame(room) {
    // Reset players scores & ready statuses
    room.players.forEach(p => {
      p.score = 0;
      p.isReady = true;
    });

    // Populate game word pool
    const wordPool = WordManager.getWords(room.settings.selectedCategories);
    room.gameState.wordList = wordPool;
    room.gameState.usedWords = new Set();

    // Reset rounds
    room.gameState.currentRound = 1;
    
    // Shuffle artist order (only including connected players)
    const activePlayers = room.players.filter(p => p.connected);
    room.gameState.artistOrder = shuffle(activePlayers.map(p => p.id));
    room.gameState.artistIndex = 0;
    
    this.startWordSelection(room);
  }

  /**
   * Start word selection phase for the current artist
   */
  startWordSelection(room) {
    if (room.gameState.timerInterval) {
      clearInterval(room.gameState.timerInterval);
    }

    const artistId = room.gameState.artistOrder[room.gameState.artistIndex];
    
    // Check if artist is still in the room and connected
    const artist = room.players.find(p => p.id === artistId);
    if (!artist || !artist.connected) {
      // Skip to next artist
      this.moveToNextTurn(room);
      return;
    }

    room.gameState.correctGuessers = [];
    room.gameState.currentWord = '';
    drawingManager.clearDrawing(room);

    const count = room.settings.hasOwnProperty('wordChoicesCount') ? room.settings.wordChoicesCount : 3;
    const targetCount = count === 0 ? 1 : count;

    // Pick words that haven't been used yet
    let choices = [];
    let attempts = 0;
    while (choices.length < targetCount && attempts < 100 && room.gameState.wordList.length > 0) {
      const idx = Math.floor(Math.random() * room.gameState.wordList.length);
      const word = room.gameState.wordList[idx];
      if (!room.gameState.usedWords.has(word)) {
        choices.push(word);
        room.gameState.usedWords.add(word);
      }
      attempts++;
    }

    // Fallback if all words used
    if (choices.length < targetCount) {
      room.gameState.usedWords.clear(); // Reset used words
      choices = ['Pencil', 'Paintbrush', 'Canvas'].slice(0, targetCount);
    }

    if (count === 0) {
      // Skip word selection completely
      this.selectWord(room, choices[0]);
      return;
    }

    room.gameState.status = 'WORD_SELECTING';
    room.gameState.currentArtist = artistId;
    room.gameState.wordChoices = choices;
    room.gameState.timer = 10; // 10 seconds to choose a word

    this.broadcastRoomUpdate(room);

    room.gameState.timerInterval = setInterval(() => {
      room.gameState.timer--;
      if (room.gameState.timer <= 0) {
        clearInterval(room.gameState.timerInterval);
        // Auto select a random choice
        const autoSelected = choices[Math.floor(Math.random() * choices.length)];
        this.selectWord(room, autoSelected);
      } else {
        // Emit timer update
        this.io.to(room.code).emit('timerUpdate', {
          timer: room.gameState.timer,
          status: room.gameState.status
        });
      }
    }, 1000);
  }

  /**
   * Artist selected a word, transition to DRAWING state
   */
  selectWord(room, word) {
    if (room.gameState.timerInterval) {
      clearInterval(room.gameState.timerInterval);
    }

    room.gameState.status = 'DRAWING';
    room.gameState.currentWord = word;
    room.gameState.timer = room.settings.drawTime;

    // Initialize hints
    room.gameState.hintState = hintManager.initHintState(word);

    this.broadcastRoomUpdate(room);

    room.gameState.timerInterval = setInterval(() => {
      room.gameState.timer--;

      // Calculate time percentage elapsed
      const drawTime = room.settings.drawTime;
      const elapsed = drawTime - room.gameState.timer;
      const percentage = (elapsed / drawTime) * 100;

      // Update hints (only if hintTime is not 0)
      if (room.settings.hintTime > 0) {
        const hintUpdated = hintManager.updateHint(room.gameState.hintState, percentage);
        if (hintUpdated) {
          // Broadcast updated hint
          this.broadcastRoomUpdate(room);
        }
      }

      // Check if timer expired
      if (room.gameState.timer <= 0) {
        clearInterval(room.gameState.timerInterval);
        this.endRound(room);
      } else {
        // Broadcast standard timer tick
        this.io.to(room.code).emit('timerUpdate', {
          timer: room.gameState.timer,
          status: room.gameState.status
        });
      }
    }, 1000);
  }

  /**
   * End the current round / drawing turn
   */
  endRound(room) {
    if (room.gameState.timerInterval) {
      clearInterval(room.gameState.timerInterval);
    }

    room.gameState.status = 'ROUND_END';
    room.gameState.timer = 5; // 5 seconds display stats

    // Find if anyone got 0 points/didn't guess
    this.broadcastRoomUpdate(room);

    room.gameState.timerInterval = setInterval(() => {
      room.gameState.timer--;
      if (room.gameState.timer <= 0) {
        clearInterval(room.gameState.timerInterval);
        this.moveToNextTurn(room);
      } else {
        this.io.to(room.code).emit('timerUpdate', {
          timer: room.gameState.timer,
          status: room.gameState.status
        });
      }
    }, 1000);
  }

  /**
   * Check if round should end early (if all guessing players guessed correctly)
   */
  checkEarlyRoundEnd(room) {
    if (room.gameState.status !== 'DRAWING') return;

    const guessersCount = room.players.filter(p => p.connected && p.id !== room.gameState.currentArtist).length;
    const correctCount = room.gameState.correctGuessers.length;

    // End round if everyone guessed it right (must have at least one guesser)
    if (guessersCount > 0 && correctCount === guessersCount) {
      this.endRound(room);
    }
  }

  /**
   * Cycle to the next artist or advance the round
   */
  moveToNextTurn(room) {
    room.gameState.artistIndex++;

    // Check if round cycle is complete (every player has drawn once)
    const connectedPlayersCount = room.players.filter(p => p.connected).length;
    if (room.gameState.artistIndex >= room.gameState.artistOrder.length || connectedPlayersCount === 0) {
      // Increment round
      room.gameState.currentRound++;
      
      if (room.gameState.currentRound > room.settings.rounds) {
        this.endGame(room);
        return;
      }

      // Re-shuffle order of connected players for the new round
      const activePlayers = room.players.filter(p => p.connected);
      room.gameState.artistOrder = shuffle(activePlayers.map(p => p.id));
      room.gameState.artistIndex = 0;
    }

    this.startWordSelection(room);
  }

  /**
   * End the game and display the podium
   */
  endGame(room) {
    if (room.gameState.timerInterval) {
      clearInterval(room.gameState.timerInterval);
    }

    room.gameState.status = 'GAME_END';
    room.gameState.timer = 15; // 15 seconds to display final results
    
    // Sort players by score descending
    room.players.sort((a, b) => b.score - a.score);

    this.broadcastRoomUpdate(room);
  }
}

module.exports = new GameManager();
