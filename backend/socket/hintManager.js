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
    if (!hintState || !hintState.shuffleOrder || hintState.shuffleOrder.length === 0) {
      return false;
    }

    const totalRevealable = hintState.shuffleOrder.length;
    let targetRevealCount = 0;

    // Rules:
    // - 20% elapsed: reveal 20% of letters (min 1, max totalRevealable - 1)
    // - 50% elapsed: reveal 50% of letters (min 2, max totalRevealable - 1)
    // - 80% elapsed: reveal 80% of letters (min 3, max totalRevealable - 1)
    if (percentageElapsed >= 80) {
      targetRevealCount = Math.max(3, Math.floor(totalRevealable * 0.8));
    } else if (percentageElapsed >= 50) {
      targetRevealCount = Math.max(2, Math.floor(totalRevealable * 0.5));
    } else if (percentageElapsed >= 20) {
      targetRevealCount = Math.max(1, Math.floor(totalRevealable * 0.2));
    }

    // Guard: never reveal the entire word (leave at least 1 char hidden unless word has only 1 char)
    if (totalRevealable > 1 && targetRevealCount >= totalRevealable) {
      targetRevealCount = totalRevealable - 1;
    }

    let revealedAny = false;
    while (hintState.revealedCount < targetRevealCount) {
      const indexToReveal = hintState.shuffleOrder[hintState.revealedCount];
      hintState.currentHint[indexToReveal] = hintState.word[indexToReveal];
      hintState.revealedCount++;
      revealedAny = true;
    }

    return revealedAny;
  }
}

module.exports = new HintManager();
