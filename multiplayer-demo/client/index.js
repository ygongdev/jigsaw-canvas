import { loadImage, random } from './util.js';
import { generatePuzzle } from '../../index.js';

const socket = io('http://localhost:3000');

socket.on('gameState', handleGameState);

class GameState {
  puzzle;

  constructor(puzzle) {
    this.puzzle = puzzle;
  }
}

class ServerPuzzleState { 
  row;
  col;
  x;
  y;
  imageSrc;
  isActive;

  constructor({
    row, col, x, y, imageSrc, isActive
  }) {
    this.row = row;
    this.col = col;
    this.x = x;
    this.y = y;
    this.imageSrc = imageSrc;
    this.isActive = isActive;
  }
}

const canvas = document.getElementById('original');
const container = document.getElementById("result");
let clientPuzzle;
let isDown;
let metadata;

init().then(puzzle => {
  clientPuzzle = puzzle;

  const serverPuzzle = clientPuzzle.map(p => 
    new ServerPuzzleState({
      x: p.style.left.replace('px', ''),
      y: p.style.top.replace('px', ''),
      isActive: false,
    })
  );
  const serverGameState = new GameState(serverPuzzle);
  console.log(serverGameState);
  socket.emit('start', serverGameState);
});

// Initialize the client puzzle and the game state
async function init() {

  const img = await loadImage("https://images.unsplash.com/photo-1478827217976-7214a0556393?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80");

  canvas.width = img.width;
  canvas.height = img.height;
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Creating the puzzle pieces
  const puzzle = await generatePuzzle(img, 25, 25);
  const puzzlePieces = puzzle.map(p => {
    const img = new Image();
    img.src = p.imageSrc;
    img.width = p.width;
    img.height = p.height;
    img.className = "unselectable";
    return img;
  });

  // shuffle(puzzlePieces);
  const fragment = document.createDocumentFragment();
  puzzlePieces.forEach(piece => {
    piece.classList.add("puzzle-piece")
    fragment.appendChild(piece);
  });

  container.appendChild(fragment);

  puzzlePieces.forEach((piece, idx) => {
    piece.dataset.index = idx;
    piece.style.position = "absolute";
    const { x, y } = random(canvas.offsetLeft, canvas.offsetTop, piece.width, piece.height, canvas.width, canvas.height);

    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;

    piece.addEventListener('dragstart', (event) => {
      return false;
    });

    ['mousedown', 'touchstart'].forEach(listener => piece.addEventListener(listener, (event) => {
      const x = event.clientX || event.touches[0].pageX;
      const y = event.clientY || event.touches[0].pageY;
      console.log('touchstart');
      if (isDown) {
        return;
      }

      isDown = true;
      metadata = {
        idx,
        offset: [
          piece.offsetLeft - x,
          piece.offsetTop - y
        ]
      }
    }, { passive: false}));
  });

  ['mouseup', 'touchend'].forEach(listener => container.addEventListener(listener, function() {
    console.log('touchend');
    isDown = false;
    metadata = undefined;
  }, { passive: false }));

  ['mousemove', 'touchmove'].forEach(listener => container.addEventListener(listener, (event) => {
    event.preventDefault();
    console.log(isDown);
    if (isDown) {
      const piece = puzzlePieces[metadata.idx];
      const x = event.clientX || event.touches[0].pageX;
      const y = event.clientY || event.touches[0].pageY;
      const newX = x + metadata.offset[0];
      const newY = y + metadata.offset[1];

      piece.style.left = `${newX}px`;
      piece.style.top = `${newY}px`;
      socket.emit('move', { idx: metadata.idx, x: newX, y: newY });
    }
  }, { passive: false }));

  return puzzlePieces;
}

// Render the game given the game state, match the updated server game state with the client game state
function render(gameState) {
  const serverPuzzle = gameState.puzzle;

  for (let i = 0; i < clientPuzzle.length; i++) {
    const sp = serverPuzzle[i];
    const cp = clientPuzzle[i];

    if (metadata?.idx === i) {
      return;
    }

    if (cp.style.left !== `${sp.x}px`) {
      cp.style.left = `${sp.x}px`;
    }

    if (cp.style.top !== `${sp.y}px`) {
      cp.style.top = `${sp.y}px`;
    }
  }
}

function handleGameState(gameState) {
  const state = JSON.parse(gameState);
  
  requestAnimationFrame(() => render(state));
}
