import { mod, TAU } from "./math";
import { ELLIPSIS, graphemes, trimCut } from "./text";
import type { MeasureText } from "./text";
import type { Segment, SegmentSizing } from "./types";

/** Wheel-local angles in radians, clockwise from 12 o'clock. */
export interface Arc {
  index: number;
  start: number;
  end: number;
  mid: number;
  span: number;
}

const weightOf = (s: Segment): number =>
  Number.isFinite(s.frequency) && s.frequency > 0 ? s.frequency : 0;

export function totalWeight(segments: readonly Segment[]): number {
  return segments.reduce((sum, s) => sum + weightOf(s), 0);
}

/** Probability of each segment winning, in [0, 1]. */
export function probabilities(segments: readonly Segment[]): number[] {
  const total = totalWeight(segments);
  return segments.map((s) => (total > 0 ? weightOf(s) / total : 0));
}

/**
 * Lays segments around the wheel. In proportional mode, slices follow frequency and
 * zero-frequency segments take no room; if nothing has weight it falls back to equal slices.
 */
export function buildArcs(segments: readonly Segment[], sizing: SegmentSizing): Arc[] {
  const total = totalWeight(segments);
  const proportional = sizing === "proportional" && total > 0;
  const arcs: Arc[] = [];
  let cursor = 0;
  segments.forEach((segment, index) => {
    const span = proportional ? (weightOf(segment) / total) * TAU : TAU / segments.length;
    if (span <= 0) return;
    arcs.push({ index, start: cursor, end: cursor + span, mid: cursor + span / 2, span });
    cursor += span;
  });
  return arcs;
}

/** Weighted random pick; returns -1 when no segment can win. */
export function pickWeighted(segments: readonly Segment[], random: number): number {
  const total = totalWeight(segments);
  if (total <= 0) return -1;
  let threshold = random * total;
  for (let i = 0; i < segments.length; i++) {
    const w = weightOf(segments[i]);
    if (w <= 0) continue;
    if (threshold < w) return i;
    threshold -= w;
  }
  // Floating point leftovers: return the last segment that has weight.
  for (let i = segments.length - 1; i >= 0; i--) if (weightOf(segments[i]) > 0) return i;
  return -1;
}

/** Angular clearance kept from segment edges so the indicator never rests on a peg when there is room. */
const EDGE_CLEARANCE = 0.12;

/** A random wheel-local angle inside `arc`, kept away from its edges. */
export function landingAngle(arc: Arc, random: number): number {
  const margin = Math.min(arc.span * 0.4, Math.max(arc.span * 0.1, EDGE_CLEARANCE));
  return arc.start + margin + random * (arc.span - 2 * margin);
}

/** The wheel rotation (mod 2π) that puts wheel-local `localAngle` under a pointer at `pointerAngle`. */
export function wheelAngleFor(localAngle: number, pointerAngle: number): number {
  return mod(pointerAngle - localAngle, TAU);
}

/** The arc under a pointer at `pointerAngle` when the wheel is rotated by `wheelAngle`. */
export function arcAtPointer(
  arcs: readonly Arc[],
  wheelAngle: number,
  pointerAngle: number,
): Arc | undefined {
  const local = mod(pointerAngle - wheelAngle, TAU);
  return arcs.find((a) => local >= a.start && local < a.end) ?? arcs.at(-1);
}

/** Point at `angle` (clockwise from 12 o'clock) and radius `r`, in SVG coordinates. */
export function polar(angle: number, r: number): [number, number] {
  return [r * Math.sin(angle), -r * Math.cos(angle)];
}

const fixed = (n: number): string => n.toFixed(3);

export function slicePath(arc: Arc, radius: number): string {
  const [x0, y0] = polar(arc.start, radius);
  const [x1, y1] = polar(arc.end, radius);
  const large = arc.span > Math.PI ? 1 : 0;
  return `M0 0L${fixed(x0)} ${fixed(y0)}A${radius} ${radius} 0 ${large} 1 ${fixed(x1)} ${fixed(y1)}Z`;
}

/* ------------------------------------------------------------------------------------------------
 * Labels. Each label is one row laid along its slice's bisector:
 *
 *     hub ··· [image] title ··· rim
 *
 * The title hugs the rim and the image sits right beside it, toward the center. In the row's own
 * frame +x points outward, so every check below is about radii (x) and the slice's width there.
 * ---------------------------------------------------------------------------------------------- */

export interface LabelBounds {
  /** Radius where the row ends (title end, near the rim). */
  outer: number;
  /** Smallest radius the row may reach (just outside the hub). */
  inner: number;
  /** Radius of the slices; no corner of the row may cross it. */
  rim: number;
  maxFont: number;
  minFont: number;
  maxImage: number;
  /** Images smaller than this are dropped. */
  minImage: number;
  /** Image size relative to the font size. */
  imageScale: number;
  /** With a shared font size, long titles are truncated rather than shrunk below this. */
  uniformMinFont: number;
}

