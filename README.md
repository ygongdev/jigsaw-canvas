# jigsaw-canvas
A jigsaw puzzle generator for HTMLCanvas

This library is still unstable.

# API
`generatePuzzle(image, rows, columns)` returns an array of `rows`X`columns` puzzle pieces based off `image`.

# Demo
[Demo](https://ygongdev.github.io/jigsaw-canvas/demo)

# Multiplayer Demo (Local Build)

## Install
1. `yarn install`

## Start client server
1. Make sure you're at the `jigsaw-canvas` root directory
2. `npx live-server --host=localhost`
3. Navigate to `localhost:<port>/multiplayer-demo/client` in the browser. `<port>` is whatever the `live-server` is running on, e.g `8080`

## Start backend server
1. `cd multiplayer-demo/server`
2. `npx nodemon server.js`

Open another browser with the same url and you should see real time sync when moving pieces.
