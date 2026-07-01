import { createPieceEdges, type ConnectorStyleOption } from "./edges.js";
import { createPieceOutline, getConnectorDepth } from "./geometry.js";
import { JIGSAW_CONNECTOR_STYLE, JIGSAW_EDGE_POLARITY } from "./types.js";
import type { RandomSource } from "./edges.js";
import type {
  ConnectorStyle,
  PieceEdge,
  PieceEdges,
  PieceMargins,
  PuzzleLayout,
  PuzzlePieceLayout,
} from "./types.js";

export interface CreatePuzzleLayoutOptions {
  rows: number;
  columns: number;
  imageWidth: number;
  imageHeight: number;
  connectorStyle?: ConnectorStyleOption;
  random?: RandomSource;
}

/**
 * Builds DOM-free puzzle layout data for renderers to consume.
 *
 * @param options - Puzzle layout options.
 * @returns Puzzle layout data.
 */
export function createPuzzleLayout({
  rows,
  columns,
  connectorStyle = JIGSAW_CONNECTOR_STYLE.CLASSIC,
  imageWidth,
  imageHeight,
  random = Math.random,
}: CreatePuzzleLayoutOptions): PuzzleLayout {
  validatePositiveInteger(rows, "rows");
  validatePositiveInteger(columns, "columns");
  validatePositiveNumber(imageWidth, "imageWidth");
  validatePositiveNumber(imageHeight, "imageHeight");

  const pieceWidth = imageWidth / columns;
  const pieceHeight = imageHeight / rows;
  const scalarWidth = pieceWidth / 100;
  const scalarHeight = pieceHeight / 100;
  const lowPeak = 8.75;
  const highPeak = getMaxConnectorDepth(connectorStyle);
  const edgesGrid: Array<Array<PieceEdges | undefined>> = [];
  const pieces: PuzzlePieceLayout[] = [];

  for (let row = 0; row < rows; row += 1) {
    edgesGrid[row] = [];

    for (let col = 0; col < columns; col += 1) {
      const edges = createPieceEdges(
        row,
        col,
        rows,
        columns,
        edgesGrid[row - 1]?.[col],
        edgesGrid[row]?.[col - 1],
        random,
        connectorStyle
      );

      edgesGrid[row][col] = edges;
      const margins = createMargins(edges, scalarWidth, scalarHeight);
      const containerWidth = pieceWidth + margins.left + margins.right;
      const containerHeight = pieceHeight + margins.top + margins.bottom;
      const outline = createPieceOutline({
        edges,
        height: pieceHeight,
        margins,
        width: pieceWidth,
      });
      const index = row * columns + col;

      pieces.push({
        index,
        edges,
        grid: { row, col },
        outline,
        sourceBounds: {
          x: col * pieceWidth - margins.left,
          y: row * pieceHeight - margins.top,
          width: containerWidth,
          height: containerHeight,
        },
        margins,
        containerWidth,
        containerHeight,
        width: pieceWidth,
        height: pieceHeight,
        row,
        col,
      });
    }
  }

  return {
    rows,
    columns,
    imageWidth,
    imageHeight,
    pieceWidth,
    pieceHeight,
    pieceContainerWidth: Math.max(...pieces.map((piece) => piece.containerWidth)),
    pieceContainerHeight: Math.max(...pieces.map((piece) => piece.containerHeight)),
    lowPeak,
    highPeak,
    pieces,
  };
}

/**
 * Validates a positive integer layout option.
 *
 * @param value - Option value.
 * @param name - Option name.
 * @returns Nothing.
 */
function validatePositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer.`);
  }
}

/**
 * Validates a positive finite layout option.
 *
 * @param value - Option value.
 * @param name - Option name.
 * @returns Nothing.
 */
function validatePositiveNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}

function createMargins(
  edges: PieceEdges,
  scalarWidth: number,
  scalarHeight: number
): PieceMargins {
  return {
    top: getVerticalMargin(edges.TOP, scalarWidth),
    right: getSideMargin(edges.RIGHT, scalarHeight),
    bottom: getVerticalMargin(edges.BOTTOM, scalarWidth),
    left: getSideMargin(edges.LEFT, scalarHeight),
  };
}

function getSideMargin(edge: PieceEdge, scalarHeight: number): number {
  return getMargin(edge, scalarHeight);
}

function getVerticalMargin(edge: PieceEdge, scalarWidth: number): number {
  return getMargin(edge, scalarWidth);
}

function getMargin(edge: PieceEdge, scalar: number): number {
  if (edge.polarity === JIGSAW_EDGE_POLARITY.STRAIGHT) {
    return 0;
  }

  return getConnectorDepth(edge.style ?? JIGSAW_CONNECTOR_STYLE.CLASSIC) * scalar;
}

function getMaxConnectorDepth(connectorStyle: ConnectorStyleOption): number {
  const styles: ConnectorStyle[] = Array.isArray(connectorStyle)
    ? connectorStyle
    : [connectorStyle];

  if (styles.length === 0) {
    return getConnectorDepth(JIGSAW_CONNECTOR_STYLE.CLASSIC);
  }

  return Math.max(...styles.map((style) => getConnectorDepth(style)));
}
