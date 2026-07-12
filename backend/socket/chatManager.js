const scoreManager = require('./scoreManager');

class ChatManager {
  constructor() {
    this.lastMessageTime = new Map(); // playerId -> timestamp
  }

  /**
   * Check if player is rate limited
   */
  isRateLimited(playerId) {
    const now = Date.now();
    const lastTime = this.lastMessageTime.get(playerId) || 0;
    if (now - lastTime < 500) {
      return true;
    }
    this.lastMessageTime.set(playerId, now);
    return false;
  }

  /**
   * Normalize strings to compare guesses
   */
  normalizeWord(word) {
    if (!word) return '';
    return word
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // remove punctuation
      .replace(/\s+/g, ' ');   // normalize spaces
  }

  /**
   * Process incoming message
   * @returns {object} { type: 'normal'|'correct', cleanMessage, isCorrect }
   */
  processMessage(room, player, text) {
    const isArtist = room.gameState.currentArtist === player.id;
    const hasAlreadyGuessed = room.gameState.correctGuessers.includes(player.id);
    const normalizedGuess = this.normalizeWord(text);
    const normalizedCorrectWord = this.normalizeWord(room.gameState.currentWord);

    // Anti-cheat: Artist cannot guess or send answers
    if (isArtist) {
      return { type: 'system', message: 'You are the artist, you cannot chat!', ignored: true };
    }

    // If game is in DRAWING state, and guess matches target word
    if (room.gameState.status === 'DRAWING' && normalizedGuess === normalizedCorrectWord && normalizedCorrectWord !== '') {
      if (hasAlreadyGuessed) {
        return { type: 'system', message: 'You already guessed it correctly!', ignored: true };
      }

      // Record correct guesser
      room.gameState.correctGuessers.push(player.id);

      // Calculate score
      const { pointsEarned, artistPoints } = scoreManager.calculateScore(room, player.id);
      
      // Update player scores
      player.score += pointsEarned;
      const artist = room.players.find(p => p.id === room.gameState.currentArtist);
      if (artist) {
        artist.score += artistPoints;
      }

      return {
        type: 'correct',
        player,
        pointsEarned,
        artistPoints,
        isCorrect: true
      };
    }

    // Normal message
    return {
      type: 'normal',
      player,
      text,
      isCorrect: false
    };
  }
}

module.exports = new ChatManager();
