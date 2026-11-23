export const TAU: number = Math.PI * 2;

/** Euclidean modulo: result is always in [0, n). */
export function mod(value: number, n: number): number {
  return ((value % n) + n) % n;
}

/** Wraps an angle into (-π, π]. */
export function wrapPi(angle: number): number {
  const a = mod(angle + Math.PI, TAU) - Math.PI;
  return a === -Math.PI ? Math.PI : a;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export const toDegrees = (rad: number): number => (rad * 180) / Math.PI;
export const toRadians = (deg: number): number => (deg * Math.PI) / 180;

/** Uniform random number in [0, 1), from the CSPRNG when available. */
export function secureRandom(): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 0x1_0000_0000;
  }
  return Math.random();
}
