import { describe, expect, it } from "vitest";
import { mod, TAU } from "./math";
import {
  angleAt,
  coastAngle,
  coastDistance,
  coastSpeed,
  coastStopTime,
  planCoast,
  planLaunch,
  velocityAt,
} from "./physics";

const friction = { mu: 0.9, k: 0.32 };

/** Integrates dω/dt = −μ − kω numerically, independently of the closed form. */
function integrate(w0: number, f: typeof friction, dt = 1e-5) {
  let w = w0;
  let angle = 0;
  let t = 0;
  while (w > 0) {
    const a = -f.mu - f.k * w;
    const next = w + a * dt;
    angle += next > 0 ? ((w + next) / 2) * dt : (w * w) / (2 * -a);
    t += next > 0 ? dt : w / -a;
    w = next;
  }
  return { angle, t };
}

describe("coasting closed form", () => {
  it("matches numerical integration", () => {
    for (const w0 of [3, 12, 22]) {
      const numeric = integrate(w0, friction);
      expect(coastDistance(w0, friction)).toBeCloseTo(numeric.angle, 3);
      expect(coastStopTime(w0, friction)).toBeCloseTo(numeric.t, 3);
    }
  });

  it("handles pure dry friction (k = 0)", () => {
    const f = { mu: 2, k: 0 };
    expect(coastStopTime(10, f)).toBeCloseTo(5);
    expect(coastDistance(10, f)).toBeCloseTo(25);
  });

  it("speed is the derivative of angle and reaches exactly zero", () => {
    const w0 = 18;
    const ts = coastStopTime(w0, friction);
    for (const t of [0.01, 0.5, 2, ts * 0.9]) {
      const h = 1e-5;
      const numeric = (coastAngle(w0, friction, t + h) - coastAngle(w0, friction, t - h)) / (2 * h);
      expect(coastSpeed(w0, friction, t)).toBeCloseTo(numeric, 4);
    }
    expect(coastSpeed(w0, friction, ts)).toBe(0);
  });
});

describe("planLaunch", () => {
  it("lands exactly on the target angle after at least minTravel", () => {
    for (let i = 0; i < 200; i++) {
      const startAngle = (i * 1.37) % TAU;
      const targetAngle = (i * 2.11) % TAU;
      const minTravel = 30 + (i % 20);
      const plan = planLaunch({
        startAngle,
        direction: 1,
        spinUpTime: 0.45,
        friction,
        targetAngle,
        minTravel,
      });

      const end = angleAt(plan, plan.duration - 1e-9);
      expect(mod(end - targetAngle + 1e-6, TAU)).toBeLessThan(2e-6);
      expect(plan.endAngle - startAngle).toBeGreaterThanOrEqual(minTravel);
      expect(plan.endAngle - startAngle).toBeLessThan(minTravel + TAU);
      // Friction is untouched: the plan is the configured physics.
      expect(plan.friction).toEqual(friction);
    }
  });

  it("is continuous through the spin-up/coast boundary", () => {
    const plan = planLaunch({
      startAngle: 0,
      direction: 1,
      spinUpTime: 0.5,
      friction,
      targetAngle: 1,
      minTravel: 40,
    });
    const T = plan.spinUpTime;
    expect(angleAt(plan, T - 1e-9)).toBeCloseTo(angleAt(plan, T + 1e-9), 6);
    expect(velocityAt(plan, T - 1e-9)).toBeCloseTo(velocityAt(plan, T + 1e-9), 4);
  });

  it("is monotonic: the wheel never rolls backwards", () => {
    const plan = planLaunch({
      startAngle: 2,
      direction: 1,
      spinUpTime: 0.4,
      friction,
      targetAngle: 5,
      minTravel: 35,
    });
    let previous = angleAt(plan, 0);
    for (let t = 0; t <= plan.duration + 0.1; t += 1 / 120) {
      const a = angleAt(plan, t);
      expect(a).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = a;
    }
  });
});

describe("planCoast (flick)", () => {
  it("lands on target in either direction with friction scaled close to 1", () => {
    for (let i = 0; i < 200; i++) {
      const direction = i % 2 === 0 ? 1 : -1;
      const launchSpeed = 5 + (i % 17);
      const startAngle = (i * 0.77) % TAU;
      const targetAngle = (i * 1.93) % TAU;
      const plan = planCoast({
        startAngle,
        direction,
        launchSpeed,
        friction,
        targetAngle,
        minTravel: Math.PI,
      });

      expect(mod(plan.endAngle - targetAngle + 1e-6, TAU)).toBeLessThan(2e-6);
      const end = angleAt(plan, plan.duration - 1e-9);
      expect(end).toBeCloseTo(plan.endAngle, 5);
      expect(direction * (plan.endAngle - startAngle)).toBeGreaterThanOrEqual(Math.PI);
      // Starts at the release speed, so there's no visible jump.
      expect(Math.abs(velocityAt(plan, 1e-9))).toBeCloseTo(launchSpeed, 5);

      const scale = plan.friction.mu / friction.mu;
      expect(plan.friction.k / friction.k).toBeCloseTo(scale, 9);
      expect(scale).toBeGreaterThan(0.4);
      expect(scale).toBeLessThan(2.5);
    }
  });
});
