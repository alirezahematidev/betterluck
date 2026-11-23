import { describe, expect, it } from "vitest";
import {
  arcAtPointer,
  buildArcs,
  contrastText,
  parseColor,
  landingAngle,
  hubFontSize,
  layoutLabel,
  layoutLabels,
  pickWeighted,
  probabilities,
  wheelAngleFor,
} from "./geometry";
import { TAU } from "./math";
import { trimCut } from "./text";
import type { LabelBounds, LabelLayout } from "./geometry";
import type { Segment } from "./types";

const seg = (title: string, frequency: number): Segment => ({
  title,
  frequency,
  color: "#123456",
});
const segments = [seg("A", 1), seg("B", 3), seg("C", 0), seg("D", 6)];

describe("arcs", () => {
  it("equal sizing covers the circle with equal slices, including zero-frequency ones", () => {
    const arcs = buildArcs(segments, "equal");
    expect(arcs).toHaveLength(4);
    for (const a of arcs) expect(a.span).toBeCloseTo(TAU / 4);
    expect(arcs.at(-1)?.end).toBeCloseTo(TAU);
  });

  it("proportional sizing follows frequency and drops zero-frequency slices", () => {
    const arcs = buildArcs(segments, "proportional");
    expect(arcs.map((a) => a.index)).toEqual([0, 1, 3]);
    expect(arcs.map((a) => a.span / TAU)).toEqual([0.1, 0.3, 0.6].map((x) => expect.closeTo(x, 9)));
  });

  it("falls back to equal slices when nothing has weight", () => {
    expect(buildArcs([seg("A", 0), seg("B", 0)], "proportional")).toHaveLength(2);
  });
});

describe("weighted pick", () => {
  it("never picks zero-frequency segments and matches the weights", () => {
    const counts = [0, 0, 0, 0];
    const n = 100_000;
    for (let i = 0; i < n; i++) counts[pickWeighted(segments, (i + 0.5) / n)]++;
    expect(counts[2]).toBe(0);
    const p = probabilities(segments);
    counts.forEach((c, i) => expect(c / n).toBeCloseTo(p[i], 3));
  });

  it("returns -1 when nothing can win", () => {
    expect(pickWeighted([seg("A", 0)], 0.5)).toBe(-1);
    expect(pickWeighted([], 0.5)).toBe(-1);
  });

  it("handles random values at the edges", () => {
    expect(pickWeighted(segments, 0)).toBe(0);
    expect(pickWeighted(segments, 0.999_999_999)).toBe(3);
  });
});

describe("landing", () => {
  it("lands strictly inside the chosen arc for every pointer position", () => {
    for (const sizing of ["equal", "proportional"] as const) {
      const arcs = buildArcs(segments, sizing);
      for (const pointer of [0, Math.PI / 2, Math.PI, 4.2]) {
        for (const arc of arcs) {
          for (const r of [0, 0.25, 0.5, 0.999]) {
            const local = landingAngle(arc, r);
            expect(local).toBeGreaterThan(arc.start);
            expect(local).toBeLessThan(arc.end);
            const wheel = wheelAngleFor(local, pointer) + TAU * 7;
            expect(arcAtPointer(arcs, wheel, pointer)?.index).toBe(arc.index);
          }
        }
      }
    }
  });
});

const measure = (text: string) => text.length * 0.6;

const textStart = (l: LabelLayout) => l.textStart;
const textEnd = (l: LabelLayout) => l.textStart + l.textWidth;

/** Geometric invariants every layout must satisfy: nothing overlaps, nothing leaves its slice. */
function fitViolations(l: LabelLayout, span: number, b: LabelBounds): string[] {
  const room = (r: number) => 2 * r * Math.tan(Math.min(span / 2, Math.PI / 2 - 0.2));
  const eps = 1e-9;
  const checks: [boolean, string][] = [];
  if (l.text) {
    checks.push(
      [l.fontSize >= b.minFont - eps, "font below minimum"],
      [textEnd(l) <= b.outer + eps, "text past the rim inset"],
      [textStart(l) >= b.inner - eps, "text into the hub"],
      [l.fontSize * 1.3 <= room(textStart(l)) + eps, "text taller than its slice"],
      [Math.hypot(b.outer, (l.fontSize * 1.3) / 2) <= b.rim + eps, "text corner past the rim"],
      [l.textWidth >= measure(l.text) * l.fontSize, "text box narrower than the text"],
    );
  }
  if (l.imageSize > 0) {
    const imageEnd = l.imageStart + l.imageSize;
    checks.push(
      [l.imageSize >= b.minImage - eps, "image below minimum"],
      [l.imageStart >= b.inner - eps, "image into the hub"],
      [l.imageSize <= room(l.imageStart) + eps, "image wider than its slice"],
      [!l.text || imageEnd < textStart(l), "image overlaps text"],
      [Math.hypot(imageEnd, l.imageSize / 2) <= b.rim + eps, "image corner past the rim"],
    );
  }
  return checks.filter(([ok]) => !ok).map(([, why]) => `${why}: ${JSON.stringify(l)}`);
}

const assertFits = (l: LabelLayout, span: number, b: LabelBounds) =>
  expect(fitViolations(l, span, b)).toEqual([]);

