const fs = require('fs');
const path = require('path');
const shuffle = require('../utils/shuffle');

const GENRE_DIR = path.join(__dirname, '..', '..', 'genre');

class WordManager {
  /**
   * Get all categories based on folders in scribblex/genre
   * @returns {string[]} List of category names
   */
  static getAvailableCategories() {
    try {
      if (!fs.existsSync(GENRE_DIR)) {
        return [];
      }
      const items = fs.readdirSync(GENRE_DIR, { withFileTypes: true });
      return items
        .filter(item => item.isDirectory())
        .map(item => item.name);
    } catch (err) {
      console.error('Error scanning genre directory:', err);
      return [];
    }
  }

  /**
   * Load words from given categories (subdirectories of genre/)
   * @param {string[]} categories 
   * @returns {string[]} Merged list of words
   */
  static getWords(categories) {
    let mergedWords = [];
    if (!categories || categories.length === 0) {
      categories = ['general'];
    }

    categories.forEach(category => {
      const categoryDir = path.join(GENRE_DIR, category);
      if (fs.existsSync(categoryDir) && fs.statSync(categoryDir).isDirectory()) {
        try {
          const files = fs.readdirSync(categoryDir);
          const txtFiles = files.filter(file => file.endsWith('.txt'));
          
          txtFiles.forEach(file => {
            const filePath = path.join(categoryDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split(/\r?\n/);
            
            lines.forEach(line => {
              const trimmed = line.trim();
              // Ignore empty lines and comment/header lines starting with '#'
              if (trimmed && !trimmed.startsWith('#')) {
                mergedWords.push(trimmed);
              }
            });
          });
        } catch (e) {
          console.error(`Error loading category folder: ${categoryDir}`, e);
        }
      } else {
        console.warn(`Category folder not found: ${categoryDir}`);
      }
    });

    // Remove duplicates
    mergedWords = [...new Set(mergedWords)];

    // Fallback if no words could be loaded
    if (mergedWords.length === 0) {
      mergedWords = ['Apple', 'Banana', 'Orange', 'Car', 'House', 'Pencil', 'Sun', 'Moon', 'Tree', 'River'];
    }

    return shuffle(mergedWords);
  }
}

module.exports = WordManager;