export interface LabelLayout {
  /** Rendered text, possibly truncated; "" when no text fits. */
  text: string;
  fontSize: number;
  /** Inner (hub-side) edge of the reserved text box. */
  textStart: number;
  /** Width reserved for the text (measured width plus a safety margin). */
  textWidth: number;
  imageStart: number;
  /** 0 when there is no image or it doesn't fit. */
  imageSize: number;
}

/** Safety margins so rendering differences can never cause overlaps. */
const WIDTH_SLACK = 1.05;
/** Text box height per unit of font size; generous to cover Persian/Arabic ascenders and dots. */
const LINE_HEIGHT = 1.3;
const IMAGE_GAP = 0.45;
const FILL = 0.88;

const EMPTY_LAYOUT: LabelLayout = {
  text: "",
  fontSize: 0,
  textStart: 0,
  textWidth: 0,
  imageStart: 0,
  imageSize: 0,
};

/** How tall a row may be (perpendicular to the bisector) when it reaches down to radius r. */
function roomAt(r: number, span: number): number {
  if (r <= 0) return 0;
  return 2 * r * Math.tan(Math.min(span / 2, Math.PI / 2 - 0.2)) * FILL;
}

function widthOf(text: string, font: number, measure: MeasureText): number {
  return text ? measure(text) * font * WIDTH_SLACK + 0.5 : 0;
}

/**
 * Places `text` at `font`. The image gets its natural size; with `shrinkImage` it may shrink to
 * whatever room is left (or be dropped below `minImage`), otherwise the placement fails.
 */
function place(
  text: string,
  font: number,
  hasImage: boolean,
  span: number,
  b: LabelBounds,
  measure: MeasureText,
  shrinkImage: boolean,
): LabelLayout | null {
  const textWidth = widthOf(text, font, measure);
  const textStart = b.outer - textWidth;
  const lineHeight = font * LINE_HEIGHT;
  if (
    text &&
    (textStart < b.inner ||
      lineHeight > roomAt(textStart, span) ||
      Math.hypot(b.outer, lineHeight / 2) > b.rim)
  ) {
    return null;
  }

  let imageSize = 0;
  let imageStart = textStart;
  if (hasImage) {
    const end = textStart - (text ? font * IMAGE_GAP : 0);
    const natural = text ? Math.min(b.maxImage, font * b.imageScale) : b.maxImage;
    // Largest square that fits: size ≤ room(end − size) and end − size ≥ inner.
    const k = roomAt(1, span);
    const room = Math.min(
      (k * end) / (1 + k),
      end - b.inner,
      2 * Math.sqrt(Math.max(0, b.rim * b.rim - end * end)),
    );
    if (room >= natural) imageSize = natural;
    else if (shrinkImage && room >= b.minImage) imageSize = room;
    else if (!shrinkImage) return null;
    if (imageSize < b.minImage) imageSize = 0;
    imageStart = end - imageSize;
  }
  if (!text && imageSize === 0) return null;
  return { text, fontSize: text ? font : 0, textStart, textWidth, imageStart, imageSize };
}

/** Longest prefix of `title` (plus an ellipsis) that fits; null if not even one character does. */
function truncate(
  title: string,
  font: number,
  hasImage: boolean,
  span: number,
  b: LabelBounds,
  measure: MeasureText,
  shrinkImage: boolean,
): LabelLayout | null {
  const chars = graphemes(title);
  const attempt = (n: number) => {
    const prefix = trimCut(chars.slice(0, n).join(""));
    return prefix ? place(prefix + ELLIPSIS, font, hasImage, span, b, measure, shrinkImage) : null;
  };
  let lo = 0;
  let hi = chars.length - 1;
  while (lo < hi) {
    const n = Math.ceil((lo + hi) / 2);
    if (attempt(n)) lo = n;
    else hi = n - 1;
  }
  return lo > 0 ? attempt(lo) : null;
}

/**
 * Fits one label, in order of preference:
 * 1. the full title with a natural-size image, at the largest font that fits;
 * 2. the full title with the image shrunk into the room left (text keeps priority);
 * 3. a truncated title with a natural-size image;
 * 4. the full title, image dropped;
 * 5. a truncated title, image shrunk or dropped;
 * 6. the image alone; 7. nothing.
 * Nothing ever renders below `minFont` / `minImage`.
 */
