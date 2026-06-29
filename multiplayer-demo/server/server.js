"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const io = require("socket.io")(3000, {
    cors: {
        origin: ["http://localhost:8080"],
    },
});
let state = { puzzle: [] };
io.on("connection", (client) => {
    client.on("start", handleStart);
    client.on("move", handleMove);
    /**
     * Stores initial game state and starts sync.
     *
     * @param gameState - Initial game state.
     * @returns Nothing.
     */
    function handleStart(gameState) {
        state = gameState;
        startGameInterval(client);
    }
    /**
     * Applies one piece movement.
     *
     * @param move - Movement payload.
     * @returns Nothing.
     */
    function handleMove({ idx, x, y }) {
        state.puzzle[idx].x = x;
        state.puzzle[idx].y = y;
    }
});
/**
 * Emits game state to one client at animation cadence.
 *
 * @param client - Socket client.
 * @returns Nothing.
 */
function startGameInterval(client) {
    setInterval(() => {
        client.emit("gameState", JSON.stringify(state));
    }, 1000 / 60);
}
