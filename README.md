# jigsaw-canvas

[![npm version](https://img.shields.io/npm/v/jigsaw-canvas)](https://www.npmjs.com/package/jigsaw-canvas)
[![npm downloads](https://img.shields.io/npm/dm/jigsaw-canvas)](https://www.npmjs.com/package/jigsaw-canvas)
[![CI](https://github.com/ygongdev/jigsaw-canvas/actions/workflows/deploy.yml/badge.svg)](https://github.com/ygongdev/jigsaw-canvas/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/ygongdev/jigsaw-canvas/blob/main/LICENSE)

A jigsaw puzzle generator for Canvas2D and WebGPU.

This library is still unstable.

## API

### Imports

```js
import {
  createPuzzleLayout,
  generatePuzzle,
  generatePuzzleCanvas2D,
  generatePuzzleWebGPU,
  generatePuzzleWebGPUTextures,
  isWebGPUSupported,
  revokePuzzleImageSource,
} from "jigsaw-canvas";
```

### Core Model

All renderers use the same layout generator:

```js
const layout = createPuzzleLayout({
  rows,
  columns,
  imageWidth,
  imageHeight,
  random,
});
```

`createPuzzleLayout` returns deterministic, DOM-free puzzle geometry. It validates that `rows` and `columns` are positive integers and that image dimensions are positive finite numbers. Boundary edges are straight, adjacent pieces receive complementary tab/slot edges, and each piece includes transparent `margins` so protruding tabs are not clipped.

### Shared Inputs

```ts
type PuzzleImage = CanvasImageSource & {
  width: number;
  height: number;
};

type GeneratePuzzleOptions = {
  random?: () => number;
  imageType?: string;
  imageQuality?: number;
  imageOutput?: "blob-url" | "data-url";
  onProgress?: (progress: PuzzleGenerationProgress) => void;
};

type PuzzleGenerationProgress = {
  completedPieces: number;
  elapsedMs: number;
  pieceIndex: number;
  progress: number;
  totalPieces: number;
};
```

`random` controls tab/slot generation and is useful for reproducible puzzles. `imageType` and `imageQuality` are passed to browser image encoding. `imageOutput` defaults to `"blob-url"` because blob URLs avoid base64-heavy `toDataURL()` output.

`onProgress` is called once per generated piece. `progress` is a `0..1` ratio, `elapsedMs` is measured from the start of the generation call, and `pieceIndex` is zero-based. Canvas2D and WebGPU image-source renderers report after each piece has been encoded. `generatePuzzleWebGPUTextures` reports after each GPU texture has been rendered.

### Canvas2D Renderer

```js
const pieces = await generatePuzzle(image, rows, columns, options);
const samePieces = await generatePuzzleCanvas2D(image, rows, columns, options);
```

`generatePuzzle` is an alias for `generatePuzzleCanvas2D`. Canvas2D clips each piece with a `Path2D`, draws the source image under that clipped path, encodes each piece image, and returns:

```ts
type RenderedPuzzlePiece = {
  imageSrc: string;
  shape: PieceShape;
  margins: PieceMargins;
  containerWidth: number;
  containerHeight: number;
  width: number;
  height: number;
  row: number;
  col: number;
  widthPercentage: number;
  heightPercentage: number;
};
```

Use `piece.imageSrc` as an `<img src>` value. If the default blob URL output is used, release sources when finished:

```js
for (const piece of pieces) {
  revokePuzzleImageSource(piece.imageSrc);
}
```

Use `{ imageOutput: "data-url" }` only when you specifically need inline data URLs.

### WebGPU Image-Source Renderer

```js
if (isWebGPUSupported()) {
  const pieces = await generatePuzzleWebGPU(image, rows, columns, options);
}
```

`generatePuzzleWebGPU` renders each piece into a WebGPU texture, masks the sampled outline in WGSL, reads pixels back, encodes the result through the same image-output pipeline as Canvas2D, and returns `RenderedPuzzlePiece[]`.

This renderer preserves the Canvas2D return shape, so it is easy to drop into DOM/image based demos. Because it reads pixels back and encodes image sources, it is not the fastest path for interactive GPU animation.

### WebGPU Texture Renderer

```js
if (isWebGPUSupported()) {
  const texturePieces = await generatePuzzleWebGPUTextures(
    image,
    rows,
    columns,
    { random }
  );
}
```

`generatePuzzleWebGPUTextures` renders each piece into a GPU-resident texture and returns:

```ts
type WebGPUPuzzlePiece = {
  texture: GPUTexture;
  textureView: GPUTextureView;
  shape: PieceShape;
  margins: PieceMargins;
  containerWidth: number;
  containerHeight: number;
  width: number;
  height: number;
  row: number;
  col: number;
  widthPercentage: number;
  heightPercentage: number;
  destroy(): void;
};
```

Use this API for a custom WebGPU render loop where pieces stay on the GPU for transforms, dragging, animation, or composition. Call `piece.destroy()` when a texture piece is no longer needed.

### Renderer Choice

- Use `generatePuzzle` / `generatePuzzleCanvas2D` for broad browser support and normal DOM image pieces.
- Use `generatePuzzleWebGPU` when you want the same image-source output but prefer WebGPU generation where supported.
- Use `generatePuzzleWebGPUTextures` when you are building a WebGPU scene and want to avoid readback and image encoding.

## Development

Install dependencies:

```sh
yarn install
```

Build the package and demo outputs:

```sh
yarn build
```

Run all checks:

```sh
yarn typecheck
yarn lint
yarn test
```

The package source lives in `src/`. Demo source files stay as TypeScript. Package output is written to `dist/`, and bundled demo output is written to `demo-dist/`.

## Single Player Demo

1. `yarn install`
2. `yarn build:lib`
3. `yarn dev:demo`

Then open the local URL printed by Vite.

To build the static demo:

```sh
yarn build:demo
```

## Multiplayer Demo

Install and build from the repository root:

```sh
yarn install
yarn build
```

Start the client dev server from the repository root:

```sh
yarn dev:multiplayer-client
```

Open `http://localhost:8080` in a browser.

Start the backend server in another terminal:

```sh
yarn build:multiplayer-server
yarn start:multiplayer-server
```

Open the same client URL in another browser tab. Moving pieces in one tab should sync to the other.

## Release

Before releasing, run:

```sh
yarn typecheck
yarn lint
yarn test
yarn build
```

Verify the npm package contents:

```sh
npm pack --dry-run
```

The published package is limited by `package.json` `files` and should contain only:

- `dist/`
- `README.md`
- `LICENSE`
- `package.json`

Demos, tests, TypeScript source, and development config are intentionally excluded from the release package.

Create a release:

```sh
yarn release
```

`prepack` runs `yarn build:lib`, so `dist/` is regenerated before packing or publishing.
