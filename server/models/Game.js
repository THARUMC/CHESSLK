const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  players: [String], // Array of player IDs
  moves: [String], // Array of chess moves
  result: String, // 'win', 'loss', 'draw'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
