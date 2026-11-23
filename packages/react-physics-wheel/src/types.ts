import type { CSSProperties, ReactNode } from "react";

export interface Segment {
  /** Stable identity for React keys. Optional; the index is used when missing. */
  id?: string | number;
  title: string;
  reward: string;
  /** Relative weight used to pick the winner. A frequency of 0 never wins. */
  frequency: number;
  /** Slice fill: any CSS color. Hex values also drive the automatic label contrast. */
  color: string;
  /** Label color for this slice. Overrides `labels.color` and the automatic contrast. */
  textColor?: string;
  /** Optional image URL (http(s), data: or relative). Drawn beside the title, toward the hub. */
  image?: string;
}

/**
 * - `equal`: every segment gets the same slice; `frequency` only changes the odds.
 * - `proportional`: slice size follows `frequency`, so what you see is the real probability.
 */
export type SegmentSizing = "equal" | "proportional";

/** Text direction of labels. `auto` picks it per label from its first strong character. */
export type LabelDirection = "ltr" | "rtl" | "auto";

export type SpinDirection = "clockwise" | "counterclockwise";

export type IndicatorPosition = "top" | "right" | "bottom" | "left" | number;

export type IndicatorShape = "pin" | "triangle" | "needle";

export interface WheelPhysics {
  /** Seconds of constant torque that spins the wheel up before it coasts. */
  spinUpTime: number;
  /** Dry (Coulomb) friction of the axle, rad/s². Dominates the final slow crawl. */
  friction: number;
  /** Viscous/air drag coefficient, 1/s. Dominates while the wheel is fast. */
  drag: number;
  /** Launch speed range for a programmatic spin, rad/s. A random value in range is used. */
  minLaunchSpeed: number;
  maxLaunchSpeed: number;
  /** Minimum release speed (rad/s) for a drag-and-flick to count as a spin. */
  flickThreshold: number;
}

/**
 * All lengths are in wheel units: the wheel is 500 units across and scales to its rendered size.
 */
export interface FrameOptions {
  /** Rim thickness. 0 removes the rim. Default 24. */
  width?: number;
  /** Rim color. */
  color?: string;
  /** Pegs that drive the indicator. Default true. */
  pegs?: boolean;
  pegColor?: string;
  /** Peg radius; shrinks automatically when slices get tight. Default 4.5. */
  pegSize?: number;
  /** Lines between slices. */
  dividerColor?: string;
  /** Default 1.5. 0 removes them. */
  dividerWidth?: number;
  /** Soft shading toward the rim. Default true. */
  shading?: boolean;
}

export interface IndicatorRenderContext {
  /** Distance from the pivot (origin) to the tip, pointing toward the wheel along +y. */
  tip: number;
  /** The indicator scale (`indicator.size`). */
  scale: number;
}

export interface IndicatorOptions {
  /** A side, or degrees clockwise from 12 o'clock. Default `top`. */
  position?: IndicatorPosition;
  /** Default `pin`. */
  shape?: IndicatorShape;
  color?: string;
  /** Scale factor for the indicator (and its physical arm). Default 1. */
  size?: number;
  /** Let pegs push the indicator around. Default true. */
  flap?: boolean;
  /**
   * Draw your own indicator as SVG. It's rendered in the indicator's frame: the hinge is at the
   * origin and the indicator points down (+y) toward the wheel, with its tip at `y = tip`.
   */
  render?: (context: IndicatorRenderContext) => ReactNode;
}

export interface HubOptions {
  /** Center content. Strings are auto-fitted; other nodes render as-is. Default "SPIN". */
  label?: ReactNode;
  /** Radius in wheel units. 0 hides the hub. Default 40. */
  radius?: number;
  color?: string;
  textColor?: string;
  /** Spin when the hub is clicked. Default true. */
  clickable?: boolean;
  /** Accessible name of the hub button. */
  ariaLabel?: string;
}

export interface LabelOptions {
  /** Color for every label (segments' `textColor` still wins). Default: automatic contrast. */
  color?: string;
  /** Largest font size, in wheel units. Default 24. */
  maxFontSize?: number;
  /** Labels never render smaller than this many CSS pixels; long titles truncate, then hide. Default 9. */
  minFontPx?: number;
  /** Images never render smaller than this many CSS pixels; they're hidden instead. Default 12. */
  minImagePx?: number;
  /** Image size relative to the font size. Default 1.9. */
  imageScale?: number;
  /** Largest image, in wheel units. Default 52. */
  maxImageSize?: number;
  /** Use one font size for all labels. Default true. */
  uniform?: boolean;
  /** Gap kept between labels and the rim, in wheel units. Default 12. */
  inset?: number;
  /** Text direction. Default `auto` (per label). */
  direction?: LabelDirection;
}

/** Parts that accept a `className` / `style` via `classNames` / `styles`. */
export type WheelPart =
  | "root"
  | "disc"
  | "slice"
  | "label"
  | "image"
  | "frame"
  | "peg"
  | "winner"
  | "hub"
  | "hubLabel"
  | "indicator";

export type WheelClassNames = Partial<Record<WheelPart, string>>;
export type WheelStyles = Partial<Record<WheelPart, CSSProperties>>;

export interface SpinResult {
  index: number;
  segment: Segment;
}

export interface SpinOptions {
  /** Force the landing segment, e.g. when a server decides the reward. Defaults to a weighted random pick. */
  index?: number;
}

export interface FortuneWheelHandle {
  /** Starts a spin. Returns `false` when the wheel is busy, disabled, or nothing can win. */
  spin(options?: SpinOptions): boolean;
  isSpinning(): boolean;
}