describe("labels", () => {
  const bounds: LabelBounds = {
    outer: 200,
    inner: 48,
    rim: 210,
    maxFont: 24,
    minFont: 10,
    maxImage: 52,
    minImage: 8,
    imageScale: 1.9,
    uniformMinFont: 14,
  };
  it("puts the image right beside the title, toward the center", () => {
    const l = layoutLabel("Jackpot", true, TAU / 8, bounds, measure);
    expect(textEnd(l)).toBeCloseTo(bounds.outer);
    expect(l.imageSize).toBeGreaterThan(0);
    const gap = textStart(l) - (l.imageStart + l.imageSize);
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(l.fontSize);
    assertFits(l, TAU / 8, bounds);
  });

  it("truncates long titles by grapheme and keeps the image", () => {
    const long = "An extraordinarily long prize title that cannot possibly fit";
    const l = layoutLabel(long, true, TAU / 24, bounds, measure);
    expect(l.text.endsWith("…")).toBe(true);
    expect(l.imageSize).toBeGreaterThan(0);
    assertFits(l, TAU / 24, bounds);
  });

  it("truncates Persian titles without leaving a dangling joiner", () => {
    const l = layoutLabel(
      "جایزه‌ی بسیار بزرگ و طولانی برای برنده‌ی خوش‌شانس",
      false,
      TAU / 16,
      bounds,
      measure,
    );
    expect(l.text.endsWith("…")).toBe(true);
    // No space or ZWNJ is left dangling before the ellipsis.
    const kept = l.text.slice(0, -1);
    expect(trimCut(kept)).toBe(kept);
  });

  it("never renders below the minimum font: hides text, then the image", () => {
    const tiny = { ...bounds, minFont: 40 };
    const l = layoutLabel("Prize", true, TAU / 30, tiny, measure);
    expect(l.text).toBe("");
    assertFits(l, TAU / 30, tiny);
    const nothing = layoutLabel("Prize", true, TAU / 400, { ...tiny, minImage: 30 }, measure);
    expect(nothing.text).toBe("");
    expect(nothing.imageSize).toBe(0);
  });

  it("shares one font size across labels, truncating outliers instead of shrinking them", () => {
    const span = TAU / 12;
    const titles = [
      "Prize 1",
      "Prize 2",
      "Prize 3",
      "Prize 4",
      "A title far too long to fit at this size",
    ];
    const layouts = layoutLabels(
      titles.map((title, i) => ({ title, hasImage: i % 2 === 0, span })),
      bounds,
      measure,
    );
    expect(new Set(layouts.map((l) => l.fontSize)).size).toBe(1);
    expect(layouts[4].text.endsWith("…")).toBe(true);
    expect(layouts[4].fontSize).toBeGreaterThanOrEqual(bounds.uniformMinFont);
  });

  it("supports image-only and title-only slices", () => {
    expect(layoutLabel("", true, TAU / 6, bounds, measure).imageSize).toBeGreaterThan(20);
    expect(layoutLabel("Hi", false, TAU / 6, bounds, measure).imageSize).toBe(0);
  });

  it("satisfies the no-overlap invariants across a sweep of inputs", () => {
    const titles = [
      "",
      "A",
      "Prize 12",
      "جایزه بزرگ",
      "Mystery Gift Box",
      "۱۰۰ سکه",
      "W".repeat(40),
    ];
    const variants: LabelBounds[] = [
      bounds,
      { ...bounds, minFont: 4, minImage: 2 },
      { ...bounds, maxFont: 60, outer: 208, rim: 210 },
      { ...bounds, inner: 120 },
      { ...bounds, imageScale: 4, maxImage: 120 },
    ];
    const violations: string[] = [];
    for (const b of variants) {
      for (const n of [1, 2, 3, 5, 8, 12, 24, 60, 150]) {
        const span = TAU / n;
        for (const title of titles) {
          for (const hasImage of [false, true])
            violations.push(
              ...fitViolations(layoutLabel(title, hasImage, span, b, measure), span, b),
            );
        }
        const all = layoutLabels(
          titles.map((title, i) => ({ title, hasImage: i % 2 === 1, span })),
          b,
          measure,
        );
        for (const l of all) violations.push(...fitViolations(l, span, b));
      }
    }
    expect(violations).toEqual([]);
  });
});

describe("hub label", () => {
  it("fits inside the hub and hides when there is no hub", () => {
    for (const text of ["SPIN", "بچرخان", "Spin the wheel now!"]) {
      const f = hubFontSize(text, 40, measure);
      expect(measure(text) * f).toBeLessThanOrEqual(2 * (40 - 9));
    }
    expect(hubFontSize("SPIN", 0, measure)).toBe(0);
  });
});

describe("color", () => {
  it("parses hex, rgb() and hsl()", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255]);
    expect(parseColor("#ffd16680")).toEqual([255, 209, 102]);
    expect(parseColor("#f008")).toEqual([255, 0, 0]);
    expect(parseColor("rgb(10, 20, 30)")).toEqual([10, 20, 30]);
    expect(parseColor("rgb(10 20 30 / 50%)")).toEqual([10, 20, 30]);
    expect(parseColor("rgba(100%, 0%, 0%, 0.5)")).toEqual([255, 0, 0]);
    expect(parseColor("hsl(0, 100%, 50%)")?.map(Math.round)).toEqual([255, 0, 0]);
    expect(parseColor("hsl(120deg 100% 25%)")?.map(Math.round)).toEqual([0, 128, 0]);
    expect(parseColor("rebeccapurple")).toBeNull();
    expect(parseColor("#12")).toBeNull();
  });

  it("chooses readable text", () => {
    expect(contrastText("#ffd166")).toBe("dark");
    expect(contrastText("#7b2cbf")).toBe("light");
    expect(contrastText("#fff")).toBe("dark");
    expect(contrastText("rgb(250 250 210)")).toBe("dark");
    expect(contrastText("hsl(220, 60%, 20%)")).toBe("light");
    expect(contrastText("rebeccapurple")).toBe("light");
  });
});
