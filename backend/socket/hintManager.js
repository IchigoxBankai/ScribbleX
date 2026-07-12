const shuffle = require('../utils/shuffle');

class HintManager {
  /**
   * Initialize hint state for a new word
   * @param {string} word 
   * @returns {object} Hint state
   */
  initHintState(word) {
    const chars = word.split('');
    const currentHint = chars.map(char => (char === ' ' || char === '-' ? char : '_'));

    // Find all indexes of revealable characters (letters/numbers, not spaces or dashes)
    const revealableIndices = [];
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] !== ' ' && chars[i] !== '-') {
        revealableIndices.push(i);
      }
    }

    // Shuffle the indices so we reveal them in a random order
    const shuffleOrder = shuffle(revealableIndices);

    return {
      word,
      currentHint, // array of characters representing what's visible
      shuffleOrder, // order of indices to reveal
      revealedCount: 0
    };
  }

  /**
   * Update hint state based on elapsed time percentage
   * @param {object} hintState 
   * @param {number} percentageElapsed (0 to 100)
   * @returns {boolean} Whether a new hint was revealed
   */
  updateHint(hintState, percentageElapsed) {
    return false;
  }
}

module.exports = new HintManager();
