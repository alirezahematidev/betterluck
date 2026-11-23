import { describe, expect, it } from "vitest";
import { countCrossings } from "./engine";
import { TAU } from "./math";
import { createMeasurer, detectDirection, graphemes, trimCut } from "./text";

const ZWNJ = String.fromCodePoint(0x200c);

describe("direction", () => {
  it("detects the base direction from the first strong character", () => {
    expect(detectDirection("جایزه بزرگ")).toBe("rtl");
    expect(detectDirection("۱۰۰ سکه")).toBe("rtl");
    expect(detectDirection("100 سکه")).toBe("rtl");
    expect(detectDirection("שלום")).toBe("rtl");
    expect(detectDirection("Jackpot")).toBe("ltr");
    expect(detectDirection("100 coins")).toBe("ltr");
    expect(detectDirection("🎁 جایزه")).toBe("rtl");
    expect(detectDirection("123 🎉")).toBeNull();
  });
});

describe("graphemes", () => {
  it("keeps combining marks, ZWNJ words and emoji sequences intact", () => {
    // ZWNJ is an Extend character: it stays with the letter before it.
    expect(graphemes(`می${ZWNJ}خواهم`)).toEqual(["م", `ی${ZWNJ}`, "خ", "و", "ا", "ه", "م"]);
    const ZWJ = String.fromCodePoint(0x200d);
    expect(graphemes(`👨${ZWJ}👩${ZWJ}👧`)).toHaveLength(1);
    expect(graphemes(`e${String.fromCodePoint(0x301)}`)).toHaveLength(1);
  });

  it("trims dangling spaces and joiners at a cut", () => {
    expect(trimCut(`می${ZWNJ}`)).toBe("می");
    expect(trimCut("abc  ")).toBe("abc");
  });

  it("estimates widths without a DOM", () => {
    const measure = createMeasurer(null);
    expect(measure("abcd")).toBeCloseTo(2.4);
  });
});

describe("tick counting without pegs", () => {
  it("counts each boundary passing the pointer, in both directions", () => {
    const pegs = Array.from({ length: 8 }, (_, i) => (i * TAU) / 8);
    expect(countCrossings(pegs, 0.1, 0.1 + TAU, 0)).toBe(8);
    expect(countCrossings(pegs, 0.1, 0.1 - TAU / 4, 0)).toBe(2);
    expect(countCrossings(pegs, 0.1, 0.2, 0)).toBe(0);
  });
});
