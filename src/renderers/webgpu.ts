import { createPuzzleLayout } from "../core/layout.js";
import { RenderedPuzzlePieceData } from "./piece.js";
import { createPieceOutlinePoints, type Point } from "./outline.js";
import { encodeCanvasImageSource } from "./encoding.js";
import { createProgressReporter } from "./progress.js";
import type {
  PieceMargins,
  PieceShape,
  PuzzleImage,
  PuzzlePieceLayout,
  RenderedPuzzlePiece,
} from "../core/types.js";
import type { GeneratePuzzleOptions } from "./types.js";

const TEXTURE_FORMAT: GPUTextureFormat = "rgba8unorm";
const BYTES_PER_PIXEL = 4;
const COPY_BYTES_PER_ROW_ALIGNMENT = 256;
const GPU_TEXTURE_USAGE = {
  COPY_SRC: 1,
  COPY_DST: 2,
  TEXTURE_BINDING: 4,
  RENDER_ATTACHMENT: 16,
} as const;
const GPU_BUFFER_USAGE = {
  MAP_READ: 1,
  COPY_DST: 8,
  VERTEX: 32,
} as const;
const GPU_MAP_MODE = {
  READ: 1,
} as const;

export interface GeneratePuzzleWebGPUOptions extends GeneratePuzzleOptions {
  device?: GPUDevice;
  powerPreference?: GPUPowerPreference;
}

export type GeneratePuzzleWebGPUTextureOptions = Omit<
  GeneratePuzzleWebGPUOptions,
  "imageOutput" | "imageQuality" | "imageType"
>;

export interface WebGPUPuzzlePiece extends PuzzlePieceLayout {
  readonly texture: GPUTexture;
  readonly textureView: GPUTextureView;
  readonly widthPercentage: number;
  readonly heightPercentage: number;
  destroy(): void;
}

class WebGPUPuzzlePieceData implements WebGPUPuzzlePiece {
  private readonly view: GPUTextureView;

  /**
   * Wraps layout data with a GPU texture.
   *
   * @param layout - Piece layout data.
   * @param texture - Rendered piece texture.
   */
  constructor(
    private readonly layout: PuzzlePieceLayout,
    readonly texture: GPUTexture
  ) {
    this.view = texture.createView();
  }

  /**
   * Returns the piece edge shape map.
   *
   * @returns Piece edge shape map.
   */
  get shape(): PieceShape {
    return this.layout.shape;
  }

  /**
   * Returns transparent margins around the base piece.
   *
   * @returns Piece margins.
   */
  get margins(): PieceMargins {
    return this.layout.margins;
  }

  /**
   * Returns the rendered texture view.
   *
   * @returns Texture view.
   */
  get textureView(): GPUTextureView {
    return this.view;
  }

  /**
   * Returns the rendered texture width.
   *
   * @returns Texture width.
   */
  get containerWidth(): number {
    return this.layout.containerWidth;
  }

  /**
   * Returns the rendered texture height.
   *
   * @returns Texture height.
   */
  get containerHeight(): number {
    return this.layout.containerHeight;
  }

  /**
   * Returns the base piece width.
   *
   * @returns Base piece width.
   */
  get width(): number {
    return this.layout.width;
  }

  /**
   * Returns the base piece height.
   *
   * @returns Base piece height.
   */
  get height(): number {
    return this.layout.height;
  }

  /**
   * Returns the puzzle row.
   *
   * @returns Puzzle row.
   */
  get row(): number {
    return this.layout.row;
  }

  /**
   * Returns the puzzle column.
   *
   * @returns Puzzle column.
   */
  get col(): number {
    return this.layout.col;
  }

  /**
   * Returns the base width relative to rendered width.
   *
   * @returns Width ratio.
   */
  get widthPercentage(): number {
    return this.width / this.containerWidth;
  }

