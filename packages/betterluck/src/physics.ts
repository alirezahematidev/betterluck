import { mod, TAU } from "./math";

/**
 * Axle friction model while coasting (ω ≥ 0):
 *
 *     dω/dt = −μ − k·ω
 *
 * μ is dry (Coulomb) friction, constant regardless of speed — it is what finally stops the wheel.
 * k is viscous drag, proportional to speed — it bleeds off most of the energy while the wheel is fast.
 * The ODE has a closed-form solution, so every frame samples the exact trajectory: no integration
 * drift and no dependence on frame rate.
 */
export interface Friction {
  mu: number;
  k: number;
}

const EPS_K = 1e-6;

/** Time until a wheel launched at `w0` comes to rest. */
export function coastStopTime(w0: number, f: Friction): number {
  if (w0 <= 0) return 0;
  return f.k > EPS_K ? Math.log1p((f.k * w0) / f.mu) / f.k : w0 / f.mu;
}

/** Angle travelled `t` seconds after starting to coast at `w0` (clamped at the stop). */
export function coastAngle(w0: number, f: Friction, t: number): number {
  const tt = Math.min(Math.max(t, 0), coastStopTime(w0, f));
  if (f.k > EPS_K) {
    const terminal = f.mu / f.k;
    return ((w0 + terminal) * -Math.expm1(-f.k * tt)) / f.k - terminal * tt;
  }
  return w0 * tt - 0.5 * f.mu * tt * tt;
}

/** Angular speed `t` seconds after starting to coast at `w0`. */
export function coastSpeed(w0: number, f: Friction, t: number): number {
  if (t >= coastStopTime(w0, f)) return 0;
  const tt = Math.max(t, 0);
  if (f.k > EPS_K) {
    const terminal = f.mu / f.k;
    return (w0 + terminal) * Math.exp(-f.k * tt) - terminal;
  }
  return w0 - f.mu * tt;
}

/** Total angle travelled while coasting from `w0` to rest. */
export function coastDistance(w0: number, f: Friction): number {
  return coastAngle(w0, f, Number.POSITIVE_INFINITY);
}

/**
 * A complete spin: a constant-torque spin-up (constant angular acceleration from rest to
 * `launchSpeed` over `spinUpTime`), followed by a friction coast to rest.
 */
export interface SpinPlan {
  startAngle: number;
  direction: 1 | -1;
  launchSpeed: number;
  spinUpTime: number;
  friction: Friction;
  duration: number;
  endAngle: number;
}

/** Wheel angle `t` seconds into the plan. */
export function angleAt(plan: SpinPlan, t: number): number {
  const { startAngle, direction, launchSpeed: w, spinUpTime: T } = plan;
  if (t <= 0) return startAngle;
  if (t >= plan.duration) return plan.endAngle;
  if (t < T) return startAngle + (direction * w * t * t) / (2 * T);
  return startAngle + direction * ((w * T) / 2 + coastAngle(w, plan.friction, t - T));
}

/** Signed angular velocity `t` seconds into the plan. */
export function velocityAt(plan: SpinPlan, t: number): number {
  const { direction, launchSpeed: w, spinUpTime: T } = plan;
  if (t <= 0 || t >= plan.duration) return 0;
  if (t < T) return (direction * w * t) / T;
  return direction * coastSpeed(w, plan.friction, t - T);
}

/** Total travel of a launch at `w0`: spin-up distance plus coast distance. */
export function launchDistance(w0: number, spinUpTime: number, f: Friction): number {
  return (w0 * Math.max(spinUpTime, 0)) / 2 + coastDistance(w0, f);
}

/** Positive travel distances that end on `targetAngle` (mod 2π), starting from the first one ≥ `min`. */
function firstTravelAtLeast(
  startAngle: number,
  direction: 1 | -1,
  targetAngle: number,
  min: number,
): number {
  const base = mod(direction * (targetAngle - startAngle), TAU);
  const turns = Math.max(0, Math.ceil((min - base) / TAU));
  return base + turns * TAU;
}

