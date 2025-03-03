const socket = io('https://bloghouse.space');
let userId = null;

// Check authentication status
fetch('/profile')
  .then(response => response.json())
  .then(user => {
    if (user) {
      document.getElementById('auth').style.display = 'none';
      document.getElementById('userProfile').style.display = 'block';
      document.getElementById('avatar').src = user.avatar;
      document.getElementById('username').innerText = user.displayName;
      userId = user.providerId;
    }
  });

// Chessboard and multiplayer logic
let game = new Chess();
let board = Chessboard('board', {
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop
});
let gameId = null;

document.getElementById('createGame').addEventListener('click', () => {
  socket.emit('createGame');
});

document.getElementById('joinQueue').addEventListener('click', () => {
  socket.emit('joinQueue', userId);
});

socket.on('gameCode', (code) => {
  alert(`Game code: ${code}`);
  gameId = code;
});

socket.on('gameStart', (fen) => {
  game.load(fen);
  board.position(fen);
});

socket.on('moveMade', (fen) => {
  game.load(fen);
  board.position(fen);
});

function onDragStart(source, piece) {
  if (game.game_over()) return false;
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function onDrop(source, target) {
  const move = game.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';
  socket.emit('makeMove', gameId, move);
  return true;
}

// Chat functionality
document.getElementById('sendChat').addEventListener('click', () => {
  const message = document.getElementById('chatInput').value;
  socket.emit('sendMessage', gameId, message);
  document.getElementById('chatInput').value = '';
});

socket.on('receiveMessage', (message) => {
  const messages = document.getElementById('messages');
  const li = document.createElement('li');
  li.textContent = message;
  messages.appendChild(li);
});

// Leaderboard
fetch('/leaderboard')
  .then(response => response.json())
  .then(users => {
    const leaderboard = document.getElementById('leaderboardList');
    users.forEach(user => {
      const li = document.createElement('li');
      li.textContent = `${user.displayName} (${user.rating})`;
      leaderboard.appendChild(li);
    });
  });