  /**
   * Returns the base height relative to rendered height.
   *
   * @returns Height ratio.
   */
  get heightPercentage(): number {
    return this.height / this.containerHeight;
  }

  /**
   * Releases the GPU texture for this piece.
   *
   * @returns Nothing.
   */
  destroy(): void {
    this.texture.destroy();
  }
}

/**
 * Returns whether the current environment exposes WebGPU.
 *
 * @returns True when WebGPU can be requested.
 */
export function isWebGPUSupported(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/**
 * Renders a puzzle with WebGPU and returns image source pieces.
 *
 * @param img - Source image.
 * @param rows - Number of puzzle rows.
 * @param columns - Number of puzzle columns.
 * @param options - Renderer options.
 * @returns Rendered puzzle pieces.
 */
export async function generatePuzzleWebGPU(
  img: PuzzleImage,
  rows: number,
  columns: number,
  options: GeneratePuzzleWebGPUOptions = {}
): Promise<RenderedPuzzlePiece[]> {
  if (!isWebGPUSupported()) {
    throw new Error("WebGPU is not available in this environment.");
  }

  const device = options.device ?? (await requestDevice(options));
  const layout = createPuzzleLayout({
    rows,
    columns,
    imageWidth: img.width,
    imageHeight: img.height,
    random: options.random,
  });
  const imageWidth = Math.ceil(img.width);
  const imageHeight = Math.ceil(img.height);
  const sourceTexture = createSourceTexture(device, img, imageWidth, imageHeight);
  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });
  const pipeline = createPipeline(device);
  const puzzlePieces = layout.pieces.map(
    (layoutPiece) => new RenderedPuzzlePieceData(layoutPiece)
  );
  const reportProgress = createProgressReporter(puzzlePieces.length, options);
  const imageData = await renderPiecesToImageData(
    device,
    pipeline,
    sourceTexture,
    sampler,
    puzzlePieces,
    imageWidth,
    imageHeight
  );
  for (let index = 0; index < puzzlePieces.length; index += 1) {
    puzzlePieces[index].imageSrc = await encodeImageData(imageData[index], options);
    reportProgress(index);
  }

  sourceTexture.destroy();

  return puzzlePieces;
}

/**
 * Renders a puzzle with WebGPU and keeps the pieces as GPU textures.
 *
 * @param img - Source image.
 * @param rows - Number of puzzle rows.
 * @param columns - Number of puzzle columns.
 * @param options - Renderer options.
 * @returns GPU-resident puzzle pieces.
 */
export async function generatePuzzleWebGPUTextures(
  img: PuzzleImage,
  rows: number,
  columns: number,
  options: GeneratePuzzleWebGPUTextureOptions = {}
): Promise<WebGPUPuzzlePiece[]> {
  if (!isWebGPUSupported()) {
    throw new Error("WebGPU is not available in this environment.");
  }

  const device = options.device ?? (await requestDevice(options));
  const layout = createPuzzleLayout({
    rows,
    columns,
    imageWidth: img.width,
    imageHeight: img.height,
    random: options.random,
  });
  const imageWidth = Math.ceil(img.width);
  const imageHeight = Math.ceil(img.height);
  const sourceTexture = createSourceTexture(device, img, imageWidth, imageHeight);
  const sampler = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });
  const pipeline = createPipeline(device);
  const puzzlePieces: WebGPUPuzzlePiece[] = [];
  const reportProgress = createProgressReporter(layout.pieces.length, options);

  for (let index = 0; index < layout.pieces.length; index += 1) {
    const layoutPiece = layout.pieces[index];
    const outputTexture = await renderPieceToTexture(
      device,
      pipeline,
      sourceTexture,
      sampler,
      new RenderedPuzzlePieceData(layoutPiece),
      imageWidth,
      imageHeight
    );

    puzzlePieces.push(new WebGPUPuzzlePieceData(layoutPiece, outputTexture));
    reportProgress(index);
  }

  sourceTexture.destroy();

  return puzzlePieces;
}

