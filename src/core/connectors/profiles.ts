import {
  JIGSAW_CONNECTOR_STYLE,
  type ConnectorStyle,
} from "../types.js";

interface NormalizedCubic {
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  ex: number;
  ey: number;
}

export type NormalizedConnectorSegment =
  | { kind: "line"; ex: number; ey: number }
  | ({ kind: "cubic" } & NormalizedCubic);

/**
 * Returns the maximum connector depth for margin calculations.
 *
 * @param style - Connector style.
 * @returns Normalized depth where edge length is 100.
 */
export function getConnectorDepth(style: ConnectorStyle): number {
  switch (style) {
    case JIGSAW_CONNECTOR_STYLE.ANGULAR:
      return 18;
    case JIGSAW_CONNECTOR_STYLE.DOVETAIL:
      return 22;
    case JIGSAW_CONNECTOR_STYLE.ROUND:
      return 24;
    case JIGSAW_CONNECTOR_STYLE.WAVE:
      return 16;
    case JIGSAW_CONNECTOR_STYLE.CLASSIC:
      return 20;
  }
}

/**
 * Returns normalized profile segments for a connector style.
 *
 * @param style - Connector style.
 * @returns Connector profile.
 */
export function getConnectorProfile(
  style: ConnectorStyle
): NormalizedConnectorSegment[] {
  switch (style) {
    case JIGSAW_CONNECTOR_STYLE.ANGULAR:
      return makeAngularProfile();
    case JIGSAW_CONNECTOR_STYLE.DOVETAIL:
      return makeDovetailProfile();
    case JIGSAW_CONNECTOR_STYLE.ROUND:
      return makeRoundProfile();
    case JIGSAW_CONNECTOR_STYLE.WAVE:
      return makeWaveProfile();
    case JIGSAW_CONNECTOR_STYLE.CLASSIC:
      return makeClassicProfile();
  }
}

function makeClassicProfile(): NormalizedConnectorSegment[] {
  return [
    { kind: "cubic", cx1: 0, cy1: 0, cx2: 35, cy2: 15, ex: 37, ey: 5 },
    { kind: "cubic", cx1: 37, cy1: 5, cx2: 40, cy2: 0, ex: 38, ey: -5 },
    { kind: "cubic", cx1: 38, cy1: -5, cx2: 20, cy2: -20, ex: 50, ey: -20 },
    { kind: "cubic", cx1: 50, cy1: -20, cx2: 80, cy2: -20, ex: 62, ey: -5 },
    { kind: "cubic", cx1: 62, cy1: -5, cx2: 60, cy2: 0, ex: 63, ey: 5 },
    { kind: "cubic", cx1: 63, cy1: 5, cx2: 65, cy2: 15, ex: 100, ey: 0 },
  ];
}

function makeRoundProfile(): NormalizedConnectorSegment[] {
  return [
    { kind: "cubic", cx1: 0, cy1: 0, cx2: 25, cy2: 0, ex: 34, ey: 8 },
    { kind: "cubic", cx1: 42, cy1: 24, cx2: 58, cy2: 24, ex: 66, ey: 8 },
    { kind: "cubic", cx1: 75, cy1: 0, cx2: 100, cy2: 0, ex: 100, ey: 0 },
  ];
}

function makeWaveProfile(): NormalizedConnectorSegment[] {
  return [
    { kind: "cubic", cx1: 12, cy1: 0, cx2: 18, cy2: 12, ex: 28, ey: 12 },
    { kind: "cubic", cx1: 40, cy1: 12, cx2: 38, cy2: -12, ex: 50, ey: -12 },
    { kind: "cubic", cx1: 62, cy1: -12, cx2: 60, cy2: 12, ex: 72, ey: 12 },
    { kind: "cubic", cx1: 82, cy1: 12, cx2: 88, cy2: 0, ex: 100, ey: 0 },
  ];
}

function makeAngularProfile(): NormalizedConnectorSegment[] {
  return [
    { kind: "line", ex: 34, ey: 0 },
    { kind: "line", ex: 42, ey: 18 },
    { kind: "line", ex: 58, ey: 18 },
    { kind: "line", ex: 66, ey: 0 },
    { kind: "line", ex: 100, ey: 0 },
  ];
}

function makeDovetailProfile(): NormalizedConnectorSegment[] {
  return [
    { kind: "line", ex: 32, ey: 0 },
    { kind: "line", ex: 42, ey: 22 },
    { kind: "line", ex: 58, ey: 22 },
    { kind: "line", ex: 68, ey: 0 },
    { kind: "line", ex: 100, ey: 0 },
  ];
}
