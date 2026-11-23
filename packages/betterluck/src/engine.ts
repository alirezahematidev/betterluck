import { createFlapperState, flapperAtRest, stepFlapper } from "./flapper";
import type { FlapperConfig, FlapperState } from "./flapper";
import { clamp, mod, TAU } from "./math";
import { angleAt } from "./physics";
import type { SpinPlan } from "./physics";

export interface EngineCallbacks {
  /** Called every frame with the wheel rotation and flapper deflection (radians). */
  render(wheelAngle: number, flapperAngle: number): void;
  /** A peg slipped past the indicator. */
  tick(intensity: number): void;
  /** The current spin came to rest. */
  settle(): void;
}

type Motion =
  | { kind: "idle" }
  | { kind: "drag"; target: number; samples: { t: number; angle: number }[] }
  | { kind: "spin"; plan: SpinPlan; start: number };

/** Largest wheel rotation per flapper sub-step, so fast pegs can't tunnel through the tip. */
const MAX_SUBSTEP_ANGLE = 0.01;
const MAX_SUBSTEP_DT = 1 / 480;
const MAX_SUBSTEPS = 160;
const VELOCITY_WINDOW_MS = 90;
const NO_PEGS: readonly number[] = [];

/** How many times any peg passes the pointer while the wheel turns from `from` to `to`. */
export function countCrossings(
  pegs: readonly number[],
  from: number,
  to: number,
  pointer: number,
): number {
  let count = 0;
  for (const peg of pegs) {
    const a = Math.floor((from + peg - pointer) / TAU);
    const b = Math.floor((to + peg - pointer) / TAU);
    count += Math.abs(b - a);
  }
  return count;
}

/**
 * Drives the wheel outside of React: owns the wheel angle, the motion (idle / drag / spin), the
 * indicator flapper simulation and the animation frame loop. React only renders static geometry.
 */
export class WheelEngine {
  wheelAngle = 0;
  pointerAngle = 0;

  private pegs: readonly number[] = [];
  /** Whether pegs physically push the flapper; otherwise ticks come from boundary crossings. */
  private collide = true;
  private flapper: FlapperState = createFlapperState(0);
  private motion: Motion = { kind: "idle" };
  private frame = 0;
  private lastTime = -1;
  private cb: EngineCallbacks | null = null;
  private flapperConfig: FlapperConfig;

  constructor(flapperConfig: FlapperConfig) {
    this.flapperConfig = flapperConfig;
  }

  setFlapperConfig(config: FlapperConfig): void {
    const current = this.flapperConfig;
    const same = (Object.keys(config) as (keyof FlapperConfig)[]).every(
      (key) => config[key] === current[key],
    );
    if (same) return;
    this.flapperConfig = config;
    this.flapper = createFlapperState(this.pegs.length);
    this.wake();
  }

  /** Attaches the renderer and starts animating if needed. */
  connect(callbacks: EngineCallbacks): void {
    this.cb = callbacks;
    this.wake();
  }

  /** Detaches the renderer and stops the frame loop (e.g. on unmount). */
  disconnect(): void {
    this.stop();
    this.cb = null;
  }

  /** Puts the wheel at `angle` without animating (only while idle). */
  placeAt(angle: number): void {
    if (this.busy) return;
    this.wheelAngle = angle;
    this.renderNow();
  }

  get busy(): boolean {
    return this.motion.kind !== "idle";
  }

  get spinning(): boolean {
    return this.motion.kind === "spin";
  }

  /** Peg (slice boundary) angles; `collide` false keeps the indicator still but still ticks. */
  setPegs(pegs: readonly number[], collide: boolean): void {
    const samePegs = pegs.length === this.pegs.length && pegs.every((p, i) => p === this.pegs[i]);
    if (samePegs && collide === this.collide) return;
    this.pegs = pegs;
    this.collide = collide;
    this.flapper = createFlapperState(pegs.length, collide ? this.flapper : undefined);
    this.wake();
  }