/**
 * Requests a WebGPU device.
 *
 * @param options - Renderer options.
 * @returns GPU device.
 */
async function requestDevice(
  options: GeneratePuzzleWebGPUOptions
): Promise<GPUDevice> {
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: options.powerPreference,
  });

  if (!adapter) {
    throw new Error("Could not request a WebGPU adapter.");
  }

  return await adapter.requestDevice();
}

/**
 * Creates the source image texture.
 *
 * @param device - GPU device.
 * @param img - Source image.
 * @param width - Source width.
 * @param height - Source height.
 * @returns Source texture.
 */
function createSourceTexture(
  device: GPUDevice,
  img: PuzzleImage,
  width: number,
  height: number
): GPUTexture {
  const texture = device.createTexture({
    format: TEXTURE_FORMAT,
    size: [width, height],
    usage:
      GPU_TEXTURE_USAGE.COPY_DST |
      GPU_TEXTURE_USAGE.TEXTURE_BINDING |
      GPU_TEXTURE_USAGE.RENDER_ATTACHMENT,
  });

  device.queue.copyExternalImageToTexture(
    { source: img as GPUCopyExternalImageSource },
    { texture },
    [width, height]
  );

  return texture;
}

/**
 * Creates the piece render pipeline.
 *
 * @param device - GPU device.
 * @returns Render pipeline.
 */
