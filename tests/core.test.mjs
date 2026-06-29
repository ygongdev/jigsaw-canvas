import assert from "node:assert/strict";
import test from "node:test";
import { createPuzzleLayout, JIGSAW_SHAPE } from "../dist/index.js";

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

test("createPuzzleLayout creates sized pieces", () => {
  const layout = createPuzzleLayout({
    rows: 3,
    columns: 4,
    imageWidth: 800,
    imageHeight: 600,
    random: createRandomSource([0.25]),
  });

  assert.equal(layout.pieces.length, 12);
  assert.equal(layout.pieceWidth, 200);
  assert.equal(layout.pieceHeight, 200);
  assert.equal(layout.pieceContainerWidth, layout.pieces[0].containerWidth);
  assert.equal(layout.pieceContainerHeight, layout.pieces[0].containerHeight);
});

test("createPuzzleLayout keeps boundary edges straight", () => {
  const layout = createPuzzleLayout({
    rows: 3,
    columns: 4,
    imageWidth: 800,
    imageHeight: 600,
    random: createRandomSource([0.25, 0.75]),
  });

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
});

test("createPuzzleLayout complements adjacent edges", () => {
  const layout = createPuzzleLayout({
    rows: 4,
    columns: 5,
    imageWidth: 1000,
    imageHeight: 800,
    random: createRandomSource([0.25, 0.75, 0.1, 0.9]),
  });

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
});

test("createPuzzleLayout uses random source for open edges", () => {
  const layout = createPuzzleLayout({
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