  setPointerAngle(angle: number): void {
    if (angle === this.pointerAngle) return;
    this.pointerAngle = angle;
    this.flapper = createFlapperState(this.pegs.length);
    this.wake();
  }

  spin(plan: SpinPlan): void {
    this.motion = { kind: "spin", plan, start: performance.now() };
    this.wake();
  }

  grab(): void {
    if (this.busy) return;
    this.motion = {
      kind: "drag",
      target: this.wheelAngle,
      samples: [{ t: performance.now(), angle: this.wheelAngle }],
    };
    this.wake();
  }

  dragBy(delta: number): void {
    if (this.motion.kind !== "drag") return;
    const m = this.motion;
    m.target += delta;
    const t = performance.now();
    m.samples.push({ t, angle: m.target });
    while (m.samples.length > 2 && t - m.samples[0].t > VELOCITY_WINDOW_MS) m.samples.shift();
    this.wake();
  }

  /** Ends a drag and returns the release angular velocity (rad/s). */
  release(): number {
    if (this.motion.kind !== "drag") return 0;
    const { samples, target } = this.motion;
    this.motion = { kind: "idle" };
    this.wake();

    const now = performance.now();
    const recent = samples.filter((s) => now - s.t <= VELOCITY_WINDOW_MS);
    if (recent.length === 0) return 0;
    const first = recent[0];
    const elapsed = (now - first.t) / 1000;
    return elapsed > 0.008 ? (target - first.angle) / elapsed : 0;
  }

  /** Re-renders the current state without advancing time. */
  renderNow(): void {
    this.cb?.render(this.wheelAngle, this.flapper.angle);
  }

  wake(): void {
    if (this.frame || !this.cb || typeof requestAnimationFrame === "undefined") return;
    this.lastTime = -1;
    this.frame = requestAnimationFrame(this.step);
  }

  stop(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private readonly step = (now: number): void => {
    this.frame = 0;
    const dt = this.lastTime < 0 ? 1 / 60 : clamp((now - this.lastTime) / 1000, 1e-4, 0.05);
    this.lastTime = now;

    const from = this.wheelAngle;
    let to = from;
    let finished = false;
    const m = this.motion;
    if (m.kind === "spin") {
      const t = (now - m.start) / 1000;
      finished = t >= m.plan.duration;
      to = finished ? m.plan.endAngle : angleAt(m.plan, t);
    } else if (m.kind === "drag") {
      to = m.target;
    }

    const travel = to - from;
    const steps = Math.min(
      MAX_SUBSTEPS,
      Math.max(1, Math.ceil(Math.abs(travel) / MAX_SUBSTEP_ANGLE), Math.ceil(dt / MAX_SUBSTEP_DT)),
    );
    const h = dt / steps;
    let ticks = 0;
    const pegs = this.collide ? this.pegs : NO_PEGS;
    for (let i = 1; i <= steps; i++) {
      const angle = from + (travel * i) / steps;
      ticks += stepFlapper(this.flapper, this.flapperConfig, pegs, angle - this.pointerAngle, h);
    }
    if (!this.collide) ticks = countCrossings(this.pegs, from, to, this.pointerAngle);
    this.wheelAngle = to;

    if (ticks > 0) this.cb?.tick(clamp(Math.abs(travel) / dt / 12, 0, 1));

    if (finished) {
      this.motion = { kind: "idle" };
      // Keep the number small so precision never degrades over many spins.
      this.wheelAngle = mod(this.wheelAngle, TAU);
    }
    if (m.kind === "drag" && m.target === to) {
      // Re-base the drag target together with the angle so it doesn't grow forever.
      const wrapped = mod(to, TAU);
      const shift = wrapped - to;
      m.target += shift;
      for (const s of m.samples) s.angle += shift;
      this.wheelAngle = wrapped;
    }

    this.cb?.render(this.wheelAngle, this.flapper.angle);
    if (finished) this.cb?.settle();

    if (this.motion.kind !== "idle" || !flapperAtRest(this.flapper)) {
      this.frame = requestAnimationFrame(this.step);
    }
  };
}
