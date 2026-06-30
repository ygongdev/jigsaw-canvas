import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createPuzzleLayout,
  generatePuzzleCanvas2D,
  JIGSAW_SHAPE,
} from "../dist/index.js";

const DEFAULT_LAYOUT_OPTIONS = Object.freeze({
  rows: 3,
  columns: 4,
  imageWidth: 800,
  imageHeight: 600,
});

/**
 * Returns a deterministic random source from fixed values.
 *
 * @param {number[]} values - Values to emit.
 * @returns {() => number} Deterministic random source.
 */
function createRandomSource(values) {
  let index = 0;

  return () => values[index++ % values.length];
}

/**
 * Creates a puzzle layout with defaults useful for most core tests.
 *
 * @param {Partial<import("../dist/index.js").CreatePuzzleLayoutOptions>} options - Layout overrides.
 * @returns {import("../dist/index.js").PuzzleLayout} Puzzle layout.
 */
function createLayout(options = {}) {
  return createPuzzleLayout({
    ...DEFAULT_LAYOUT_OPTIONS,
    random: createRandomSource([0.25]),
    ...options,
  });
}

/**
 * Finds a piece by grid position.
 *
 * @param {import("../dist/index.js").PuzzleLayout} layout - Puzzle layout.
 * @param {number} row - Piece row.
 * @param {number} col - Piece column.
 * @returns {import("../dist/index.js").PuzzlePieceLayout} Matching piece.
 */
function pieceAt(layout, row, col) {
  const piece = layout.pieces.find(
    (candidate) => candidate.row === row && candidate.col === col
  );

  assert.ok(piece);
  return piece;
}

/**
 * Returns the expected neighboring edge shape.
 *
 * @param {string} edge - Edge shape.
 * @returns {string} Complementary edge shape.
 */
function opposite(edge) {
  if (edge === JIGSAW_SHAPE.TAB) {
    return JIGSAW_SHAPE.SLOT;
  }

  if (edge === JIGSAW_SHAPE.SLOT) {
    return JIGSAW_SHAPE.TAB;
  }

  return JIGSAW_SHAPE.STRAIGHT;
}

/**
 * Asserts one piece has expected margins.
 *
 * @param {import("../dist/index.js").PuzzleLayout} layout - Puzzle layout.
 * @param {number} row - Piece row.
 * @param {number} col - Piece column.
 * @param {import("../dist/index.js").PieceMargins} margins - Expected margins.
 * @returns {void}
 */
function assertPieceMargins(layout, row, col, margins) {
  assert.deepEqual(pieceAt(layout, row, col).margins, margins);
}

/**
 * Asserts each piece container is sized from base size plus margins.
 *
 * @param {import("../dist/index.js").PuzzleLayout} layout - Puzzle layout.
 * @returns {void}
 */
function assertContainersIncludeMargins(layout) {
  for (const piece of layout.pieces) {
    assert.equal(
      piece.containerWidth,
      piece.width + piece.margins.left + piece.margins.right
    );
    assert.equal(
      piece.containerHeight,
      piece.height + piece.margins.top + piece.margins.bottom
    );
  }
}

/**
 * Asserts all outer puzzle edges are straight.
 *
 * @param {import("../dist/index.js").PuzzleLayout} layout - Puzzle layout.
 * @returns {void}
 */
function assertBoundaryEdgesStraight(layout) {
  for (const piece of layout.pieces) {
    if (piece.row === 0) {
      assert.equal(piece.shape.TOP, JIGSAW_SHAPE.STRAIGHT);
    }

    if (piece.row === layout.rows - 1) {
      assert.equal(piece.shape.BOTTOM, JIGSAW_SHAPE.STRAIGHT);
    }

    if (piece.col === 0) {
      assert.equal(piece.shape.LEFT, JIGSAW_SHAPE.STRAIGHT);
    }

    if (piece.col === layout.columns - 1) {
      assert.equal(piece.shape.RIGHT, JIGSAW_SHAPE.STRAIGHT);
    }
  }
}

/**
 * Asserts adjacent pieces have complementary edges.
 *
 * @param {import("../dist/index.js").PuzzleLayout} layout - Puzzle layout.
 * @returns {void}
 */
function assertAdjacentEdgesComplement(layout) {
  for (let row = 0; row < layout.rows; row += 1) {
    for (let col = 0; col < layout.columns; col += 1) {
      const piece = pieceAt(layout, row, col);

      if (col < layout.columns - 1) {
        const rightNeighbor = pieceAt(layout, row, col + 1);
        assert.equal(rightNeighbor.shape.LEFT, opposite(piece.shape.RIGHT));
      }

      if (row < layout.rows - 1) {
        const bottomNeighbor = pieceAt(layout, row + 1, col);
        assert.equal(bottomNeighbor.shape.TOP, opposite(piece.shape.BOTTOM));
      }
    }
  }
}

/**
 * Asserts an invalid layout option throws the expected message.
 *
 * @param {Partial<import("../dist/index.js").CreatePuzzleLayoutOptions>} options - Invalid options.
 * @param {RegExp} message - Expected error message.
 * @returns {void}
 */
