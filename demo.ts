import {
  generatePuzzleCanvas2D,
  generatePuzzleWebGPU,
  generatePuzzleWebGPUTextures,
  isWebGPUSupported,
  revokePuzzleImageSource,
  type GeneratePuzzleOptions,
  type PuzzleGenerationProgress,
  type RenderedPuzzlePiece,
  type WebGPUPuzzlePiece,
} from "./src/index";

type RendererMode =
  | "canvas2d-blob"
  | "canvas2d-data"
  | "webgpu-blob"
  | "webgpu-texture";

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

interface TextureSprite {
  bindGroup: GPUBindGroup;
  piece: WebGPUPuzzlePiece;
  uniformBuffer: GPUBuffer;
  x: number;
  y: number;
}

interface TextureDragState {
  offsetX: number;
  offsetY: number;
  pointerId: number;
  sprite: TextureSprite;
}

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1478827217976-7214a0556393?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80";
const GPU_BUFFER_USAGE = {
  COPY_DST: 8,
  UNIFORM: 64,
} as const;

const container = getElement<HTMLDivElement>("#result");
const playground = getElement<HTMLDivElement>("#playground");
const gpuCanvas = getElement<HTMLCanvasElement>("#gpu-result");
const canvas = getElement<HTMLCanvasElement>("#original");
const renderer = getElement<HTMLSelectElement>("#renderer");
const generateButton = getElement<HTMLButtonElement>("#generate");
const defaultPuzzle = getElement<HTMLButtonElement>("#default");
const dynamicPuzzle = getElement<HTMLInputElement>("#dynamic");
const rows = getElement<HTMLInputElement>("#rows");
const rowsValue = getElement<HTMLLabelElement>("#rows-value");
const cols = getElement<HTMLInputElement>("#cols");
const colsValue = getElement<HTMLLabelElement>("#cols-value");
const hide = getElement<HTMLButtonElement>("#hide");
const clearButton = getElement<HTMLButtonElement>("#clear");
const statusMessage = getElement<HTMLSpanElement>("#status-message");
const progressBar = getElement<HTMLProgressElement>("#generation-progress");
const progressPercent = getElement<HTMLSpanElement>("#progress-percent");
const progressPieces = getElement<HTMLSpanElement>("#progress-pieces");
const progressPiece = getElement<HTMLSpanElement>("#progress-piece");
const progressElapsed = getElement<HTMLSpanElement>("#progress-elapsed");

let activeDrag: DragState | undefined;
let currentImage: HTMLImageElement | undefined;
let isGenerating = false;
let textureRenderer: TexturePreviewRenderer | undefined;

generateButton.addEventListener("click", () => {
  void generateCurrentPuzzle();
});

defaultPuzzle.addEventListener("click", () => {
  void loadDefault();
});

dynamicPuzzle.addEventListener("change", function () {
  const file = this.files?.[0];

  if (!file) {
    return;
  }

  void loadDynamic(file);
  this.value = "";
});

renderer.addEventListener("change", () => {
  if (!isGenerating && currentImage) {
    setStatus("Renderer changed. Press Generate.");
  }
});

rows.addEventListener("input", function () {
  rowsValue.textContent = `Rows: ${this.value}`;
});

cols.addEventListener("input", function () {
  colsValue.textContent = `Columns: ${this.value}`;
});

hide.addEventListener("click", function () {
  this.dataset.hidden = this.dataset.hidden === "true" ? "false" : "true";
  const hidden = this.dataset.hidden === "true";
  canvas.style.opacity = hidden ? "0" : "1";
  this.textContent = hidden ? "Show Source" : "Hide Source";
});

clearButton.addEventListener("click", clear);

void loadDefault();

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
  container.querySelectorAll<HTMLImageElement>("img").forEach((piece) => {
    revokePuzzleImageSource(piece.src);
  });
  container.innerHTML = "";
  container.classList.remove("active");
  gpuCanvas.classList.remove("active");
  textureRenderer?.clear();
  activeDrag = undefined;
  setStatus("");
  resetProgress();
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
    x: x + Math.random() * Math.max(0, containerWidth - width),
    y: y + Math.random() * Math.max(0, containerHeight - height),
  };
}

