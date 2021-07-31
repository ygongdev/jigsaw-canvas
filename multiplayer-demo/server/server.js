const io = require('socket.io')(3000, {
  cors: {
    origin: ["http://localhost:8080"]
  }
});

let state = {};

io.on('connection', client => {
  client.on('start', handleStart);
  client.on('move', handleMove);

  function handleStart(gameState) {
    state = gameState;
    startGameInterval(client);
  }

  function handleMove({ idx, x, y}) {
    state.puzzle[idx].x = x;
    state.puzzle[idx].y = y;
  }
});


function startGameInterval(client) {
  const intervalId = setInterval(() => {
    client.emit('gameState', JSON.stringify(state));
  }, 1000 / 60);
}