function assertInvalidLayout(options, message) {
  assert.throws(() => createLayout(options), message);
}

/**
 * Installs the minimal browser canvas APIs needed by Canvas2D renderer tests.
 *
 * @returns {() => void} Cleanup callback.
 */
function installCanvasRendererShim() {
  const previousDocument = globalThis.document;
  const previousPath2D = globalThis.Path2D;

  globalThis.document = {
    createElement(tagName) {
      assert.equal(tagName, "canvas");

      return {
        height: 0,
        width: 0,
        getContext(contextType) {
          assert.equal(contextType, "2d");

          return {
            clip() {},
            drawImage() {},
            stroke() {},
          };
        },
        toDataURL() {
          return "data:image/png;base64,test";
        },
      };
    },
  };
  globalThis.Path2D = class Path2D {
    bezierCurveTo() {}
    closePath() {}
    lineTo() {}
    moveTo() {}
  };

  return () => {
    if (previousDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = previousDocument;
    }

    if (previousPath2D === undefined) {
      delete globalThis.Path2D;
    } else {
      globalThis.Path2D = previousPath2D;
    }
  };
}

describe("createPuzzleLayout", () => {
  test("creates sized pieces", () => {
    const layout = createLayout();

    assert.equal(layout.pieces.length, 12);
    assert.equal(layout.pieceWidth, 200);
    assert.equal(layout.pieceHeight, 200);
    assert.equal(layout.pieceContainerWidth, 280);
    assert.equal(layout.pieceContainerHeight, 280);
  });

  test("gives each piece safe margins for protruding edges", () => {
    const layout = createLayout();

    assertPieceMargins(layout, 0, 0, {
      top: 0,
      right: 40,
      bottom: 40,
      left: 0,
    });
    assertPieceMargins(layout, 1, 1, {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    });
    assertPieceMargins(layout, 2, 3, {
      top: 40,
      right: 0,
      bottom: 0,
      left: 40,
    });
    assertContainersIncludeMargins(layout);
  });

  test("keeps boundary edges straight", () => {
    assertBoundaryEdgesStraight(
      createLayout({ random: createRandomSource([0.25, 0.75]) })
    );
  });

  test("complements adjacent edges", () => {
    assertAdjacentEdgesComplement(
      createLayout({
        rows: 4,
        columns: 5,
        imageWidth: 1000,
        imageHeight: 800,
        random: createRandomSource([0.25, 0.75, 0.1, 0.9]),
      })
    );
  });

  test("uses random source for open edges", () => {
    const layout = createLayout({
      rows: 2,
      columns: 2,
      imageWidth: 400,
      imageHeight: 400,
      random: createRandomSource([0.25, 0.75, 0.25, 0.75]),
    });
    const topLeft = pieceAt(layout, 0, 0);

    assert.equal(topLeft.shape.RIGHT, JIGSAW_SHAPE.TAB);
    assert.equal(topLeft.shape.BOTTOM, JIGSAW_SHAPE.SLOT);
    assert.equal(pieceAt(layout, 0, 1).shape.LEFT, JIGSAW_SHAPE.SLOT);
    assert.equal(pieceAt(layout, 1, 0).shape.TOP, JIGSAW_SHAPE.TAB);
  });

  test("rejects invalid dimensions", () => {
    assertInvalidLayout(
      {
        rows: 0,
        columns: 2,
        imageWidth: 400,
        imageHeight: 400,
      },
      /rows must be a positive integer/
    );
    assertInvalidLayout(
      {
        rows: 2,
        columns: 1.5,
        imageWidth: 400,
        imageHeight: 400,
      },
      /columns must be a positive integer/
    );
    assertInvalidLayout(
      {
        rows: 2,
        columns: 2,
        imageWidth: Number.NaN,
        imageHeight: 400,
      },
      /imageWidth must be a positive finite number/
    );
    assertInvalidLayout(
      {
        rows: 2,
        columns: 2,
        imageWidth: 400,
        imageHeight: 0,
      },
      /imageHeight must be a positive finite number/
    );
  });
});

describe("generatePuzzleCanvas2D", () => {
  test("reports progress after each generated piece", async () => {
    const cleanup = installCanvasRendererShim();
    const progressEvents = [];

    try {
      const pieces = await generatePuzzleCanvas2D(
        { height: 100, width: 100 },
        2,
        2,
        {
          imageOutput: "data-url",
          onProgress(progress) {
            progressEvents.push(progress);
          },
          random: createRandomSource([0.25]),
        }
      );

      assert.equal(pieces.length, 4);
      assert.deepEqual(
        progressEvents.map((progress) => progress.completedPieces),
        [1, 2, 3, 4]
      );
      assert.deepEqual(
        progressEvents.map((progress) => progress.pieceIndex),
        [0, 1, 2, 3]
      );
      assert.equal(progressEvents.at(-1)?.totalPieces, 4);
      assert.equal(progressEvents.at(-1)?.progress, 1);
      assert.ok(progressEvents.every((progress) => progress.elapsedMs >= 0));
    } finally {
      cleanup();
    }
  });
});
