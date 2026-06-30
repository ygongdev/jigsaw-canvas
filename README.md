# jigsaw-canvas

A jigsaw puzzle generator for HTML Canvas.

This library is still unstable.

## API

```js
import { generatePuzzle } from "jigsaw-canvas";

const pieces = await generatePuzzle(image, rows, columns);
```

`generatePuzzle(image, rows, columns)` returns an array of `rows * columns` puzzle pieces based on `image`.

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