function makePlan(
  startAngle: number,
  direction: 1 | -1,
  launchSpeed: number,
  spinUpTime: number,
  friction: Friction,
  travel: number,
): SpinPlan {
  return {
    startAngle,
    direction,
    launchSpeed,
    spinUpTime,
    friction,
    duration: spinUpTime + coastStopTime(launchSpeed, friction),
    endAngle: startAngle + direction * travel,
  };
}

export interface LaunchInput {
  startAngle: number;
  direction: 1 | -1;
  spinUpTime: number;
  friction: Friction;
  /** Wheel angle (mod 2π) the spin must come to rest on. */
  targetAngle: number;
  /** Lower bound on total travel; the first matching rest angle beyond it is used. */
  minTravel: number;
}

/**
 * Plans a spin from rest that lands exactly on `targetAngle`. Friction stays exactly as configured;
 * only the launch speed is solved for (travel is strictly increasing in launch speed, so bisection
 * always converges).
 */
export function planLaunch(input: LaunchInput): SpinPlan {
  const { startAngle, direction, friction } = input;
  const spinUpTime = Math.max(0, input.spinUpTime);
  const travel = firstTravelAtLeast(startAngle, direction, input.targetAngle, input.minTravel);

  let lo = 0;
  let hi = 1;
  while (launchDistance(hi, spinUpTime, friction) < travel) hi *= 2;
  for (let i = 0; i < 100 && hi - lo > 1e-12; i++) {
    const mid = (lo + hi) / 2;
    if (launchDistance(mid, spinUpTime, friction) < travel) lo = mid;
    else hi = mid;
  }
  return makePlan(startAngle, direction, (lo + hi) / 2, spinUpTime, friction, travel);
}

export interface CoastInput {
  startAngle: number;
  direction: 1 | -1;
  /** Speed the wheel already has (e.g. released from a flick), rad/s. */
  launchSpeed: number;
  friction: Friction;
  targetAngle: number;
  minTravel: number;
}

/**
 * Plans a coast from a wheel that is already moving (a flick). The launch speed is fixed by the
 * user's hand, so instead the friction is scaled by a common factor c. Scaling both μ and k by c is
 * the same trajectory replayed at c× the speed of time, so travel becomes exactly distance / c —
 * the deceleration profile keeps its shape. The rest angle closest to the natural one is chosen to
 * keep c near 1, and c never drops below MIN_COAST_SCALE (a weak throw gets a little extra speed
 * rather than gliding on near-zero friction).
 */
export function planCoast(input: CoastInput): SpinPlan {
  const { startAngle, direction, friction } = input;
  const speed = Math.max(input.launchSpeed, 1e-3);
  const natural = coastDistance(speed, friction);

  const first = firstTravelAtLeast(startAngle, direction, input.targetAngle, input.minTravel);
  let travel = first;
  if (natural > first) {
    const below = first + Math.floor((natural - first) / TAU) * TAU;
    travel =
      Math.abs(Math.log(natural / below)) <= Math.abs(Math.log((below + TAU) / natural))
        ? below
        : below + TAU;
  }

  let c = natural / travel;
  let launch = speed;
  if (c < MIN_COAST_SCALE) {
    // A weak flick toward a far target would crawl for ages on very low friction. Keep the
    // friction plausible and give the throw a little more speed instead.
    c = MIN_COAST_SCALE;
    launch = speedForCoast(travel * c, friction);
  }
  return makePlan(
    startAngle,
    direction,
    launch,
    0,
    { mu: friction.mu * c, k: friction.k * c },
    travel,
  );
}

/** Lowest friction scale a flick may use; below it, the launch speed is raised instead. */
const MIN_COAST_SCALE = 0.45;

/** Launch speed whose natural coast covers `distance` (coast distance grows with speed). */
function speedForCoast(distance: number, friction: Friction): number {
  let lo = 0;
  let hi = 1;
  while (coastDistance(hi, friction) < distance) hi *= 2;
  for (let i = 0; i < 100 && hi - lo > 1e-12; i++) {
    const mid = (lo + hi) / 2;
    if (coastDistance(mid, friction) < distance) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