/**
 * Shuffles an array in place.
 *
 * @param arr - Array to shuffle.
 * @returns Nothing.
 */
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const idx = Math.floor(Math.random() * (i + 1));
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

  return await new Promise((resolve, reject) => {
    image.onload = function () {
      resolve(this as HTMLImageElement);
    };
    image.onerror = function () {
      reject(new Error(`Could not load image: ${src}`));
    };
    image.setAttribute("crossorigin", "anonymous");
    image.src = src;
  });
}

/**
 * Loads a user-selected source image.
 *
 * @param file - Image file.
 * @returns Nothing.
 */
async function loadDynamic(file: File): Promise<void> {
  const src = URL.createObjectURL(file);

  try {
    await loadSource(src, "Image loaded. Press Generate.");
  } finally {
    URL.revokeObjectURL(src);
  }
}

/**
 * Loads the default source image.
 *
 * @returns Nothing.
 */
async function loadDefault(): Promise<void> {
  await loadSource(DEFAULT_IMAGE, "Default image loaded. Press Generate.");
}

/**
 * Loads a source image for the next generation run.
 *
 * @param src - Image source.
 * @param message - Status message after loading.
 * @returns Nothing.
 */
async function loadSource(src: string, message: string): Promise<void> {
  setStatus("Loading image...");
  resetProgress();
  currentImage = await loadImage(src);
  drawSourceImage(currentImage);
  syncBoardSize(currentImage);
  setStatus(message);
}

/**
 * Draws the source image preview.
 *
 * @param img - Source image.
 * @returns Nothing.
 */
function drawSourceImage(img: HTMLImageElement): void {
  canvas.width = img.width;
  canvas.height = img.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create a 2D canvas context.");
  }

  context.drawImage(img, 0, 0, canvas.width, canvas.height);
}

/**
 * Generates the selected puzzle variant.
 *
 * @returns Nothing.
 */
