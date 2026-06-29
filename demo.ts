import { generatePuzzle } from "./dist/index.js";

interface DragState {
  frameId: number;
  piece: HTMLImageElement;
  pointerId: number;
  startLeft: number;
  startTop: number;
  startX: number;
  startY: number;
  translateX: number;
  translateY: number;
}

interface Point {
  x: number;
  y: number;
}

const container = getElement<HTMLDivElement>("#result");
const canvas = getElement<HTMLCanvasElement>("#original");
const defaultPuzzle = getElement<HTMLButtonElement>("#default");
const dynamicPuzzle = getElement<HTMLInputElement>("#dynamic");
const rows = getElement<HTMLInputElement>("#rows");
const rowsValue = getElement<HTMLLabelElement>("#rows-value");
const cols = getElement<HTMLInputElement>("#cols");
const colsValue = getElement<HTMLLabelElement>("#cols-value");
const hide = getElement<HTMLButtonElement>("#hide");

defaultPuzzle.addEventListener("click", () => {
  loadDefault();
  clear();
});

dynamicPuzzle.addEventListener("change", function () {
  const file = this.files?.[0];

  if (!file) {
    return;
  }

  loadDynamic(file);
  this.value = "";
  clear();
});

rows.addEventListener("input", function () {
  rowsValue.textContent = this.value;
});

cols.addEventListener("input", function () {
  colsValue.textContent = this.value;
});

hide.addEventListener("click", function () {
  this.dataset.hidden = this.dataset.hidden === "true" ? "false" : "true";
  canvas.style.opacity = this.dataset.hidden === "true" ? "0%" : "100%";
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
 * Clears rendered puzzle pieces.
 *
 * @returns Nothing.
 */
function clear(): void {
  container.innerHTML = "";
}

/**
 * Creates a random point inside a container.
 *
 * @param x - Container x origin.
 * @param y - Container y origin.
 * @param width - Element width.
 * @param height - Element height.
 * @param containerWidth - Container width.
 * @param containerHeight - Container height.
 * @returns Random point.
 */
function random(
  x: number,
  y: number,
  width: number,
  height: number,
  containerWidth: number,
  containerHeight: number
): Point {
  return {
    x: x + Math.random() * (containerWidth - width),
    y: y + Math.random() * (containerHeight - height),
  };
}

/**
 * Shuffles an array in place.
 *
 * @param arr - Array to shuffle.
 * @returns Nothing.
 */
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i >= 0; i -= 1) {
    const idx = Math.floor(Math.random() * i);
    [arr[idx], arr[i]] = [arr[i], arr[idx]];
  }
}

/**
 * Loads an image.
 *
 * @param src - Image URL.
 * @returns Loaded image.
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();

  return await new Promise((resolve) => {
    image.onload = function () {
      resolve(this as HTMLImageElement);
    };
    image.setAttribute("crossorigin", "anonymous");
    image.src = src;
  });
}

/**
 * Loads and renders a user-selected image.
 *
 * @param file - Image file.
 * @returns Nothing.
 */
async function loadDynamic(file: File): Promise<void> {
  const img = await loadImage(URL.createObjectURL(file));
  canvas.width = img.width;
  canvas.height = img.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create a 2D canvas context.");
  }

  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  await render(
    img,
    parseInt(rowsValue.textContent ?? "0", 10),
    parseInt(colsValue.textContent ?? "0", 10)
  );
}

/**
 * Loads and renders the default image.
 *
 * @returns Nothing.
 */
async function loadDefault(): Promise<void> {
  const img = await loadImage(
    "https://images.unsplash.com/photo-1478827217976-7214a0556393?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80"
  );

  canvas.width = img.width;
  canvas.height = img.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not create a 2D canvas context.");
  }

  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  await render(
    img,
    parseInt(rowsValue.textContent ?? "0", 10),
    parseInt(colsValue.textContent ?? "0", 10)
  );
}

/**
 * Renders draggable puzzle pieces.
 *
 * @param img - Source image.
 * @param rows - Number of puzzle rows.
 * @param columns - Number of puzzle columns.
 * @returns Nothing.
 */
async function render(
  img: HTMLImageElement,
  rows: number,
  columns: number
): Promise<void> {
  let activeDrag: DragState | undefined;
  const puzzle = await generatePuzzle(img, rows, columns);
  const puzzlePieces = puzzle.map((p) => {
    const img = new Image();
    img.src = p.imageSrc;
    img.width = p.width;
    img.height = p.height;
    return img;
  });

  shuffle(puzzlePieces);
  const fragment = document.createDocumentFragment();
  puzzlePieces.forEach((piece) => {
    piece.classList.add("puzzle-piece");
    fragment.appendChild(piece);
  });

  container.appendChild(fragment);

  puzzlePieces.forEach((piece, idx) => {
    piece.dataset.index = `${idx}`;
    piece.style.position = "absolute";
    piece.style.touchAction = "none";
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

    piece.addEventListener("pointerdown", startDrag);
    piece.addEventListener("pointermove", moveDrag);
    piece.addEventListener("pointerup", endDrag);
    piece.addEventListener("pointercancel", endDrag);
  });

  /**
   * Starts a transform-based drag for one puzzle piece.
   *
   * @param event - Pointer down event.
   * @returns Nothing.
   */
  function startDrag(event: PointerEvent): void {
    event.preventDefault();

    const piece = event.currentTarget;
    if (!(piece instanceof HTMLImageElement)) {
      return;
    }

    piece.setPointerCapture(event.pointerId);
    piece.style.willChange = "transform";

    activeDrag = {
      frameId: 0,
      piece,
      pointerId: event.pointerId,
      startLeft: parseFloat(piece.style.left) || 0,
      startTop: parseFloat(piece.style.top) || 0,
      startX: event.clientX,
      startY: event.clientY,
      translateX: 0,
      translateY: 0,
    };
  }

  /**
   * Records the latest pointer delta and schedules a frame.
   *
   * @param event - Pointer move event.
   * @returns Nothing.
   */
  function moveDrag(event: PointerEvent): void {
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    activeDrag.translateX = event.clientX - activeDrag.startX;
    activeDrag.translateY = event.clientY - activeDrag.startY;

    if (!activeDrag.frameId) {
      activeDrag.frameId = requestAnimationFrame(applyDragTransform);
    }
  }

  /**
   * Applies the pending drag transform once per animation frame.
   *
   * @returns Nothing.
   */
  function applyDragTransform(): void {
    if (!activeDrag) {
      return;
    }

    activeDrag.piece.style.transform = `translate3d(${activeDrag.translateX}px, ${activeDrag.translateY}px, 0)`;
    activeDrag.frameId = 0;
  }

  /**
   * Commits the final drag position with one layout-affecting update.
   *
   * @param event - Pointer up or cancel event.
   * @returns Nothing.
   */
  function endDrag(event: PointerEvent): void {
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    if (activeDrag.frameId) {
      cancelAnimationFrame(activeDrag.frameId);
    }

    activeDrag.piece.style.left = `${
      activeDrag.startLeft + activeDrag.translateX
    }px`;
    activeDrag.piece.style.top = `${
      activeDrag.startTop + activeDrag.translateY
    }px`;
    activeDrag.piece.style.transform = "";
    activeDrag.piece.style.willChange = "";

    if (activeDrag.piece.hasPointerCapture(event.pointerId)) {
      activeDrag.piece.releasePointerCapture(event.pointerId);
    }

    activeDrag = undefined;
  }
}
