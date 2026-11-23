import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FortuneWheel } from "./FortuneWheel";
import type { Segment } from "./types";

const persian: Segment[] = [
  { title: "۱۰۰ سکه", reward: "۱۰۰ سکه", frequency: 3, color: "#ef476f" },
  { title: "جایزه بزرگ", reward: "۱۰۰۰ سکه", frequency: 1, color: "#ffd166", textColor: "#222" },
  { title: "Try again", reward: "", frequency: 5, color: "#118ab2" },
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
        style: { fontFamily: "Vazirmatn" },
      }),
    );
    expect(html).toContain("<style");
    expect(html).toContain(":where(.rpw)");
    // CSS must not be HTML-escaped inside <style>.
    expect(html).toContain('"SF Pro Rounded"');
    expect(html).toContain('direction="rtl"');
    expect(html).toContain('direction="ltr"');
    expect(html).toContain("my-wheel");
    expect(html).toContain("font-family:Vazirmatn");
    expect(html).toContain("--rpw-frame-color:#123456");
    expect(html).toContain("بچرخان");
  });

  it("renders an empty wheel", () => {
    const html = renderToString(createElement(FortuneWheel, { segments: [] }));
    expect(html).toContain("rpw-empty");
    expect(html).toMatch(/<button[^>]*disabled/);
  });
});
