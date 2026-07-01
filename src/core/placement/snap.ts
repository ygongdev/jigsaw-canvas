import { JIGSAW_EDGE_POLARITY, type JigsawEdgeName } from "../types.js";
import type { PieceEdge, Point, PuzzlePieceLayout } from "../types.js";
import type {
  Bounds,
  PhysicalSnapCandidate,
  PhysicalSnapOptions,
  PiecePosition,
  PlacedPiece,
} from "./types.js";

const EDGE_NAMES = ["TOP", "RIGHT", "BOTTOM", "LEFT"] as const;
const OPPOSITE_EDGE = {
  TOP: "BOTTOM",
  RIGHT: "LEFT",
  BOTTOM: "TOP",
  LEFT: "RIGHT",
} as const satisfies Record<JigsawEdgeName, JigsawEdgeName>;

interface EdgeLine {
  end: Point;
  name: JigsawEdgeName;
  start: Point;
}

/**
 * Finds the closest physical snap candidate for a moving piece.
 *
 * @param options - Physical snap options.
 * @returns Best candidate, when one is within tolerance.
 */
export function findPhysicalSnapCandidate({
  board,
  moving,
  targets,
  tolerance,
}: PhysicalSnapOptions): PhysicalSnapCandidate | undefined {
  const pieceCandidates = findPieceSnapCandidates(moving, targets).filter(
    (candidate) => candidate.distance <= tolerance
  );

  if (pieceCandidates.length > 0) {
    return findClosestCandidate(pieceCandidates);
  }

  const boundaryCandidates = findBoundarySnapCandidates(moving, board).filter(
    (candidate) => candidate.distance <= tolerance
  );

  return findClosestCandidate(boundaryCandidates);
}

function findPieceSnapCandidates(
  moving: PlacedPiece,
  targets: PlacedPiece[]
): PhysicalSnapCandidate[] {
  const candidates: PhysicalSnapCandidate[] = [];

  for (const movingEdgeName of EDGE_NAMES) {
    const targetEdgeName = OPPOSITE_EDGE[movingEdgeName];
    const movingEdge = moving.piece.edges[movingEdgeName];
    const movingLine = getEdgeLine(moving.piece, movingEdgeName);

    for (const target of targets) {
      if (target.piece.index === moving.piece.index) {
        continue;
      }

      const targetEdge = target.piece.edges[targetEdgeName];

      if (!areEdgesPhysicallyCompatible(movingEdge, targetEdge)) {
        continue;
      }

      const targetLine = getEdgeLine(target.piece, targetEdgeName);
      const position = {
        x: target.position.x + targetLine.end.x - movingLine.start.x,
        y: target.position.y + targetLine.end.y - movingLine.start.y,
      };

      candidates.push({
        distance: distanceBetweenPositions(position, moving.position),
        edgeName: movingEdgeName,
        kind: "piece",
        position,
        target,
        targetEdgeName,
      });
    }
  }

  return candidates;
}

function findBoundarySnapCandidates(
  moving: PlacedPiece,
  board: Bounds
): PhysicalSnapCandidate[] {
  const candidates: PhysicalSnapCandidate[] = [];

  for (const edgeName of EDGE_NAMES) {
    const edge = moving.piece.edges[edgeName];

    if (edge.polarity !== JIGSAW_EDGE_POLARITY.STRAIGHT) {
      continue;
    }

    const line = getEdgeLine(moving.piece, edgeName);
    const position = { ...moving.position };

    if (edgeName === "TOP") {
      position.y = board.y - line.start.y;
    } else if (edgeName === "RIGHT") {
      position.x = board.x + board.width - line.start.x;
    } else if (edgeName === "BOTTOM") {
      position.y = board.y + board.height - line.start.y;
    } else {
      position.x = board.x - line.start.x;
    }

    candidates.push({
      boundary: edgeName,
      distance: distanceBetweenPositions(position, moving.position),
      edgeName,
      kind: "boundary",
      position,
    });
  }

  candidates.push(...findCornerSnapCandidates(moving, board));

  return candidates;
}

function findCornerSnapCandidates(
  moving: PlacedPiece,
  board: Bounds
): PhysicalSnapCandidate[] {
  const candidates: PhysicalSnapCandidate[] = [];
  const straight = (edgeName: JigsawEdgeName) =>
    moving.piece.edges[edgeName].polarity === JIGSAW_EDGE_POLARITY.STRAIGHT;
  const top = getEdgeLine(moving.piece, "TOP");
  const right = getEdgeLine(moving.piece, "RIGHT");
  const bottom = getEdgeLine(moving.piece, "BOTTOM");
  const left = getEdgeLine(moving.piece, "LEFT");

  if (straight("TOP") && straight("LEFT")) {
    candidates.push(createCornerCandidate(moving, "TOP", {
      x: board.x - left.start.x,
      y: board.y - top.start.y,
    }));
  }

  if (straight("TOP") && straight("RIGHT")) {
    candidates.push(createCornerCandidate(moving, "TOP", {
      x: board.x + board.width - right.start.x,
      y: board.y - top.start.y,
    }));
  }

  if (straight("BOTTOM") && straight("LEFT")) {
    candidates.push(createCornerCandidate(moving, "BOTTOM", {
      x: board.x - left.start.x,
      y: board.y + board.height - bottom.start.y,
    }));
  }

  if (straight("BOTTOM") && straight("RIGHT")) {
    candidates.push(createCornerCandidate(moving, "BOTTOM", {
      x: board.x + board.width - right.start.x,
      y: board.y + board.height - bottom.start.y,
    }));
  }

  return candidates;
}

function createCornerCandidate(
  moving: PlacedPiece,
  edgeName: JigsawEdgeName,
  position: PiecePosition
): PhysicalSnapCandidate {
  return {
    boundary: edgeName,
    distance: distanceBetweenPositions(position, moving.position),
    edgeName,
    kind: "boundary",
    position,
  };
}

function areEdgesPhysicallyCompatible(a: PieceEdge, b: PieceEdge): boolean {
  if (
    a.polarity === JIGSAW_EDGE_POLARITY.STRAIGHT ||
    b.polarity === JIGSAW_EDGE_POLARITY.STRAIGHT
  ) {
    return false;
  }

  return a.polarity !== b.polarity && a.style === b.style;
}

function getEdgeLine(piece: PuzzlePieceLayout, name: JigsawEdgeName): EdgeLine {
  const left = piece.margins.left;
  const top = piece.margins.top;
  const right = left + piece.width;
  const bottom = top + piece.height;

  switch (name) {
    case "TOP":
      return { end: { x: right, y: top }, name, start: { x: left, y: top } };
    case "RIGHT":
      return { end: { x: right, y: bottom }, name, start: { x: right, y: top } };
    case "BOTTOM":
      return { end: { x: left, y: bottom }, name, start: { x: right, y: bottom } };
    case "LEFT":
      return { end: { x: left, y: top }, name, start: { x: left, y: bottom } };
  }
}

function distanceBetweenPositions(a: PiecePosition, b: PiecePosition): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function findClosestCandidate(
  candidates: PhysicalSnapCandidate[]
): PhysicalSnapCandidate | undefined {
  return candidates.sort((a, b) => a.distance - b.distance)[0];
}
