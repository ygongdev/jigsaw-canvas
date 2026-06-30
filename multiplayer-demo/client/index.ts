import { generatePuzzle } from "../../src/index";
import { loadImage, random } from "./util";

interface MovePayload {
  idx: number;
  x: number;
  y: number;
}

interface SocketClient {
  emit(event: "start", gameState: GameState): void;
  emit(event: "move", move: MovePayload): void;
  on(event: "gameState", handler: (gameState: string) => void): void;
}

interface DragMetadata {
  idx: number;
  offset: [number, number];
}

declare const io: (url: string) => SocketClient;

const socket = io("http://localhost:3000");

socket.on("gameState", handleGameState);

class GameState {
  /**
   * Stores synchronized puzzle state.
   *
   * @param puzzle - Server puzzle pieces.
   */
  constructor(public puzzle: ServerPuzzleState[]) {}
}

class ServerPuzzleState {
  row?: number;
  col?: number;
  x: number;
  y: number;
  imageSrc?: string;
  isActive: boolean;

  /**
   * Creates a serializable puzzle piece state.
   *
   * @param state - Piece state.
   */
  constructor(state: {
    row?: number;
    col?: number;
    x: number;
    y: number;
    imageSrc?: string;
    isActive: boolean;
  }) {
    this.row = state.row;
    this.col = state.col;
    this.x = state.x;
    this.y = state.y;
    this.imageSrc = state.imageSrc;
    this.isActive = state.isActive;
  }
}

const canvas = getElement<HTMLCanvasElement>("#original");
const container = getElement<HTMLDivElement>("#result");
const playground = getElement<HTMLDivElement>("#playground");

let clientPuzzle: HTMLImageElement[] = [];
let isDown = false;
let metadata: DragMetadata | undefined;

init().then((puzzle) => {
  clientPuzzle = puzzle;

  const serverPuzzle = clientPuzzle.map(
    (p) =>
      new ServerPuzzleState({
        x: parseFloat(p.style.left) || 0,
        y: parseFloat(p.style.top) || 0,
        isActive: false,
      })
  );
  const serverGameState = new GameState(serverPuzzle);
  socket.emit("start", serverGameState);
});

/**
 * Returns a required DOM element.
 *
 * @param selector - Element selector.
 * @returns Matching DOM element.
 */
function getElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Could not find element: ${selector}`);
  }

  return element;
}

/**
 * Initializes the client puzzle and local game state.
 *
 * @returns Rendered puzzle pieces.
 */
async function init(): Promise<HTMLImageElement[]> {
  const img = await loadImage(
    "https://images.unsplash.com/photo-1478827217976-7214a0556393?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80"
  );

  canvas.width = img.width;
  canvas.height = img.height;

  const puzzle = await generatePuzzle(img, 25, 25);
  const puzzlePieces = puzzle.map((p) => {
    const img = new Image();
    img.src = p.imageSrc;
    img.width = p.containerWidth;
    img.height = p.containerHeight;
    img.className = "unselectable";
    return img;
  });

  const fragment = document.createDocumentFragment();
  puzzlePieces.forEach((piece) => {
    piece.classList.add("puzzle-piece");
    fragment.appendChild(piece);
  });

  container.appendChild(fragment);

  puzzlePieces.forEach((piece, idx) => {
    piece.dataset.index = `${idx}`;
    piece.style.position = "absolute";
    const { x, y } = random(
      canvas.offsetLeft,
      canvas.offsetTop,
      piece.width,
      piece.height,
      canvas.width,
      canvas.height
    );

    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;

    piece.addEventListener("dragstart", () => false);
    piece.addEventListener("mousedown", (event) => startDrag(event, piece, idx));
    piece.addEventListener("touchstart", (event) =>
      startDrag(event, piece, idx)
    );
  });

  playground.addEventListener("mouseup", endDrag);
  playground.addEventListener("touchend", endDrag);
  playground.addEventListener("mousemove", moveDrag);
  playground.addEventListener("touchmove", moveDrag, { passive: false });

  return puzzlePieces;
}

/**
 * Starts dragging one puzzle piece.
 *
 * @param event - Mouse or touch event.
 * @param piece - Puzzle piece.
 * @param idx - Puzzle piece index.
 * @returns Nothing.
 */
function startDrag(
  event: MouseEvent | TouchEvent,
  piece: HTMLImageElement,
  idx: number
): void {
  if (isDown) {
    return;
  }

  const { x, y } = getEventPoint(event);

  isDown = true;
  metadata = {
    idx,
    offset: [piece.offsetLeft - x, piece.offsetTop - y],
  };
}

/**
 * Ends the current drag.
 *
 * @returns Nothing.
 */
function endDrag(): void {
  isDown = false;
  metadata = undefined;
}

/**
 * Moves the active puzzle piece.
 *
 * @param event - Mouse or touch event.
 * @returns Nothing.
 */
function moveDrag(event: MouseEvent | TouchEvent): void {
  event.preventDefault();

  if (!isDown || !metadata) {
    return;
  }

  const piece = clientPuzzle[metadata.idx];
  const { x, y } = getEventPoint(event);
  let newX = x + metadata.offset[0];
  let newY = y + metadata.offset[1];
  const playgroundBoundaries = {
    minX: playground.offsetLeft,
    maxX: playground.offsetLeft + playground.offsetWidth - piece.offsetWidth,
    minY: playground.offsetTop,
    maxY: playground.offsetTop + playground.offsetHeight - piece.offsetHeight,
  };

  if (newX < playgroundBoundaries.minX) {
    newX = playgroundBoundaries.minX;
  } else if (newX > playgroundBoundaries.maxX) {
    newX = playgroundBoundaries.maxX;
  }

  if (newY < playgroundBoundaries.minY) {
    newY = playgroundBoundaries.minY;
  } else if (newY > playgroundBoundaries.maxY) {
    newY = playgroundBoundaries.maxY;
  }

  piece.style.left = `${newX}px`;
  piece.style.top = `${newY}px`;
  socket.emit("move", { idx: metadata.idx, x: newX, y: newY });
}

/**
 * Reads pointer coordinates from mouse or touch events.
 *
 * @param event - Mouse or touch event.
 * @returns Event point.
 */
function getEventPoint(event: MouseEvent | TouchEvent): { x: number; y: number } {
  if ("touches" in event) {
    return {
      x: event.touches[0]?.pageX ?? 0,
      y: event.touches[0]?.pageY ?? 0,
    };
  }

  return {
    x: event.clientX,
    y: event.clientY,
  };
}

/**
 * Renders server game state.
 *
 * @param gameState - Parsed server game state.
 * @returns Nothing.
 */
function render(gameState: GameState): void {
  const serverPuzzle = gameState.puzzle;

  for (let i = 0; i < clientPuzzle.length; i += 1) {
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

/**
 * Handles serialized server game state.
 *
 * @param gameState - Serialized game state.
 * @returns Nothing.
 */
function handleGameState(gameState: string): void {
  const state = JSON.parse(gameState) as GameState;

  requestAnimationFrame(() => render(state));
}
