import { describe, expect, it } from "vitest";
import { buildGeometry } from "./config";
import { createFlapperState, flapperAtRest, releaseAngle, stepFlapper } from "./flapper";
import { buildArcs } from "./geometry";
import { TAU } from "./math";

const pegs = Array.from({ length: 12 }, (_, i) => (i * TAU) / 12);
const twelve = buildArcs(
  pegs.map(() => ({ title: "", reward: "", frequency: 1, color: "#000" })),
  "equal",
);
const geometryFor = (overrides: Partial<Parameters<typeof buildGeometry>[0]> = {}) =>
  buildGeometry(
    {
      frameWidth: undefined,
      pegs: undefined,
      pegSize: undefined,
      hubRadius: undefined,
      indicatorPosition: undefined,
      indicatorSize: undefined,
      indicatorShape: undefined,
      customIndicator: false,
      ...overrides,
    },
    twelve,
  );
const FLAPPER = geometryFor().flapper;
const halfSlice = TAU / 24;

/** Turns the wheel from `from` to `to` at `speed` rad/s and returns the flapper trace. */
function run(from: number, to: number, speed: number) {
  const state = createFlapperState(pegs.length);
  const dt = 1 / 2000;
  const step = Math.sign(to - from) * speed * dt;
  const trace: number[] = [];
  let ticks = 0;
  for (let a = from; Math.sign(to - from) * (to - a) > 0; a += step) {
    ticks += stepFlapper(state, FLAPPER, pegs, a, dt);
    trace.push(state.angle);
  }
  return { state, trace, ticks };
}

describe("flapper", () => {
  it("is deflected in the direction of rotation and ticks once per peg", () => {
    // Start mid-slice and turn clockwise past exactly 3 pegs.
    const { trace, ticks } = run(halfSlice, halfSlice + 3 * (TAU / 12), 2);
    expect(ticks).toBe(3);
    expect(Math.max(...trace)).toBeGreaterThan(0.4);
    expect(Math.max(...trace)).toBeLessThan(1);
  });

  it("deflects the other way when the wheel turns backwards", () => {
    const { trace, ticks } = run(-halfSlice, -halfSlice - 2 * (TAU / 12), 2);
    expect(ticks).toBe(2);
    expect(Math.min(...trace)).toBeLessThan(-0.4);
  });

  it("settles back to rest between pegs", () => {
    const { state } = run(halfSlice, halfSlice + TAU / 12, 1);
    for (let i = 0; i < 4000; i++)
      stepFlapper(state, FLAPPER, pegs, halfSlice + TAU / 12, 1 / 2000);
    expect(flapperAtRest(state)).toBe(true);
    expect(Math.abs(state.angle)).toBeLessThan(1e-3);
  });

  it("doesn't let fast pegs tunnel through and never passes the end stop", () => {
    const { ticks, trace } = run(halfSlice, halfSlice + 2 * TAU, 25);
    expect(ticks).toBe(24);
    expect(Math.max(...trace.map(Math.abs))).toBeLessThanOrEqual(FLAPPER.maxAngle);
  });

  it("end stop sits beyond the angle where a peg slips free", () => {
    // Push the flapper quasi-statically and record the largest deflection the pegs force.
    const { trace } = run(halfSlice, halfSlice + TAU / 12, 0.05);
    expect(Math.max(...trace)).toBeLessThan(FLAPPER.maxAngle - 0.05);
  });

  it("keeps the end stop past the slip angle for every indicator size and rim width", () => {
    for (const indicatorSize of [0.4, 0.7, 1, 1.6, 2.5]) {
      for (const frameWidth of [0, 8, 24, 60]) {
        const cfg = geometryFor({ indicatorSize, frameWidth }).flapper;
        expect(cfg.maxAngle).toBeGreaterThan(releaseAngle(cfg) + 0.1);
        // And pegs still get past it at speed.
        const state = createFlapperState(pegs.length);
        let ticks = 0;
        for (let a = halfSlice; a < halfSlice + TAU; a += 20 / 2000) {
          ticks += stepFlapper(state, cfg, pegs, a, 1 / 2000);
        }
        expect(ticks).toBe(12);
      }
    }
  });
});
