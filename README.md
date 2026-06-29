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

Build the TypeScript source:

```sh
yarn build
```

Run all checks:

```sh
yarn typecheck
yarn lint
yarn test
```

The package source lives in `src/`. Build output is written to `dist/`, and demos import from `dist/index.js`, so run `yarn build` before opening demos.

## Single Player Demo

1. `yarn install`
2. `yarn build`
3. Serve the repository root.
4. Open `demo.html`.

For example:

```sh
npx live-server --host=localhost
```

Then open `http://localhost:<port>/demo.html`.

## Multiplayer Demo

Install and build from the repository root:

```sh
yarn install
yarn build
```

Start the client server from the repository root:

```sh
npx live-server --host=localhost
```

Open `http://localhost:<port>/multiplayer-demo/client` in a browser.

Start the backend server in another terminal:

```sh
cd multiplayer-demo/server
npx nodemon server.js
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

`prepack` runs `yarn build`, so `dist/` is regenerated before packing or publishing.
