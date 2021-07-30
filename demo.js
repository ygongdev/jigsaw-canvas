import { generatePuzzle } from './index.js';
const container = document.getElementById("result");
const canvas = document.getElementById("original");
const defaultPuzzle = document.querySelector('#default');
const dynamicPuzzle = document.querySelector('#dynamic');
const rows = document.querySelector('#rows');
const rowsValue= document.querySelector('#rows-value');
const cols = document.querySelector('#cols');
const colsValue= document.querySelector('#cols-value');
const playground = document.querySelector('#playground');
const hide = document.querySelector('#hide');

defaultPuzzle.addEventListener('click', function() {
  loadDefault();
  clear();
});

dynamicPuzzle.addEventListener('change', function() {
  const file = this.files && this.files[0];
  loadDynamic(file);
  this.value = "";
  clear();
});

rows.addEventListener('input', function() {
  rowsValue.textContent = this.value;
});

cols.addEventListener('input', function() {
  colsValue.textContent = this.value;
});

hide.addEventListener('click', function() {
  this.dataset.hidden = this.dataset.hidden === "true" ? "false" : "true";

  if (this.dataset.hidden === "true") {
    canvas.style.opacity = "0%";
  } else {
    canvas.style.opacity = "100%";
  }
});

function clear() {
  container.innerHTML = "";
}

function random(x, y, width, height, containerWidth, containerHeight) {
  console.log(y, height, (Math.random() * (containerHeight - height)));
  return {
    x: x + (Math.random() * (containerWidth - width)),
    y: y + (Math.random() * (containerHeight - height)),
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const idx = Math.floor(Math.random() * i);
    [arr[idx], arr[i]] = [arr[i], arr[idx]];
  }
}

async function loadImage(src) {
  const image  = new Image();
  const loadPromise = new Promise(resolve => {
    image.onload = function() {
      resolve(this);
    }
    image.setAttribute('crossorigin', 'anonymous');
    image.src = src;
  });

  return await loadPromise;
}

async function loadDynamic(file) {
  const img = await loadImage(URL.createObjectURL(file));
  canvas.width = img.width;
  canvas.height = img.height;
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  await render(img, parseInt(rowsValue.textContent, 10), parseInt(colsValue.textContent, 10));
}

async function loadDefault() {
	const img = await loadImage("https://images.unsplash.com/photo-1478827217976-7214a0556393?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80");

  canvas.width = img.width;
  canvas.height = img.height;
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  await render(img, parseInt(rowsValue.textContent, 10), parseInt(colsValue.textContent, 10));
}

async function render(img, rows, columns) {
  let isDown = false;
  let metadata = {};

  const puzzle = await generatePuzzle(img, rows, columns);
  const puzzlePieces = puzzle.map(p => {
    const img = new Image();
    img.src = p.imageSrc;
    img.width = p.width;
    img.height = p.height;
    return img;
  });

  shuffle(puzzlePieces);
  const fragment = document.createDocumentFragment();
  puzzlePieces.forEach((piece, idx) => {
    piece.classList.add("puzzle-piece")
    fragment.appendChild(piece);
  });
  
  container.appendChild(fragment);

  // puzzlePieces.forEach((piece, idx) => {
  //   piece.dataset.left = piece.offsetLeft;
  //   piece.dataset.top = piece.offsetTop;
  // })

  puzzlePieces.forEach((piece, idx) => {
    piece.dataset.index = idx;
    piece.style.position = "absolute";
    const { x, y } = random(canvas.offsetLeft, canvas.offsetTop, piece.width, piece.height, canvas.width, canvas.height);

    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;

    ['mousedown', 'touchstart'].forEach(listener => piece.addEventListener(listener, function(event) {
      const x = event.clientX || event.touches[0].pageX;
      const y = event.clientY || event.touches[0].pageY;

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

  ['mouseup', 'touchend'].forEach(listener => playground.addEventListener(listener, function() {
    isDown = false;
  }, { passive: false }));

  ['mousemove', 'touchmove'].forEach(listener => playground.addEventListener(listener, function(event) {
    event.preventDefault();
    if (isDown) {
      const piece = puzzlePieces[metadata.idx];
      const x = event.clientX || event.touches[0].pageX;
      const y = event.clientY || event.touches[0].pageY;
      piece.style.left = `${x + metadata.offset[0]}px`;
      piece.style.top = `${y + metadata.offset[1]}px`;
    }
  }, { passive: false }));
}