/* Text helpers: bidi direction, grapheme splitting and font-accurate measuring. */

/** Strong right-to-left code points: Hebrew, Arabic (incl. Persian/Urdu), Syriac, Thaana, NKo, ... */
const RTL_RANGES: readonly (readonly [number, number])[] = [
  [0x0590, 0x08ff],
  [0xfb1d, 0xfdff],
  [0xfe70, 0xfefe],
  [0x10800, 0x10fff],
  [0x1e800, 0x1efff],
];

function isRtlChar(char: string): boolean {
  const cp = char.codePointAt(0) ?? 0;
  return RTL_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi);
}
const LETTER = /\p{L}/u;

/** Base direction from the first strong character (like `dir="auto"`); null if there is none. */
export function detectDirection(text: string): "ltr" | "rtl" | null {
  for (const char of text) {
    if (isRtlChar(char)) return "rtl";
    if (LETTER.test(char)) return "ltr";
  }
  return null;
}

let segmenter: Intl.Segmenter | null | undefined;

/** User-perceived characters, so truncation never splits a combining mark, ZWJ emoji, etc. */
export function graphemes(text: string): string[] {
  if (segmenter === undefined) {
    segmenter =
      typeof Intl !== "undefined" && "Segmenter" in Intl
        ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
        : null;
  }
  return segmenter ? Array.from(segmenter.segment(text), (s) => s.segment) : Array.from(text);
}

/** Trims whitespace and zero-width joiners/non-joiners left dangling at a cut. */
export function trimCut(text: string): string {
  let end = text.length;
  while (end > 0 && isTrailingFiller(text.charCodeAt(end - 1))) end--;
  return text.slice(0, end);
}

/** Whitespace plus zero-width space/non-joiner/joiner (U+200B–U+200D) and word joiner (U+2060). */
function isTrailingFiller(code: number): boolean {
  return (
    (code >= 0x200b && code <= 0x200d) || code === 0x2060 || /\s/.test(String.fromCharCode(code))
  );
}

export const ELLIPSIS = "…";

/** Width of `text` at a font size of 1 (it scales linearly). */
export type MeasureText = (text: string) => number;

export interface FontSpec {
  /** Canvas font shorthand at 100px. */
  font: string;
  /** Letter spacing as a fraction of the font size. */
  letterSpacing: number;
  /** Inherited text direction at the measured element. */
  direction: "ltr" | "rtl";
  key: string;
}

/** Reads the font a probe element actually renders with (so CSS classes and inline styles count). */
export function readFontSpec(element: Element): FontSpec {
  const cs = getComputedStyle(element);
  const font = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
  const spacing = Number.parseFloat(cs.letterSpacing);
  // The probe is rendered at 100px, so px spacing / 100 = spacing per unit of font size.
  const letterSpacing = Number.isFinite(spacing) ? spacing / 100 : 0;
  const direction = cs.direction === "rtl" ? "rtl" : "ltr";
  return { font, letterSpacing, direction, key: `${font}|${letterSpacing}|${direction}` };
}

let context: CanvasRenderingContext2D | null | undefined;

function canvasContext(): CanvasRenderingContext2D | null {
  if (context === undefined) {
    context =
      typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  }
  return context;
}

/**
 * A cached measurer for one font. Without a font (server render, first client render) it falls
 * back to a rough estimate; the component re-measures before paint once the real font is known.
 * `epoch` should change whenever web fonts finish loading, since metrics change with them.
 */
export function createMeasurer(spec: FontSpec | null, epoch = 0): MeasureText {
  const cache = new Map<string, number>();
  const ctx = spec ? canvasContext() : null;
  void epoch;
  return (text) => {
    const hit = cache.get(text);
    if (hit !== undefined) return hit;
    let width: number;
    if (ctx && spec) {
      ctx.font = spec.font;
      width = ctx.measureText(text).width / 100 + spec.letterSpacing * graphemes(text).length;
    } else {
      width = graphemes(text).length * 0.6;
    }
    cache.set(text, width);
    return width;
  };
}