function createPipeline(device: GPUDevice): GPURenderPipeline {
  return device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: PIECE_SHADER }),
      entryPoint: "vertexMain",
      buffers: [
        {
          arrayStride: 16,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x2" },
            { shaderLocation: 1, offset: 8, format: "float32x2" },
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({ code: PIECE_SHADER }),
      entryPoint: "fragmentMain",
      targets: [
        {
          format: TEXTURE_FORMAT,
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

interface PendingImageRead {
  bytesPerRow: number;
  height: number;
  outputTexture: GPUTexture;
  readBuffer: GPUBuffer;
  temporaryBuffers: GPUBuffer[];
  width: number;
}

/**
 * Renders pieces and reads their pixels back in one GPU submission.
 *
 * @param device - GPU device.
 * @param pipeline - Render pipeline.
 * @param sourceTexture - Source image texture.
 * @param sampler - Source sampler.
 * @param pieces - Pieces to render.
 * @param imageWidth - Source image width.
 * @param imageHeight - Source image height.
 * @returns Rendered image data.
 */
async function renderPiecesToImageData(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  sourceTexture: GPUTexture,
  sampler: GPUSampler,
  pieces: RenderedPuzzlePiece[],
  imageWidth: number,
  imageHeight: number
): Promise<ImageData[]> {
  const encoder = device.createCommandEncoder();
  const pendingReads = pieces.map((piece) => {
    const width = Math.ceil(piece.containerWidth);
    const height = Math.ceil(piece.containerHeight);
    const outputTexture = createOutputTexture(device, width, height);
    const readBuffer = createReadBuffer(device, width, height);
    const temporaryBuffers = encodePieceRenderPass(
      device,
      pipeline,
      sourceTexture,
      sampler,
      outputTexture,
      encoder,
      piece,
      width,
      height,
      imageWidth,
      imageHeight
    );
    const bytesPerRow = getAlignedBytesPerRow(width);

    encoder.copyTextureToBuffer(
      { texture: outputTexture },
      {
        buffer: readBuffer,
        bytesPerRow,
        rowsPerImage: height,
      },
      [width, height]
    );

    return {
      bytesPerRow,
      height,
      outputTexture,
      readBuffer,
      temporaryBuffers,
      width,
    };
  });

  device.queue.submit([encoder.finish()]);
  await device.queue.onSubmittedWorkDone();

  const imageData = await Promise.all(
    pendingReads.map((pendingRead) =>
      readPendingImageData(pendingRead)
    )
  );

  return imageData;
}

/**
 * Reads and releases one pending image.
 *
 * @param pendingRead - Pending image read.
 * @returns Rendered image data.
 */
async function readPendingImageData(
  pendingRead: PendingImageRead
): Promise<ImageData> {
  const imageData = await readImageData(
    pendingRead.readBuffer,
    pendingRead.width,
    pendingRead.height,
    pendingRead.bytesPerRow
  );

  pendingRead.outputTexture.destroy();
  destroyBuffers(pendingRead.temporaryBuffers);
  pendingRead.readBuffer.destroy();

  return imageData;
}

/**
 * Renders one piece and returns its GPU texture.
 *
 * @param device - GPU device.
 * @param pipeline - Render pipeline.
 * @param sourceTexture - Source image texture.
 * @param sampler - Source sampler.
 * @param piece - Piece to render.
 * @param imageWidth - Source image width.
 * @param imageHeight - Source image height.
 * @returns Rendered piece texture.
 */
async function renderPieceToTexture(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  sourceTexture: GPUTexture,
  sampler: GPUSampler,
  piece: RenderedPuzzlePiece,
  imageWidth: number,
  imageHeight: number
): Promise<GPUTexture> {
  const width = Math.ceil(piece.containerWidth);
  const height = Math.ceil(piece.containerHeight);
  const outputTexture = createOutputTexture(device, width, height);
  const encoder = device.createCommandEncoder();
  const temporaryBuffers = encodePieceRenderPass(
    device,
    pipeline,
    sourceTexture,
    sampler,
    outputTexture,
    encoder,
    piece,
    width,
    height,
    imageWidth,
    imageHeight
  );

  device.queue.submit([encoder.finish()]);
  await device.queue.onSubmittedWorkDone();
  destroyBuffers(temporaryBuffers);

  return outputTexture;
}

/**
 * Encodes rendering commands for one piece.
 *
 * @param device - GPU device.
 * @param pipeline - Render pipeline.
 * @param sourceTexture - Source image texture.
 * @param sampler - Source sampler.
 * @param outputTexture - Output texture.
 * @param encoder - Command encoder.
 * @param piece - Piece to render.
 * @param width - Output width.
 * @param height - Output height.
 * @param imageWidth - Source image width.
 * @param imageHeight - Source image height.
 * @returns Temporary buffers used by the render pass.
 */
function encodePieceRenderPass(
  device: GPUDevice,
  pipeline: GPURenderPipeline,
  sourceTexture: GPUTexture,
  sampler: GPUSampler,
  outputTexture: GPUTexture,
  encoder: GPUCommandEncoder,
  piece: RenderedPuzzlePiece,
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number
): GPUBuffer[] {
  const { buffer: vertexBuffer, vertexCount } = createVertexBuffer(
    device,
    piece,
    width,
    height,
    imageWidth,
    imageHeight
  );
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: sourceTexture.createView() },
      { binding: 1, resource: sampler },
    ],
  });
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: outputTexture.createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 0 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });

  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.draw(vertexCount);
  pass.end();

  return [vertexBuffer];
}

/**
 * Creates the output render texture.
 *
 * @param device - GPU device.
 * @param width - Texture width.
 * @param height - Texture height.
 * @returns Output texture.
 */
function createOutputTexture(
  device: GPUDevice,
  width: number,
  height: number
): GPUTexture {
  return device.createTexture({
    format: TEXTURE_FORMAT,
    size: [width, height],
    usage:
      GPU_TEXTURE_USAGE.RENDER_ATTACHMENT |
      GPU_TEXTURE_USAGE.COPY_SRC |
      GPU_TEXTURE_USAGE.TEXTURE_BINDING,
  });
}

/**
 * Creates textured triangle vertices for one piece.
 *
 * @param device - GPU device.
 * @param piece - Piece to render.
 * @param width - Output width.
 * @param height - Output height.
 * @param imageWidth - Source image width.
 * @param imageHeight - Source image height.
 * @returns Vertex buffer and vertex count.
 */
