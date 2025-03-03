require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const { Chess } = require('chess.js');
const { GoogleStrategy, GitHubStrategy } = require('./auth');
const User = require('./models/User');
const Game = require('./models/Game');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const games = {};
const matchmakingQueue = [];

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to `true` if using HTTPS
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
require('./auth')(passport);

// Serve static files
app.use(express.static('client'));

// Leaderboard route
app.get('/leaderboard', async (req, res) => {
  const users = await User.find().sort({ rating: -1 }).limit(10);
  res.json(users);
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Matchmaking queue
  socket.on('joinQueue', async (userId) => {
    if (!matchmakingQueue.includes(userId)) {
      matchmakingQueue.push(userId);
    }

    if (matchmakingQueue.length >= 2) {
      const player1 = matchmakingQueue.shift();
      const player2 = matchmakingQueue.shift();

      const gameId = Math.random().toString(36).substr(2, 6);
      games[gameId] = {
        players: [player1, player2],
        chess: new Chess(),
        moves: []
      };

      io.to(player1).emit('gameFound', gameId);
      io.to(player2).emit('gameFound', gameId);
    }
  });

  // Chat functionality
  socket.on('sendMessage', (gameId, message) => {
    io.to(gameId).emit('receiveMessage', message);
  });

  // Create/join game
  socket.on('createGame', () => {
    const gameId = Math.random().toString(36).substr(2, 6);
    games[gameId] = {
      players: [socket.id],
      chess: new Chess(),
      moves: []
    };
    socket.join(gameId);
    socket.emit('gameCode', gameId);
  });

  socket.on('joinGame', (gameId) => {
    if (!games[gameId]) {
      return socket.emit('error', 'Game not found');
    }
    socket.join(gameId);
    games[gameId].players.push(socket.id);
    io.to(gameId).emit('gameStart', games[gameId].chess.fen());
  });

  socket.on('makeMove', (gameId, move) => {
    if (!games[gameId]) return;
    const game = games[gameId].chess;
    const result = game.move(move);
    if (result) {
      games[gameId].moves.push(move);
      io.to(gameId).emit('moveMade', game.fen());
    }
  });
});

// Auth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => res.redirect('/'));

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/' }), (req, res) => res.redirect('/'));

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
