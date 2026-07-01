import {
  JIGSAW_CONNECTOR_STYLE,
  JIGSAW_EDGE_POLARITY,
  type ConnectorStyle,
  type PieceEdge,
  type PieceEdges,
} from "./types.js";

export type RandomSource = () => number;

export type ConnectorStyleOption = ConnectorStyle | ConnectorStyle[];

/**
 * Creates edge metadata for one piece from its position and neighbors.
 *
 * @param row - Piece row index.
 * @param col - Piece column index.
 * @param rows - Total puzzle rows.
 * @param columns - Total puzzle columns.
 * @param topNeighbor - Edges of the piece above.
 * @param leftNeighbor - Edges of the piece to the left.
 * @param random - Random source for non-boundary edges.
 * @param connectorStyle - Connector style or style pool.
 * @returns The edge map for the piece.
 */
export function createPieceEdges(
  row: number,
  col: number,
  rows: number,
  columns: number,
  topNeighbor?: PieceEdges,
  leftNeighbor?: PieceEdges,
  random: RandomSource = Math.random,
  connectorStyle: ConnectorStyleOption = JIGSAW_CONNECTOR_STYLE.CLASSIC
): PieceEdges {
  return {
    TOP:
      row === 0
        ? createStraightEdge()
        : oppositeEdge(topNeighbor?.BOTTOM ?? createInteriorEdge(random, connectorStyle)),
    RIGHT:
      col === columns - 1
        ? createStraightEdge()
        : createInteriorEdge(random, connectorStyle, `v:${row}:${col + 1}`),
    BOTTOM:
      row === rows - 1
        ? createStraightEdge()
        : createInteriorEdge(random, connectorStyle, `h:${row + 1}:${col}`),
    LEFT:
      col === 0
        ? createStraightEdge()
        : oppositeEdge(leftNeighbor?.RIGHT ?? createInteriorEdge(random, connectorStyle)),
  };
}

/**
 * Returns the matching edge metadata for the neighboring piece.
 *
 * @param edge - Edge to complement.
 * @returns The opposite edge.
 */
export function oppositeEdge(edge: PieceEdge): PieceEdge {
  if (edge.polarity === JIGSAW_EDGE_POLARITY.OUT) {
    return { ...edge, polarity: JIGSAW_EDGE_POLARITY.IN };
  }

  if (edge.polarity === JIGSAW_EDGE_POLARITY.IN) {
    return { ...edge, polarity: JIGSAW_EDGE_POLARITY.OUT };
  }

  return createStraightEdge(edge.sharedEdgeId);
}

/**
 * Picks a non-boundary edge.
 *
 * @param random - Random source.
 * @param connectorStyle - Connector style or style pool.
 * @param sharedEdgeId - Shared edge identifier.
 * @returns An interior edge.
 */
export function createInteriorEdge(
  random: RandomSource,
  connectorStyle: ConnectorStyleOption = JIGSAW_CONNECTOR_STYLE.CLASSIC,
  sharedEdgeId?: string
): PieceEdge {
  return {
    polarity:
      random() < 0.5 ? JIGSAW_EDGE_POLARITY.OUT : JIGSAW_EDGE_POLARITY.IN,
    sharedEdgeId,
    style: pickConnectorStyle(random, connectorStyle),
  };
}

function createStraightEdge(sharedEdgeId?: string): PieceEdge {
  return {
    polarity: JIGSAW_EDGE_POLARITY.STRAIGHT,
    sharedEdgeId,
  };
}

function pickConnectorStyle(
  random: RandomSource,
  connectorStyle: ConnectorStyleOption
): ConnectorStyle {
  if (!Array.isArray(connectorStyle)) {
    return connectorStyle;
  }

  if (connectorStyle.length === 0) {
    return JIGSAW_CONNECTOR_STYLE.CLASSIC;
  }

  return connectorStyle[Math.floor(random() * connectorStyle.length)];
}