function createVertexBuffer(
  device: GPUDevice,
  piece: RenderedPuzzlePiece,
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number
): { buffer: GPUBuffer; vertexCount: number } {
  const sourceOffset = {
    x: piece.margins.left - piece.col * piece.width,
    y: piece.margins.top - piece.row * piece.height,
  };
  const triangles = triangulatePolygon(createPieceOutlinePoints(piece));
  const data = new Float32Array(triangles.length * 4);

  triangles.forEach((point, index) => {
    data[index * 4] = (point.x / width) * 2 - 1;
    data[index * 4 + 1] = 1 - (point.y / height) * 2;
    data[index * 4 + 2] = (point.x - sourceOffset.x) / imageWidth;
    data[index * 4 + 3] = (point.y - sourceOffset.y) / imageHeight;
  });

  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: GPU_BUFFER_USAGE.COPY_DST | GPU_BUFFER_USAGE.VERTEX,
  });

  device.queue.writeBuffer(buffer, 0, data);

  return { buffer, vertexCount: triangles.length };
}

/**
 * Triangulates a simple polygon with ear clipping.
 *
 * @param points - Polygon points.
 * @returns Triangle vertices.
 */
function triangulatePolygon(points: Point[]): Point[] {
  if (points.length < 3) {
    return [];
  }

  const triangles: Point[] = [];
  const indices = points.map((_, index) => index);
  const orientation = getSignedArea(points) >= 0 ? 1 : -1;
  let guard = 0;

  while (indices.length > 3 && guard < points.length * points.length) {
    guard += 1;
    let foundEar = false;

    for (let i = 0; i < indices.length; i += 1) {
      const previousIndex = indices[(i - 1 + indices.length) % indices.length];
      const currentIndex = indices[i];
      const nextIndex = indices[(i + 1) % indices.length];
      const previous = points[previousIndex];
      const current = points[currentIndex];
      const next = points[nextIndex];

      if (!isConvex(previous, current, next, orientation)) {
        continue;
      }

      if (
        indices.some(
          (index) =>
            index !== previousIndex &&
            index !== currentIndex &&
            index !== nextIndex &&
            isPointInTriangle(points[index], previous, current, next)
        )
      ) {
        continue;
      }

      triangles.push(previous, current, next);
      indices.splice(i, 1);
      foundEar = true;
      break;
    }

    if (!foundEar) {
      return triangulatePolygonAsFan(points);
    }
  }

  if (indices.length === 3) {
    triangles.push(points[indices[0]], points[indices[1]], points[indices[2]]);
  }

  return triangles;
}

/**
 * Returns a fan triangulation fallback.
 *
 * @param points - Polygon points.
 * @returns Triangle vertices.
 */
function triangulatePolygonAsFan(points: Point[]): Point[] {
  const triangles: Point[] = [];

  for (let index = 1; index < points.length - 1; index += 1) {
    triangles.push(points[0], points[index], points[index + 1]);
  }

  return triangles;
}

/**
 * Returns signed polygon area.
 *
 * @param points - Polygon points.
 * @returns Signed area.
 */
function getSignedArea(points: Point[]): number {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  return area / 2;
}

/**
 * Returns whether one polygon vertex is convex.
 *
 * @param previous - Previous point.
 * @param current - Current point.
 * @param next - Next point.
 * @param orientation - Polygon orientation.
 * @returns True when the vertex is convex.
 */
function isConvex(
  previous: Point,
  current: Point,
  next: Point,
  orientation: 1 | -1
): boolean {
  const cross =
    (current.x - previous.x) * (next.y - current.y) -
    (current.y - previous.y) * (next.x - current.x);

  return cross * orientation > 0;
}

