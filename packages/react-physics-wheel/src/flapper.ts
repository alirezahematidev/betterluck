import { wrapPi } from "./math";

/**
 * The indicator is a stiff flapper on a spring hinge above the rim. Pegs on the rim collide with
 * its tip; once a peg has pushed the flapper far enough, the tip's arc lifts clear of the peg, it
 * slips past and the spring snaps the flapper back (that's the "tick").
 *
 * Everything is expressed in the pointer's frame: the pivot is straight above the wheel center at
 * (0, -pivotDistance) and an undeflected arm hangs toward the center. A positive flapper angle
 * moves the tip clockwise around the wheel.
 */
export interface FlapperConfig {
  /** Distance of peg centers from the wheel center. */
  pegDistance: number;
  pegRadius: number;
  pivotDistance: number;
  /** Pivot → tip center. */
  armLength: number;
  tipRadius: number;
  /** Hinge spring, rad/s² per rad. */
  stiffness: number;
  /** Hinge damping, 1/s. */
  damping: number;
  /**
   * Mechanical end stop, rad. Must exceed the deflection at which a peg slips free of the tip,
   * otherwise pegs could jam against a flapper resting on the stop.
   */
  maxAngle: number;
  /** Fraction of speed kept when bouncing off the end stop. */
  restitution: number;
}

export interface FlapperState {
  angle: number;
  velocity: number;
  /** Per peg: which side of the tip it was on last time they didn't overlap (-1, 1 or 0 = unknown). */
  side: Int8Array;
  /** Per peg: currently pressing on the tip. */
  contact: Uint8Array;
  /** Per peg: which side (sign of its angle) it entered the flapper's reach from, 0 = out of reach. */
  entry: Int8Array;
}

export function createFlapperState(pegCount: number, previous?: FlapperState): FlapperState {
  return {
    angle: previous?.angle ?? 0,
    velocity: previous?.velocity ?? 0,
    side: new Int8Array(pegCount),
    contact: new Uint8Array(pegCount),
    entry: new Int8Array(pegCount),
  };
}

/** Pegs further than this from the pointer (in wheel angle) can't reach the tip. */
const REACH = 0.6;

/**
 * Advances the flapper by `dt` with the wheel rotated so that pegs sit at `pegAngles[i] + wheelOffset`
 * relative to the pointer. Returns how many pegs made it past the flapper (ticks).
 */
export function stepFlapper(
  s: FlapperState,
  cfg: FlapperConfig,
  pegAngles: readonly number[],
  wheelOffset: number,
  dt: number,
): number {
  if (dt <= 0) return 0;
  const before = s.angle;

  // Damped spring hinge (semi-implicit Euler).
  s.velocity += (-cfg.stiffness * s.angle - cfg.damping * s.velocity) * dt;
  s.angle += s.velocity * dt;

  const L = cfg.armLength;
  const reach = cfg.tipRadius + cfg.pegRadius;
  let ticks = 0;

  for (let i = 0; i < pegAngles.length; i++) {
    const p = wrapPi(pegAngles[i] + wheelOffset);
    // Peg center relative to the pivot (tip at angle β sits at (L·sinβ, L·cosβ)).
    const px = cfg.pegDistance * Math.sin(p);
    const py = cfg.pivotDistance - cfg.pegDistance * Math.cos(p);
    const d = Math.hypot(px, py);

    if (Math.abs(p) > REACH || d > L + reach || d < Math.abs(L - reach)) {
      // Out of the tip's swing arc. Leaving on the other side than it came in = it got past.
      if (s.entry[i] !== 0 && Math.sign(p) !== s.entry[i]) ticks++;
      s.entry[i] = 0;
      s.contact[i] = 0;
      s.side[i] = 0;
      continue;
    }
    if (s.entry[i] === 0) s.entry[i] = p < 0 ? -1 : 1;

    // The tip overlaps the peg while β ∈ (dir − half, dir + half).
    const dir = Math.atan2(px, py);
    const half = Math.acos(
      Math.min(1, Math.max(-1, (L * L + d * d - reach * reach) / (2 * L * d))),
    );
    const lower = dir - half;
    const upper = dir + half;

    if (s.angle > lower && s.angle < upper) {
      let side = s.side[i];
      if (side === 0) side = s.angle - lower < upper - s.angle ? -1 : 1;
      s.angle = side > 0 ? upper : lower;
      // Position-based velocity: whatever the projection moved us by this step.
      const v = (s.angle - before) / dt;
      s.velocity = side > 0 ? Math.max(s.velocity, v) : Math.min(s.velocity, v);
      s.side[i] = side;
      s.contact[i] = 1;
    } else {
      s.side[i] = s.angle >= upper ? 1 : -1;
      s.contact[i] = 0;
    }
  }

  // End stops: fast pegs fling the flapper, the stop catches it with a small bounce.
  if (Math.abs(s.angle) > cfg.maxAngle) {
    const sign = Math.sign(s.angle);
    s.angle = sign * cfg.maxAngle;
    if (s.velocity * sign > 0) s.velocity *= -cfg.restitution;
  }
  return ticks;
}

export function flapperAtRest(s: FlapperState): boolean {
  if (Math.abs(s.velocity) > 1e-3) return false;
  return Math.abs(s.angle) < 1e-3 || s.contact.some((c) => c === 1);
}

/**
 * Deflection at which a peg slips free of the tip: where the tip's swing arc and the peg's
 * collision circle become tangent. The end stop must sit beyond this or pegs could jam.
 */
export function releaseAngle(cfg: FlapperConfig): number {
  const reach = cfg.tipRadius + cfg.pegRadius;
  const { armLength: L, pegDistance: Rp, pivotDistance: P } = cfg;
  const cos = (Rp * Rp + P * P - (L + reach) ** 2) / (2 * Rp * P);
  const p = Math.acos(Math.min(1, Math.max(-1, cos)));
  return Math.atan2(Rp * Math.sin(p), P - Rp * Math.cos(p));
}
