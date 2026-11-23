/** Tiny synthesized "tick" for pegs passing the indicator. No assets, no dependencies. */

let ctx: AudioContext | null = null;
let clickBuffer: AudioBuffer | null = null;
let lastTick = 0;

/** Must be called from a user gesture (click / pointerdown) to satisfy autoplay policies. */
export function unlockAudio(): void {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    if (!clickBuffer) {
      const length = Math.floor(ctx.sampleRate * 0.03);
      clickBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = clickBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.0025));
      }
    }
  } catch {
    ctx = null;
  }
}

/** @param intensity 0..1, roughly how hard the peg hit. */
export function playTick(intensity: number): void {
  if (!ctx || !clickBuffer || ctx.state !== "running") return;
  const now = ctx.currentTime;
  if (now - lastTick < 0.018) return;
  lastTick = now;

  const source = ctx.createBufferSource();
  source.buffer = clickBuffer;
  source.playbackRate.value = 0.9 + Math.random() * 0.2;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2200 + intensity * 1400;
  filter.Q.value = 1.4;

  const gain = ctx.createGain();
  gain.gain.value = 0.18 + 0.3 * Math.min(1, Math.max(0, intensity));

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(now);
}