/**
 * Returns whether a point is inside a triangle.
 *
 * @param point - Point.
 * @param a - First triangle vertex.
 * @param b - Second triangle vertex.
 * @param c - Third triangle vertex.
 * @returns True when the point is inside.
 */
function isPointInTriangle(
  point: Point,
  a: Point,
  b: Point,
  c: Point
): boolean {
  const denominator =
    (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);

  if (denominator === 0) {
    return false;
  }

  const alpha =
    ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) /
    denominator;
  const beta =
    ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) /
    denominator;
  const gamma = 1 - alpha - beta;

  return alpha >= 0 && beta >= 0 && gamma >= 0;
}

/**
 * Creates a readback buffer.
 *
 * @param device - GPU device.
 * @param width - Output width.
 * @param height - Output height.
 * @returns Readback buffer.
 */
function createReadBuffer(
  device: GPUDevice,
  width: number,
  height: number
): GPUBuffer {
  return device.createBuffer({
    size: getAlignedBytesPerRow(width) * height,
    usage: GPU_BUFFER_USAGE.COPY_DST | GPU_BUFFER_USAGE.MAP_READ,
  });
}

/**
 * Releases temporary GPU buffers.
 *
 * @param buffers - Buffers to release.
 * @returns Nothing.
 */
function destroyBuffers(buffers: GPUBuffer[]): void {
  for (const buffer of buffers) {
    buffer.destroy();
  }
}

/**
 * Reads mapped GPU pixels into ImageData.
 *
 * @param buffer - Readback buffer.
 * @param width - Image width.
 * @param height - Image height.
 * @param bytesPerRow - Aligned row size.
 * @returns Image data.
 */
async function readImageData(
  buffer: GPUBuffer,
  width: number,
  height: number,
  bytesPerRow: number
): Promise<ImageData> {
  await buffer.mapAsync(GPU_MAP_MODE.READ);

  const mapped = new Uint8Array(buffer.getMappedRange());
  const pixels = new Uint8ClampedArray(width * height * BYTES_PER_PIXEL);
  const rowSize = width * BYTES_PER_PIXEL;

  for (let row = 0; row < height; row += 1) {
    pixels.set(
      mapped.subarray(row * bytesPerRow, row * bytesPerRow + rowSize),
      row * rowSize
    );
  }

  buffer.unmap();

  return new ImageData(pixels, width, height);
}

/**
 * Encodes image data as an image source.
 *
 * @param imageData - Rendered image data.
 * @param options - Encoding options.
 * @returns Encoded image source.
 */
async function encodeImageData(
  imageData: ImageData,
  options: GeneratePuzzleOptions
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create a 2D canvas context for image encoding.");
  }

  context.putImageData(imageData, 0, 0);

  return await encodeCanvasImageSource(canvas, options);
}

/**
 * Returns row byte size aligned for GPU copy operations.
 *
 * @param width - Output width.
 * @returns Aligned bytes per row.
 */
function getAlignedBytesPerRow(width: number): number {
  const bytesPerRow = width * BYTES_PER_PIXEL;

  return Math.ceil(bytesPerRow / COPY_BYTES_PER_ROW_ALIGNMENT) *
    COPY_BYTES_PER_ROW_ALIGNMENT;
}

const PIECE_SHADER = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@group(0) @binding(0) var sourceTexture: texture_2d<f32>;
@group(0) @binding(1) var sourceSampler: sampler;

@vertex
fn vertexMain(
  @location(0) position: vec2f,
  @location(1) uv: vec2f
) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4f(position, 0.0, 1.0);
  output.uv = uv;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  if (
    input.uv.x < 0.0 ||
    input.uv.x > 1.0 ||
    input.uv.y < 0.0 ||
    input.uv.y > 1.0
  ) {
    return vec4f(0.0, 0.0, 0.0, 0.0);
  }

  return textureSampleLevel(sourceTexture, sourceSampler, input.uv, 0.0);
}
`;
