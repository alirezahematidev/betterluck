import { releaseAngle } from "./flapper";
import type { FlapperConfig } from "./flapper";
import type { Arc } from "./geometry";
import { TAU, toRadians } from "./math";
import { coastStopTime, launchDistance } from "./physics";
import type {
  FrameOptions,
  HubOptions,
  IndicatorOptions,
  IndicatorPosition,
  IndicatorShape,
  LabelOptions,
  WheelPhysics,
} from "./types";

/** Everything is drawn in "wheel units": the wheel is 500 units across, scaled to its rendered size. */
export const WHEEL_RADIUS = 250;

export const DEFAULT_PHYSICS: WheelPhysics = {
  spinUpTime: 0.45,
  friction: 0.9,
  drag: 0.32,
  minLaunchSpeed: 15,
  maxLaunchSpeed: 22,
  flickThreshold: 4,
};

export const DEFAULT_FRAME: Required<Omit<FrameOptions, "color" | "pegColor" | "dividerColor">> = {
  width: 24,
  pegs: true,
  pegSize: 4.5,
  dividerWidth: 1.5,
  shading: true,
};

export const DEFAULT_INDICATOR: Required<Omit<IndicatorOptions, "color" | "render">> = {
  position: "top",
  shape: "pin",
  size: 1,
  flap: true,
};

export const DEFAULT_HUB: Required<Pick<HubOptions, "radius" | "clickable">> = {
  radius: 40,
  clickable: true,
};

export const DEFAULT_LABELS: Required<Omit<LabelOptions, "color">> = {
  maxFontSize: 24,
  minFontPx: 9,
  minImagePx: 12,
  imageScale: 1.9,
  maxImageSize: 52,
  uniform: true,
  inset: 12,
  direction: "auto",
};

const finiteOr = (value: number | undefined, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const clamp = (value: number | undefined, fallback: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, finiteOr(value, fallback)));

/** Fills defaults and clamps values into a range where the closed-form model is well-defined. */
export function resolvePhysics(physics?: Partial<WheelPhysics>): WheelPhysics {
  const d = DEFAULT_PHYSICS;
  const a = Math.max(1, finiteOr(physics?.minLaunchSpeed, d.minLaunchSpeed));
  const b = Math.max(1, finiteOr(physics?.maxLaunchSpeed, d.maxLaunchSpeed));
  return {
    spinUpTime: clamp(physics?.spinUpTime, d.spinUpTime, 0, 3),
    friction: Math.max(0.05, finiteOr(physics?.friction, d.friction)),
    drag: Math.max(0, finiteOr(physics?.drag, d.drag)),
    minLaunchSpeed: Math.min(a, b),
    maxLaunchSpeed: Math.max(a, b),
    // Below ~2 rad/s a flick can't carry the wheel anywhere convincing.
    flickThreshold: Math.max(2, finiteOr(physics?.flickThreshold, d.flickThreshold)),
  };
}

/** Duration and number of turns of an average spin, for display. */
export function estimateSpin(physics: WheelPhysics): { seconds: number; turns: number } {
  const speed = (physics.minLaunchSpeed + physics.maxLaunchSpeed) / 2;
  const friction = { mu: physics.friction, k: physics.drag };
  return {
    seconds: physics.spinUpTime + coastStopTime(speed, friction),
    turns: launchDistance(speed, physics.spinUpTime, friction) / TAU,
  };
}

const SIDES: Record<string, number> = { top: 0, right: 90, bottom: 180, left: 270 };

/** Indicator position in radians, clockwise from 12 o'clock. */
export function indicatorAngle(position: IndicatorPosition | undefined): number {
  if (typeof position === "number" && Number.isFinite(position)) return toRadians(position);
  return toRadians(SIDES[String(position)] ?? 0);
}

/** Furthest extent of each built-in indicator shape from its hinge, per unit of scale. */
const SHAPE_EXTENT: Record<IndicatorShape, number> = { pin: 17, triangle: 22, needle: 11 };

export interface GeometryInput {
  frameWidth: number | undefined;
  pegs: boolean | undefined;
  pegSize: number | undefined;
  hubRadius: number | undefined;
  indicatorPosition: IndicatorPosition | undefined;
  indicatorSize: number | undefined;
  indicatorShape: IndicatorShape | undefined;
  customIndicator: boolean;
}

export interface WheelGeometry {
  radius: number;
  frameWidth: number;
  sliceRadius: number;
  pegs: boolean;
  pegDistance: number;
  pegRadius: number;
  hubRadius: number;
  indicatorAngle: number;
  indicatorScale: number;
  /** Hinge → visual tip of the indicator. */
  indicatorTip: number;
  /** How far the indicator reaches from its hinge in any direction (for layout). */
  indicatorExtent: number;
  flapper: FlapperConfig;
}

/** Derives every radius, the peg layout and the indicator's physical arm from the options. */
export function buildGeometry(input: GeometryInput, arcs: readonly Arc[]): WheelGeometry {
  const radius = WHEEL_RADIUS;
  const frameWidth = clamp(input.frameWidth, DEFAULT_FRAME.width, 0, 80);
  const sliceRadius = radius - frameWidth;
  const pegSize = clamp(input.pegSize, DEFAULT_FRAME.pegSize, 1, 12);

  // Pegs sit in the middle of the rim when it's wide enough, otherwise just inside the slices.
  const onRim = frameWidth >= 2 * pegSize + 4;
  const pegDistance = onRim ? radius - frameWidth / 2 : sliceRadius - pegSize - 4;
  const minSpan = arcs.reduce((m, a) => Math.min(m, a.span), TAU);
  const spacingLimit = 0.32 * pegDistance * minSpan;
  const rimLimit = onRim ? frameWidth / 2 - 1 : pegSize;
  const pegRadius = Math.max(1.2, Math.min(pegSize, spacingLimit, rimLimit));

  const hubRadius = clamp(input.hubRadius, DEFAULT_HUB.radius, 0, sliceRadius * 0.45);
  const scale = clamp(input.indicatorSize, DEFAULT_INDICATOR.size, 0.4, 2.5);
  const shape = input.indicatorShape ?? DEFAULT_INDICATOR.shape;

  const tipRadius = 3.5 * Math.min(scale, 1.4);
  const armLength = 36 * scale;
  const tipCenter = pegDistance - 2;
  const base: FlapperConfig = {
    pegDistance,
    pegRadius,
    pivotDistance: tipCenter + armLength,
    armLength,
    tipRadius,
    stiffness: 700,
    damping: 17,
    maxAngle: 1,
    restitution: 0.35,
  };
  const flapper = { ...base, maxAngle: Math.min(1.35, releaseAngle(base) + 0.15) };

  return {
    radius,
    frameWidth,
    sliceRadius,
    pegs: input.pegs ?? DEFAULT_FRAME.pegs,
    pegDistance,
    pegRadius,
    hubRadius,
    indicatorAngle: indicatorAngle(input.indicatorPosition),
    indicatorScale: scale,
    indicatorTip: armLength + tipRadius,
    indicatorExtent: (input.customIndicator ? 22 : (SHAPE_EXTENT[shape] ?? 17)) * scale,
    flapper,
  };
}
