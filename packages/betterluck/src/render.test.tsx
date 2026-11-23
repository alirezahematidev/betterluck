import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FortuneWheel } from "./FortuneWheel";
import type { Segment } from "./types";

const persian: Segment[] = [
  { title: "۱۰۰ سکه", frequency: 3, color: "#ef476f" },
  { title: "جایزه بزرگ", frequency: 1, color: "#ffd166", textColor: "#222" },
  { title: "Try again", frequency: 5, color: "#118ab2" },
];

describe("server rendering", () => {
  it("renders without a DOM, with styles inline and RTL labels", () => {
    const html = renderToString(
      createElement(FortuneWheel, {
        segments: persian,
        size: 320,
        hub: { label: "بچرخان" },
        frame: { color: "#123456", width: 30 },
        indicator: { position: "right", shape: "triangle" },
        className: "my-wheel",
        "aria-label": "گردونه شانس",
        classNames: { label: "big-text" },
        styles: { label: { fontSize: 99 } },
        style: { fontFamily: "Vazirmatn" },
      }),
    );
    expect(html).toContain("<style");
    expect(html).toContain(":where(.bl-wheel)");
    // CSS must not be HTML-escaped inside <style>.
    expect(html).toContain('"SF Pro Rounded"');
    expect(html).toContain('direction="rtl"');
    expect(html).toContain('direction="ltr"');
    expect(html).toContain("my-wheel");
    expect(html).toContain("font-family:Vazirmatn");
    expect(html).toContain("--bl-frame-color:#123456");
    expect(html).toContain("بچرخان");
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="گردونه شانس"');
    // The fitted size always wins over user styles, so labels can't overflow.
    expect(html).not.toContain("font-size:99px");
    expect(html).toMatch(/class="bl-label big-text"[^>]*font-size:\d/);
  });

  it("ignores invalid sizes instead of collapsing", () => {
    for (const size of [0, -10, Number.NaN, ""]) {
      const html = renderToString(createElement(FortuneWheel, { segments: persian, size }));
      expect(html).not.toMatch(/width:(0|-|NaN)/);
    }
  });

  it("renders an empty wheel", () => {
    const html = renderToString(createElement(FortuneWheel, { segments: [] }));
    expect(html).toContain("bl-empty");
    expect(html).toMatch(/<button[^>]*disabled/);
  });
});