async function generateCurrentPuzzle(): Promise<void> {
  if (!currentImage || isGenerating) {
    return;
  }

  const mode = renderer.value as RendererMode;
  const rowCount = parseInt(rows.value, 10);
  const columnCount = parseInt(cols.value, 10);

  setGenerating(true);

  try {
    clear();
    syncBoardSize(currentImage);
    setStatus("Generating...");

    if (mode === "webgpu-texture") {
      await renderTexturePuzzle(currentImage, rowCount, columnCount);
    } else {
      await renderImageSourcePuzzle(currentImage, rowCount, columnCount, mode);
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not generate puzzle.");
  } finally {
    setGenerating(false);
  }
}

/**
 * Sizes the output surfaces to match the source image.
 *
 * @param img - Source image.
 * @returns Nothing.
 */
function syncBoardSize(img: HTMLImageElement): void {
  container.style.width = `${img.width}px`;
  container.style.height = `${img.height}px`;
  gpuCanvas.width = img.width;
  gpuCanvas.height = img.height;
  playground.style.width = `${img.width}px`;
  playground.style.height = `${img.height}px`;
}

/**
 * Renders a DOM image-source puzzle variant.
 *
 * @param img - Source image.
 * @param rowCount - Number of puzzle rows.
 * @param columnCount - Number of puzzle columns.
 * @param mode - Renderer mode.
 * @returns Nothing.
 */
async function renderImageSourcePuzzle(
  img: HTMLImageElement,
  rowCount: number,
  columnCount: number,
  mode: Exclude<RendererMode, "webgpu-texture">
): Promise<void> {
  const label = getRendererLabel(mode);
  const progress = createProgressHandler(label);
  const options: GeneratePuzzleOptions = {
    imageOutput: mode === "canvas2d-data" ? "data-url" : "blob-url",
    onProgress: progress.onProgress,
  };
  const puzzle =
    mode === "webgpu-blob"
      ? await generatePuzzleWebGPUWithSupportCheck(img, rowCount, columnCount, options)
      : await generatePuzzleCanvas2D(img, rowCount, columnCount, options);

  renderDraggableImages(puzzle);
  container.classList.add("active");
  setStatus(
    `${label}: ${puzzle.length} image-source pieces generated in ${formatElapsed(
      progress.elapsedMs
    )}.`
  );
}

/**
 * Renders a WebGPU texture puzzle variant.
 *
 * @param img - Source image.
 * @param rowCount - Number of puzzle rows.
 * @param columnCount - Number of puzzle columns.
 * @returns Nothing.
 */
async function renderTexturePuzzle(
  img: HTMLImageElement,
  rowCount: number,
  columnCount: number
): Promise<void> {
  if (!isWebGPUSupported()) {
    throw new Error("WebGPU is not available in this browser.");
  }

  textureRenderer ??= await TexturePreviewRenderer.create(gpuCanvas);
  const progress = createProgressHandler("WebGPU textures");
  const pieces = await generatePuzzleWebGPUTextures(img, rowCount, columnCount, {
    device: textureRenderer.device,
    onProgress: progress.onProgress,
  });

  gpuCanvas.classList.add("active");
  textureRenderer.setPieces(pieces);
  setStatus(
    `WebGPU textures: ${pieces.length} GPU texture pieces generated in ${formatElapsed(
      progress.elapsedMs
    )}.`
  );
}

/**
 * Generates WebGPU image-source pieces after checking support.
 *
 * @param img - Source image.
 * @param rowCount - Number of puzzle rows.
 * @param columnCount - Number of puzzle columns.
 * @param options - Generator options.
 * @returns Rendered puzzle pieces.
 */
async function generatePuzzleWebGPUWithSupportCheck(
  img: HTMLImageElement,
  rowCount: number,
  columnCount: number,
  options: GeneratePuzzleOptions
): Promise<RenderedPuzzlePiece[]> {
  if (!isWebGPUSupported()) {
    throw new Error("WebGPU is not available in this browser.");
  }

  return await generatePuzzleWebGPU(img, rowCount, columnCount, options);
}

/**
 * Renders draggable DOM image pieces.
 *
 * @param puzzle - Rendered puzzle pieces.
 * @returns Nothing.
 */
function renderDraggableImages(puzzle: RenderedPuzzlePiece[]): void {
  const puzzlePieces = puzzle.map((p) => {
    const img = new Image();
    img.src = p.imageSrc;
    img.width = p.containerWidth;
    img.height = p.containerHeight;
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
      0,
      0,
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
}

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
  activeDrag.piece.style.top = `${activeDrag.startTop + activeDrag.translateY}px`;
  activeDrag.piece.style.transform = "";
  activeDrag.piece.style.willChange = "";

  if (activeDrag.piece.hasPointerCapture(event.pointerId)) {
    activeDrag.piece.releasePointerCapture(event.pointerId);
  }

  activeDrag = undefined;
}

/**
 * Updates status text.
 *
 * @param message - Status message.
 * @returns Nothing.
 */
function setStatus(message: string): void {
  statusMessage.textContent = message;
}

function setGenerating(generating: boolean): void {
  isGenerating = generating;
  renderer.disabled = generating;
  generateButton.disabled = generating || !currentImage;
  defaultPuzzle.disabled = generating;
  dynamicPuzzle.disabled = generating;
  clearButton.disabled = generating;
}

function resetProgress(): void {
  progressBar.max = 1;
  progressBar.value = 0;
  progressPercent.textContent = "-";
  progressPieces.textContent = "-";
  progressPiece.textContent = "-";
  progressElapsed.textContent = "-";
}

function setProgress(progress: PuzzleGenerationProgress): void {
  progressBar.max = progress.totalPieces || 1;
  progressBar.value = progress.completedPieces;
  progressPercent.textContent = `${Math.round(progress.progress * 100)}%`;
  progressPieces.textContent = `${progress.completedPieces} / ${progress.totalPieces}`;
  progressPiece.textContent = `${progress.pieceIndex + 1}`;
  progressElapsed.textContent = formatElapsed(progress.elapsedMs);
}

function createProgressHandler(label: string): {
  elapsedMs: number;
  onProgress: (progress: PuzzleGenerationProgress) => void;
} {
  const handler: {
    elapsedMs: number;
    onProgress: (progress: PuzzleGenerationProgress) => void;
  } = {
    elapsedMs: 0,
    onProgress(progress) {
      handler.elapsedMs = progress.elapsedMs;
      setStatus(label);
      setProgress(progress);
    },
  };

  return handler;
}

function formatElapsed(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

function getRendererLabel(mode: RendererMode): string {
  switch (mode) {
    case "canvas2d-blob":
      return "Canvas2D blob URLs";
    case "canvas2d-data":
      return "Canvas2D data URLs";
    case "webgpu-blob":
      return "WebGPU blob URLs";
    case "webgpu-texture":
      return "WebGPU textures";
  }
}

class TexturePreviewRenderer {
  readonly device: GPUDevice;

  private activeDrag: TextureDragState | undefined;
  private readonly context: GPUCanvasContext;
  private readonly format: GPUTextureFormat;
  private readonly pipeline: GPURenderPipeline;
  private readonly sampler: GPUSampler;
  private sprites: TextureSprite[] = [];

  /**
   * Creates a WebGPU texture preview renderer.
   *
   * @param canvas - Output canvas.
   * @param device - GPU device.
   * @param context - Canvas context.
   */
  private constructor(
    canvas: HTMLCanvasElement,
    device: GPUDevice,
    context: GPUCanvasContext
  ) {
    this.device = device;
    this.context = context;
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });
    this.pipeline = this.createPipeline();

    context.configure({
      alphaMode: "premultiplied",
      device,
      format: this.format,
    });

    canvas.addEventListener("pointerdown", (event) => this.startDrag(event));
    canvas.addEventListener("pointermove", (event) => this.moveDrag(event));
    canvas.addEventListener("pointerup", (event) => this.endDrag(event));
    canvas.addEventListener("pointercancel", (event) => this.endDrag(event));
  }

  /**
   * Creates a texture preview renderer.
   *
   * @param canvas - Output canvas.
   * @returns Texture renderer.
   */
  static async create(canvas: HTMLCanvasElement): Promise<TexturePreviewRenderer> {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error("Could not request a WebGPU adapter.");
    }

    const device = await adapter.requestDevice();
    const context = canvas.getContext("webgpu") as GPUCanvasContext | null;
    if (!context) {
      throw new Error("Could not create a WebGPU canvas context.");
    }

    return new TexturePreviewRenderer(canvas, device, context);
  }

  /**
   * Replaces rendered texture pieces.
   *
   * @param pieces - GPU puzzle pieces.
   * @returns Nothing.
   */
  setPieces(pieces: WebGPUPuzzlePiece[]): void {
    this.clear();

    this.sprites = pieces.map((piece) => {
      const { x, y } = random(
        0,
        0,
        piece.containerWidth,
        piece.containerHeight,
        gpuCanvas.width,
        gpuCanvas.height
      );
      const uniformBuffer = this.device.createBuffer({
        size: 32,
        usage: GPU_BUFFER_USAGE.COPY_DST | GPU_BUFFER_USAGE.UNIFORM,
      });
      const bindGroup = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: piece.textureView },
          { binding: 1, resource: this.sampler },
          { binding: 2, resource: { buffer: uniformBuffer } },
        ],
      });
      const sprite = { bindGroup, piece, uniformBuffer, x, y };

      this.writeSpriteUniform(sprite);

      return sprite;
    });

    this.render();
  }

  /**
   * Clears rendered texture pieces.
   *
   * @returns Nothing.
   */
  clear(): void {
    for (const sprite of this.sprites) {
      sprite.uniformBuffer.destroy();
      sprite.piece.destroy();
    }

    this.sprites = [];
    this.render();
  }

  /**
   * Creates the display render pipeline.
   *
   * @returns Render pipeline.
   */
  private createPipeline(): GPURenderPipeline {
    return this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: this.device.createShaderModule({ code: TEXTURE_PREVIEW_SHADER }),
        entryPoint: "vertexMain",
      },
      fragment: {
        module: this.device.createShaderModule({ code: TEXTURE_PREVIEW_SHADER }),
        entryPoint: "fragmentMain",
        targets: [
          {
            format: this.format,
            blend: {
              color: {
                operation: "add",
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
              },
              alpha: {
                operation: "add",
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
    });
  }

  /**
   * Renders the texture scene.
   *
   * @returns Nothing.
   */
  private render(): void {
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: { r: 0.55, g: 0.58, b: 0.63, a: 1 },
          loadOp: "clear",
          storeOp: "store",
          view: this.context.getCurrentTexture().createView(),
        },
      ],
    });

    pass.setPipeline(this.pipeline);

    for (const sprite of this.sprites) {
      pass.setBindGroup(0, sprite.bindGroup);
      pass.draw(6);
    }

    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }

  /**
   * Writes one sprite's transform uniform.
   *
   * @param sprite - Sprite to update.
   * @returns Nothing.
   */
  private writeSpriteUniform(sprite: TextureSprite): void {
    this.device.queue.writeBuffer(
      sprite.uniformBuffer,
      0,
      new Float32Array([
        gpuCanvas.width,
        gpuCanvas.height,
        sprite.x,
        sprite.y,
        sprite.piece.containerWidth,
        sprite.piece.containerHeight,
        0,
        0,
      ])
    );
  }

  /**
   * Starts dragging a texture sprite.
   *
   * @param event - Pointer event.
   * @returns Nothing.
   */
  private startDrag(event: PointerEvent): void {
    const point = this.getCanvasPoint(event);

    for (let index = this.sprites.length - 1; index >= 0; index -= 1) {
      const sprite = this.sprites[index];

      if (!this.containsPoint(sprite, point)) {
        continue;
      }

      this.sprites.splice(index, 1);
      this.sprites.push(sprite);
      gpuCanvas.setPointerCapture(event.pointerId);
      this.activeDrag = {
        offsetX: point.x - sprite.x,
        offsetY: point.y - sprite.y,
        pointerId: event.pointerId,
        sprite,
      };
      this.render();
      return;
    }
  }

  /**
   * Moves the active texture sprite.
   *
   * @param event - Pointer event.
   * @returns Nothing.
   */
  private moveDrag(event: PointerEvent): void {
    if (!this.activeDrag || this.activeDrag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const point = this.getCanvasPoint(event);
    const sprite = this.activeDrag.sprite;
    sprite.x = Math.min(
      Math.max(0, point.x - this.activeDrag.offsetX),
      Math.max(0, gpuCanvas.width - sprite.piece.containerWidth)
    );
    sprite.y = Math.min(
      Math.max(0, point.y - this.activeDrag.offsetY),
      Math.max(0, gpuCanvas.height - sprite.piece.containerHeight)
    );

    this.writeSpriteUniform(sprite);
    requestAnimationFrame(() => this.render());
  }

  /**
   * Ends the active texture drag.
   *
   * @param event - Pointer event.
   * @returns Nothing.
   */
  private endDrag(event: PointerEvent): void {
    if (!this.activeDrag || this.activeDrag.pointerId !== event.pointerId) {
      return;
    }

    if (gpuCanvas.hasPointerCapture(event.pointerId)) {
      gpuCanvas.releasePointerCapture(event.pointerId);
    }

    this.activeDrag = undefined;
  }

  /**
   * Converts a pointer event to canvas coordinates.
   *
   * @param event - Pointer event.
   * @returns Canvas point.
   */
  private getCanvasPoint(event: PointerEvent): Point {
    const rect = gpuCanvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * gpuCanvas.width,
      y: ((event.clientY - rect.top) / rect.height) * gpuCanvas.height,
    };
  }

  /**
   * Returns whether a point is inside a sprite rectangle.
   *
   * @param sprite - Sprite.
   * @param point - Point.
   * @returns True when the point is inside.
   */
  private containsPoint(sprite: TextureSprite, point: Point): boolean {
    return (
      point.x >= sprite.x &&
      point.x <= sprite.x + sprite.piece.containerWidth &&
      point.y >= sprite.y &&
      point.y <= sprite.y + sprite.piece.containerHeight
    );
  }
}

const TEXTURE_PREVIEW_SHADER = `
struct Uniforms {
  canvasSize: vec2f,
  position: vec2f,
  size: vec2f,
  padding: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@group(0) @binding(0) var pieceTexture: texture_2d<f32>;
@group(0) @binding(1) var pieceSampler: sampler;
@group(0) @binding(2) var<uniform> uniforms: Uniforms;

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var positions = array<vec2f, 6>(
    vec2f(0.0, 0.0),
    vec2f(1.0, 0.0),
    vec2f(0.0, 1.0),
    vec2f(0.0, 1.0),
    vec2f(1.0, 0.0),
    vec2f(1.0, 1.0)
  );
  let uv = positions[vertexIndex];
  let pixel = uniforms.position + uv * uniforms.size;
  let clip = vec2f(
    pixel.x / uniforms.canvasSize.x * 2.0 - 1.0,
    1.0 - pixel.y / uniforms.canvasSize.y * 2.0
  );
  var output: VertexOutput;
  output.position = vec4f(clip, 0.0, 1.0);
  output.uv = uv;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return textureSampleLevel(pieceTexture, pieceSampler, input.uv, 0.0);
}
`;
