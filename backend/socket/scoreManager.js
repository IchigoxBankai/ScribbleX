class ScoreManager {
  /**
   * Calculate scores for the guesser and the artist
   * @param {object} room 
   * @param {string} playerId 
   * @returns {object} { pointsEarned, artistPoints }
   */
  calculateScore(room, playerId) {
    const isFirstGuess = room.gameState.correctGuessers.length === 1;
    const drawTime = room.settings.drawTime || 80;
    const remainingTime = room.gameState.timer;

    // Base score: 100 points
    let pointsEarned = 100;

    // First guess bonus: +50
    if (isFirstGuess) {
      pointsEarned += 50;
    }

    // Speed bonus: up to +50 points proportional to remaining time
    const speedBonus = Math.round((remainingTime / drawTime) * 50);
    pointsEarned += speedBonus;

    // Artist gets 50 points per correct guesser
    const artistPoints = 50;

    return {
      pointsEarned,
      artistPoints
    };
  }
}

module.exports = new ScoreManager();
