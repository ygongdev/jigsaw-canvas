import { generatePuzzle } from './index.js';

function shuffle(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const idx = Math.floor(Math.random() * i);
    [arr[idx], arr[i]] = [arr[i], arr[idx]];
  }
}

async function main() {
  let isDown = false;
  let metadata = {};

  const container = document.getElementById("result");
  const canvas = document.getElementById("original");

  const image  = new Image();
  const loadPromise = new Promise(resolve => {
    image.onload = function() {
      resolve(this);
    }
    image.setAttribute('crossorigin', 'anonymous');
    image.src = "https://images.unsplash.com/photo-1478827217976-7214a0556393?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80"
  });

	const img = await loadPromise;

  canvas.width = img.width;
  canvas.height = img.height;
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  const puzzlePieces = await generatePuzzle(img, 10, 10);
  shuffle(puzzlePieces);
  const fragment = document.createDocumentFragment();
  puzzlePieces.forEach((piece, idx) => {
    piece.classList.add("puzzle-piece")
    fragment.appendChild(piece);
  });
  
  container.appendChild(fragment);

  puzzlePieces.forEach((piece, idx) => {
    piece.dataset.left = piece.offsetLeft;
    piece.dataset.top = piece.offsetTop;
  })

  puzzlePieces.forEach((piece, idx) => {
    piece.dataset.index = idx;
    piece.style.position = "absolute";
    piece.style.left = `${piece.dataset.left}px`;
    piece.style.top = `${piece.dataset.top}px`;

    piece.addEventListener('mousedown', function(event) {
      isDown = true;
      metadata = {
        idx,
        offset: [
          piece.offsetLeft - event.clientX,
          piece.offsetTop - event.clientY
        ]
      }
    });
  });

  document.addEventListener('mouseup', function() {
    isDown = false;
  })

  document.addEventListener('mousemove', function(event) {
    event.preventDefault();
    if (isDown) {
      const piece = puzzlePieces[metadata.idx];
      piece.style.left = `${event.clientX + metadata.offset[0]}px`;
      piece.style.top = `${event.clientY + metadata.offset[1]}px`;
    }
  })
}

main();