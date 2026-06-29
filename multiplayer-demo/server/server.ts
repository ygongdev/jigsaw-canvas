interface MovePayload {
  idx: number;
  x: number;
  y: number;
}

interface ServerPuzzleState {
  x: number;
  y: number;
}

interface GameState {
  puzzle: ServerPuzzleState[];
}

interface SocketClient {
  emit(event: "gameState", gameState: string): void;
  on(event: "start", handler: (gameState: GameState) => void): void;
  on(event: "move", handler: (move: MovePayload) => void): void;
}

interface SocketServer {
  on(event: "connection", handler: (client: SocketClient) => void): void;
}

declare const require: (
  name: "socket.io"
) => (
  port: number,
  options: { cors: { origin: string[] } }
) => SocketServer;
declare function setInterval(handler: () => void, timeout: number): unknown;

const io = require("socket.io")(3000, {
  cors: {
    origin: ["http://localhost:8080"],
  },
});

let state: GameState = { puzzle: [] };

io.on("connection", (client) => {
  client.on("start", handleStart);
  client.on("move", handleMove);

  /**
   * Stores initial game state and starts sync.
   *
   * @param gameState - Initial game state.
   * @returns Nothing.
   */
  function handleStart(gameState: GameState): void {
    state = gameState;
    startGameInterval(client);
  }

  /**
   * Applies one piece movement.
   *
   * @param move - Movement payload.
   * @returns Nothing.
   */
  function handleMove({ idx, x, y }: MovePayload): void {
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
function startGameInterval(client: SocketClient): void {
  setInterval(() => {
    client.emit("gameState", JSON.stringify(state));
  }, 1000 / 60);
}
