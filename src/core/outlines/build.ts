import {
  getConnectorProfile,
  type NormalizedConnectorSegment,
} from "../connectors/profiles.js";
import {
  JIGSAW_CONNECTOR_STYLE,
  JIGSAW_EDGE_POLARITY,
  type BoundarySegment,
  type PieceEdge,
  type PieceEdges,
  type PieceMargins,
  type Point,
} from "../types.js";

interface Vector {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
}

export interface OutlineOptions {
  edges: PieceEdges;
  height: number;
  margins: PieceMargins;
  width: number;
}

/**
 * Builds renderer-neutral piece outlines from edge metadata.
 */
export class OutlineBuilder {
  /**
   * Builds one piece outline.
   *
   * @param options - Piece outline options.
   * @returns Boundary segments in piece-container coordinates.
   */
  build({ edges, height, margins, width }: OutlineOptions): BoundarySegment[] {
    const origin = { x: margins.left, y: margins.top };
    const segments: BoundarySegment[] = [];

    this.appendEdge(
      segments,
      origin,
      edges.TOP,
      width,
      { x: 1, y: 0 },
      { x: 0, y: -1 }
    );
    this.appendEdge(
      segments,
      { x: origin.x + width, y: origin.y },
      edges.RIGHT,
      height,
      { x: 0, y: 1 },
      { x: 1, y: 0 }
    );
    this.appendEdge(
      segments,
      { x: origin.x + width, y: origin.y + height },
      edges.BOTTOM,
      width,
      { x: -1, y: 0 },
      { x: 0, y: 1 }
    );
    this.appendEdge(
      segments,
      { x: origin.x, y: origin.y + height },
      edges.LEFT,
      height,
      { x: 0, y: -1 },
      { x: -1, y: 0 }
    );

    return segments;
  }

  private appendEdge(
    segments: BoundarySegment[],
    start: Point,
    edge: PieceEdge,
    length: number,
    along: Vector,
    normal: Vector
  ): void {
    if (edge.polarity === JIGSAW_EDGE_POLARITY.STRAIGHT) {
      this.appendLine(
        segments,
        start,
        this.pointOnEdge(start, along, normal, length / 100, 100, 0)
      );
      return;
    }

    const sign = edge.polarity === JIGSAW_EDGE_POLARITY.OUT ? 1 : -1;
    const scalar = length / 100;
    let current = start;

    for (const segment of getConnectorProfile(edge.style ?? JIGSAW_CONNECTOR_STYLE.CLASSIC)) {
      current = this.appendConnectorSegment(
        segments,
        start,
        current,
        segment,
        along,
        normal,
        scalar,
        sign
      );
    }
  }

  private appendConnectorSegment(
    segments: BoundarySegment[],
    edgeStart: Point,
    current: Point,
    segment: NormalizedConnectorSegment,
    along: Vector,
    normal: Vector,
    scalar: number,
    sign: 1 | -1
  ): Point {
    if (segment.kind === "line") {
      const end = this.pointOnEdge(
        edgeStart,
        along,
        normal,
        scalar,
        segment.ex,
        segment.ey * sign
      );

      this.appendLine(segments, current, end);
      return end;
    }

    const cubic = {
      kind: "cubic" as const,
      start: current,
      cp1: this.pointOnEdge(
        edgeStart,
        along,
        normal,
        scalar,
        segment.cx1,
        segment.cy1 * sign
      ),
      cp2: this.pointOnEdge(
        edgeStart,
        along,
        normal,
        scalar,
        segment.cx2,
        segment.cy2 * sign
      ),
      end: this.pointOnEdge(
        edgeStart,
        along,
        normal,
        scalar,
        segment.ex,
        segment.ey * sign
      ),
    };

    segments.push(cubic);

    return cubic.end;
  }

  private appendLine(
    segments: BoundarySegment[],
    start: Point,
    end: Point
  ): void {
    segments.push({ kind: "line", start, end });
  }

  private pointOnEdge(
    start: Point,
    along: Vector,
    normal: Vector,
    scalar: number,
    alongValue: number,
    normalValue: number
  ): Point {
    return {
      x:
        start.x +
        along.x * alongValue * scalar +
        normal.x * normalValue * scalar,
      y:
        start.y +
        along.y * alongValue * scalar +
        normal.y * normalValue * scalar,
    };
  }
}

/**
 * Builds a renderer-neutral piece outline from edge metadata.
 *
 * @param options - Piece outline options.
 * @returns Boundary segments in piece-container coordinates.
 */
export function createPieceOutline(options: OutlineOptions): BoundarySegment[] {
  return new OutlineBuilder().build(options);
}