export function layoutLabel(
  title: string,
  hasImage: boolean,
  span: number,
  b: LabelBounds,
  measure: MeasureText,
): LabelLayout {
  const imageOnly = () => (hasImage && place("", 0, true, span, b, measure, true)) || EMPTY_LAYOUT;
  if (!title) return imageOnly();

  const maxFont = Math.max(b.maxFont, b.minFont);
  const fonts: number[] = [];
  for (let font = maxFont; font >= b.minFont - 1e-9; font -= 0.5) fonts.push(font);

  for (const font of fonts) {
    const full = place(title, font, hasImage, span, b, measure, false);
    if (full) return full;
  }
  if (hasImage) {
    for (const font of fonts) {
      const shrunk = place(title, font, true, span, b, measure, true);
      if (shrunk && shrunk.imageSize > 0) return shrunk;
    }
  }
  const font = b.minFont;
  return (
    (hasImage && truncate(title, font, true, span, b, measure, false)) ||
    place(title, font, false, span, b, measure, false) ||
    truncate(title, font, hasImage, span, b, measure, true) ||
    imageOnly()
  );
}

export interface LabelInput {
  title: string;
  hasImage: boolean;
  span: number;
}

/**
 * Lays out every label. With `uniform`, all labels share one font size: the largest size at which
 * every typical label shows its full title (slices narrower than the median don't drag it down).
 * It never drops below `uniformMinFont` while a short label still fits a typical slice; longer
 * titles are truncated at that readable size instead of shrinking every label.
 */
export function layoutLabels(
  items: readonly LabelInput[],
  b: LabelBounds,
  measure: MeasureText,
  uniform = true,
): LabelLayout[] {
  const solo = items.map((i) => layoutLabel(i.title, i.hasImage, i.span, b, measure));
  if (!uniform || items.length === 0) return solo;

  const spans = items.map((i) => i.span).toSorted((x, y) => x - y);
  const median = spans[Math.floor((spans.length - 1) / 2)];
  const typical = (span: number) => span >= median - 1e-9;
  // Titles that only fit truncated report `minFont`, so they pull the size down to the floor.
  const natural = solo
    .filter((l, k) => typical(items[k].span) && l.fontSize > 0)
    .map((l) => l.fontSize);

  const maxFont = Math.max(b.maxFont, b.minFont);
  let shared = natural.length > 0 ? Math.min(...natural) : maxFont;
  const floor = Math.min(maxFont, Math.max(b.uniformMinFont, b.minFont));
  if (shared < floor) {
    let font = floor;
    while (font > shared && !place("MM", font, false, median, b, measure, false)) font -= 0.5;
    shared = Math.max(shared, font);
  }
  shared = Math.min(maxFont, Math.max(b.minFont, shared));

  return items.map((i) =>
    layoutLabel(
      i.title,
      i.hasImage,
      i.span,
      { ...b, maxFont: shared, minFont: typical(i.span) ? shared : b.minFont },
      measure,
    ),
  );
}

/** Font size that fits `text` inside a hub of `radius` (0 hides it). */
export function hubFontSize(text: string, radius: number, measure: MeasureText): number {
  if (!text || radius <= 12) return 0;
  const width = measure(text) * WIDTH_SLACK;
  const fit = width > 0 ? ((radius - 9) * 2 * 0.92) / width : Number.POSITIVE_INFINITY;
  return Math.min(radius * 0.4, fit, radius * 0.75);
}

/* ------------------------------------------------------------------------------------------------
 * Color
 * ---------------------------------------------------------------------------------------------- */

/** A color channel: a plain number, or a percentage of `scale`. */
function colorChannel(v: string, scale: number): number {
  return v.endsWith("%") ? (Number.parseFloat(v) / 100) * scale : Number.parseFloat(v);
}

/** Parses hex (#rgb, #rgba, #rrggbb, #rrggbbaa), rgb()/rgba() and hsl()/hsla() into 0–255 RGB. */
export function parseColor(color: string): [number, number, number] | null {
  const c = color.trim().toLowerCase();
  const hex = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/.exec(c);
  if (hex) {
    const h = hex[1].length <= 4 ? [...hex[1]].map((d) => d + d).join("") : hex[1];
    return [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  }
  const fn = /^(rgba?|hsla?)\((.*)\)$/.exec(c);
  if (!fn) return null;
  const parts = fn[2]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .slice(0, 3);
  if (parts.length < 3) return null;
  if (fn[1].startsWith("rgb")) {
    const rgb = parts.map((v) => colorChannel(v, 255));
    return rgb.every(Number.isFinite) ? (rgb as [number, number, number]) : null;
  }
  const hue = Number.parseFloat(parts[0]);
  const sat = colorChannel(parts[1], 1);
  const light = colorChannel(parts[2], 1);
  if (![hue, sat, light].every(Number.isFinite)) return null;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    return 255 * (light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

function linearChannel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * linearChannel(r) + 0.7152 * linearChannel(g) + 0.0722 * linearChannel(b);
}

/** Dark or light text, whichever contrasts more with `background`. */
export function contrastText(background: string): "dark" | "light" {
  const rgb = parseColor(background);
  if (!rgb) return "light";
  const L = luminance(rgb);
  // Contrast against white (L=1) vs. near-black (L≈0.012).
  return 1.05 / (L + 0.05) >= (L + 0.05) / 0.062 ? "light" : "dark";
}
