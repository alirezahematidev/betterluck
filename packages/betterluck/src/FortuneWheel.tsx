import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  ForwardedRef,
  ForwardRefExoticComponent,
  PointerEvent,
  ReactElement,
  ReactNode,
  RefAttributes,
} from "react";
import { buildGeometry, DEFAULT_LABELS, resolvePhysics } from "./config";
import type { WheelGeometry } from "./config";
import { WheelEngine } from "./engine";
import {
  buildArcs,
  contrastText,
  hubFontSize,
  landingAngle,
  layoutLabels,
  pickWeighted,
  polar,
  slicePath,
  totalWeight,
  wheelAngleFor,
} from "./geometry";
import type { Arc, LabelBounds } from "./geometry";
import { lerp, secureRandom, TAU, toDegrees, wrapPi } from "./math";
import { coastDistance, launchDistance, planCoast, planLaunch } from "./physics";
import type { SpinPlan } from "./physics";
import { playTick, unlockAudio } from "./sound";
import { WHEEL_CSS } from "./styles";
import { createMeasurer, detectDirection, readFontSpec } from "./text";
import type { FontSpec } from "./text";
import type {
  FortuneWheelHandle,
  FrameOptions,
  HubOptions,
  IndicatorOptions,
  IndicatorPosition,
  IndicatorShape,
  LabelOptions,
  Segment,
  SegmentSizing,
  SpinDirection,
  SpinOptions,
  SpinResult,
  WheelClassNames,
  WheelPhysics,
  WheelStyles,
} from "./types";

export interface FortuneWheelProps {
  segments: readonly Segment[];
  /**
   * Diameter of the wheel: pixels or any CSS length (`"60vmin"`, `"20rem"`, ...). The element
   * never grows wider than its container. Default: fills the container's width.
   */
  size?: number | string;
  /** Slice sizes: equal, or proportional to frequency. Default `equal`. */
  sizing?: SegmentSizing;
  /** Default `clockwise`. Flicks spin whichever way they're thrown. */
  spinDirection?: SpinDirection;
  physics?: Partial<WheelPhysics>;
  frame?: FrameOptions;
  indicator?: IndicatorOptions;
  hub?: HubOptions;
  labels?: LabelOptions;
  /** Synthesized peg ticks. Default true. */
  sound?: boolean;
  /** Let users grab the wheel and flick it. Default true. */
  allowFlick?: boolean;
  /** Blocks spinning (hub, flicks and `spin()`). */
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Extra class names for individual parts. */
  classNames?: WheelClassNames;
  /** Inline styles for individual parts. */
  styles?: WheelStyles;
  "aria-label"?: string;
  /** Screen-reader text when a spin ends, or `false` for none. */
  announce?: false | ((result: SpinResult) => string);
  /** Nonce for the built-in `<style>` tag under a strict Content-Security-Policy. */
  nonce?: string;
  /** Fires when a spin starts; `result` is where it will land. */
  onSpinStart?: (result: SpinResult) => void;
  onSpinEnd?: (result: SpinResult) => void;
  /** Fires each time a peg passes the indicator. */
  onTick?: () => void;
}

type CSSVars = CSSProperties & Record<`--${string}`, string | number | undefined>;

// React 18 warns about useLayoutEffect during server rendering.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const NO_CLASSES: WheelClassNames = {};
const NO_STYLES: WheelStyles = {};
const DEFAULT_HUB_LABEL = "SPIN";

const cx = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(" ");

/** A slice that is the whole wheel is drawn as a circle (an SVG arc can't close on itself). */
const wideSlice = (arc: Arc): boolean => arc.span >= TAU - 1e-9;

const pct = (value: number, of: number): string => `${(value / of) * 100}%`;

/** Copies only the defined entries, so `{ size: undefined }` doesn't wipe a default. */
function defined<T extends object>(defaults: Required<T>, value: T | undefined): Required<T> {
  const out = { ...defaults };
  if (value) {
    for (const key of Object.keys(value) as (keyof T)[]) {
      if (value[key] !== undefined) out[key] = value[key] as Required<T>[keyof T];
    }
  }
  return out;
}

const LIGHT_HALO = "rgb(255 255 255 / 0.3)";
const DARK_HALO = "rgb(0 0 0 / 0.28)";

/** Auto label color + matching outline for a slice (or for a forced text color). */
function labelVars(sliceColor: string, forced: string | undefined): CSSVars {
  if (forced) {
    return { "--bl-label-auto-halo": contrastText(forced) === "light" ? LIGHT_HALO : DARK_HALO };
  }
  const light = contrastText(sliceColor) === "light";
  return {
    "--bl-label-auto": light ? "var(--bl-label-light, #fff)" : "var(--bl-label-dark, #1c1733)",
    "--bl-label-auto-halo": light ? DARK_HALO : LIGHT_HALO,
  };
}

function indicatorPaths(shape: IndicatorShape, s: number, tip: number): ReactElement {
  if (shape === "triangle") {
    return (
      <path
        className="bl-indicator-body"
        d={`M${-17 * s} ${-11 * s}Q0 ${-21 * s} ${17 * s} ${-11 * s}L0 ${tip}Z`}
      />
    );
  }
  if (shape === "needle") {
    return (
      <>
        <path className="bl-indicator-body" d={`M${-3.6 * s} 0L0 ${tip}L${3.6 * s} 0Z`} />
        <circle className="bl-indicator-body" r={9 * s} />
      </>
    );
  }
  const head = 15 * s;
  const gamma = Math.acos(Math.min(1, head / tip));
  const x = head * Math.sin(gamma);
  const y = head * Math.cos(gamma);
  return (
    <path
      className="bl-indicator-body"
      d={`M0 ${tip}L${x} ${y}A${head} ${head} 0 1 0 ${-x} ${y}Z`}
    />
  );
}

/** The layout a running spin was planned on. */
interface Frozen {
  segments: readonly Segment[];
  sizing: SegmentSizing;
  position: IndicatorPosition | undefined;
}

interface FontPair {
  label: FontSpec;
  hub: FontSpec;
}

function FortuneWheelRender(
  props: FortuneWheelProps,
  ref: ForwardedRef<FortuneWheelHandle>,
): ReactElement {
  const {
    segments,
    size,
    sizing = "equal",
    spinDirection = "clockwise",
    physics,
    frame,
    indicator,
    hub,
    labels,
    sound = true,
    allowFlick = true,
    disabled = false,
    className,
    style,
    classNames = NO_CLASSES,
    styles = NO_STYLES,
    announce,
    nonce,
    onSpinStart,
    onSpinEnd,
    onTick,
  } = props;
  const ariaLabel = props["aria-label"];

  const uid = useId().replace(/[^\w-]/g, "");

  // While a spin runs, keep showing the layout it was planned on: if props change mid-spin the
  // wheel still stops on the slice it reported. The new props apply once it settles.
  const [frozen, setFrozen] = useState<Frozen | null>(null);
  const shownSegments = frozen?.segments ?? segments;
  const shownSizing = frozen?.sizing ?? sizing;
  const shownPosition = frozen ? frozen.position : indicator?.position;

  const arcs = useMemo(() => buildArcs(shownSegments, shownSizing), [shownSegments, shownSizing]);
  // Content signature, so a fresh-but-identical `segments` array (e.g. an inline literal) keeps
  // the winner highlight.
  const arcsKey = useMemo(
    () => arcs.map((a) => `${a.index}:${a.start.toFixed(9)}`).join(","),
    [arcs],
  );
  const pegAngles = useMemo(() => arcs.map((a) => a.start), [arcs]);
  const geometry: WheelGeometry = useMemo(
    () =>
      buildGeometry(
        {
          frameWidth: frame?.width,
          pegs: frame?.pegs,
          pegSize: frame?.pegSize,
          hubRadius: hub?.radius,
          indicatorPosition: shownPosition,
          indicatorSize: indicator?.size,
          indicatorShape: indicator?.shape,
          customIndicator: Boolean(indicator?.render),
        },
        arcs,
      ),
    [
      frame?.width,
      frame?.pegs,
      frame?.pegSize,
      hub?.radius,
      shownPosition,
      indicator?.size,
      indicator?.shape,
      indicator?.render,
      arcs,
    ],
  );
  const label = defined<LabelOptions>({ ...DEFAULT_LABELS, color: "" }, labels);
  const resolvedPhysics = useMemo(() => resolvePhysics(physics), [physics]);
  const canSpin = arcs.length > 0 && totalWeight(shownSegments) > 0 && !disabled;
  const collide = geometry.pegs && indicator?.flap !== false;

  /* ---------------- Layout box: the wheel plus wherever the indicator sticks out ---------------- */

  const box = useMemo(() => {
    const r = geometry.radius + 4;
    const [hx, hy] = polar(geometry.indicatorAngle, geometry.flapper.pivotDistance);
    const pad = geometry.indicatorExtent + 4;
    const x = Math.min(-r, hx - pad);
    const y = Math.min(-r, hy - pad);
    return { x, y, width: Math.max(r, hx + pad) - x, height: Math.max(r, hy + pad) - y };
  }, [geometry]);

  const place = (cx0: number, cy0: number, r: number): CSSProperties => ({
    position: "absolute",
    left: pct(cx0 - r - box.x, box.width),
    top: pct(cy0 - r - box.y, box.height),
    width: pct(2 * r, box.width),
    height: pct(2 * r, box.height),
  });

  /* ---------------- Measuring: real fonts (incl. user CSS) and real rendered size ---------------- */

  const rootRef = useRef<HTMLDivElement>(null);
  const labelProbe = useRef<SVGTextElement>(null);
  const hubProbe = useRef<SVGTextElement>(null);
  const [fonts, setFonts] = useState<FontPair | null>(null);
  const [fontEpoch, setFontEpoch] = useState(0);
  const [pxPerUnit, setPxPerUnit] = useState<number | null>(null);

  useIsoLayoutEffect(() => {
    const probe = labelProbe.current;
    if (!probe) return;
    const labelFont = readFontSpec(probe);
    const hubFont = hubProbe.current ? readFontSpec(hubProbe.current) : labelFont;
    setFonts((prev) =>
      prev && prev.label.key === labelFont.key && prev.hub.key === hubFont.key
        ? prev
        : { label: labelFont, hub: hubFont },
    );
  });

  useEffect(() => {
    const fontSet = typeof document === "undefined" ? undefined : document.fonts;
    if (!fontSet) return;
    let alive = true;
    const bump = () => {
      if (alive) setFontEpoch((n) => n + 1);
    };
    fontSet.addEventListener("loadingdone", bump);
    void fontSet.ready.then(bump);
    return () => {
      alive = false;
      fontSet.removeEventListener("loadingdone", bump);
    };
  }, []);

  useIsoLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () => {
      const width = el.getBoundingClientRect().width;
      if (width <= 0) return;
      const next = width / box.width;
      setPxPerUnit((prev) => (prev !== null && Math.abs(prev - next) / prev < 0.01 ? prev : next));
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [box.width]);

  const measureLabel = useMemo(
    () => createMeasurer(fonts?.label ?? null, fontEpoch),
    [fonts, fontEpoch],
  );
  const measureHub = useMemo(
    () => createMeasurer(fonts?.hub ?? null, fontEpoch),
    [fonts, fontEpoch],
  );
  const scale = pxPerUnit ?? 1;

  /* ---------------- Labels ---------------- */

  const bounds: LabelBounds = useMemo(
    () => ({
      outer: geometry.sliceRadius - Math.max(0, label.inset),
      inner: geometry.hubRadius > 0 ? geometry.hubRadius + 8 : 14,
      rim: geometry.sliceRadius - 2,
      maxFont: Math.max(1, label.maxFontSize),
      minFont: Math.max(2, label.minFontPx / scale),
      maxImage: Math.max(0, label.maxImageSize),
      minImage: Math.max(2, label.minImagePx / scale),
      imageScale: Math.max(0, label.imageScale),
      uniformMinFont: 14,
    }),
    [
      geometry.sliceRadius,
      geometry.hubRadius,
      label.inset,
      label.maxFontSize,
      label.minFontPx,
      label.maxImageSize,
      label.minImagePx,
      label.imageScale,
      scale,
    ],
  );

  const layouts = useMemo(
    () =>
      layoutLabels(
        arcs.map((arc) => ({
          title: shownSegments[arc.index].title.trim(),
          hasImage: Boolean(shownSegments[arc.index].image),
          span: arc.span,
        })),
        bounds,
        measureLabel,
        label.uniform,
      ),
    [arcs, shownSegments, bounds, measureLabel, label.uniform],
  );
  const inheritedDirection = fonts?.label.direction ?? "ltr";
  const directionOf = (title: string): "ltr" | "rtl" =>
    label.direction === "auto" ? (detectDirection(title) ?? inheritedDirection) : label.direction;

  const hubLabel: ReactNode = hub?.label === undefined ? DEFAULT_HUB_LABEL : hub.label;
  const hubText =
    typeof hubLabel === "string" || typeof hubLabel === "number" ? String(hubLabel) : null;
  const fittedHubFont = hubText ? hubFontSize(hubText, geometry.hubRadius, measureHub) : 0;
  // Same readability rule as labels: hide rather than render unreadably small.
  const hubFont = fittedHubFont * scale >= label.minFontPx * 0.8 ? fittedHubFont : 0;

  /* ---------------- Engine ---------------- */

  const [spinning, setSpinning] = useState(false);
  // Remember which layout the result belongs to, so edits after a spin drop the stale highlight.
  const [landed, setLanded] = useState<{ result: SpinResult; arcsKey: string } | null>(null);
  const winner = landed?.arcsKey === arcsKey ? landed.result : null;

  const overlayRef = useRef<SVGSVGElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const flapperRef = useRef<SVGGElement>(null);
  const pending = useRef<SpinResult | null>(null);
  const drag = useRef<{ id: number; last: number } | null>(null);
  const positioned = useRef(false);
  const latest = useRef({
    segments: shownSegments,
    sizing: shownSizing,
    position: shownPosition,
    arcs,
    arcsKey,
    physics: resolvedPhysics,
    pointer: geometry.indicatorAngle,
    pivot: geometry.flapper.pivotDistance,
    direction: spinDirection,
    canSpin,
    sound,
    onSpinStart,
    onSpinEnd,
    onTick,
  });

  const [engine] = useState(() => new WheelEngine(geometry.flapper));

  useIsoLayoutEffect(() => {
    engine.connect({
      render(wheel, flapper) {
        // The disc is its own compositor layer: rasterized once, rotated on the GPU.
        if (rotorRef.current) rotorRef.current.style.transform = `rotate(${toDegrees(wheel)}deg)`;
        flapperRef.current?.setAttribute(
          "transform",
          `translate(0 ${-latest.current.pivot}) rotate(${-toDegrees(flapper)})`,
        );
      },
      tick(intensity) {
        if (latest.current.sound) playTick(intensity);
        latest.current.onTick?.();
      },
      settle() {
        const result = pending.current;
        pending.current = null;
        setSpinning(false);
        setFrozen(null);
        if (result) {
          setLanded({ result, arcsKey: latest.current.arcsKey });
          latest.current.onSpinEnd?.(result);
        }
      },
    });
    return () => engine.disconnect();
  }, [engine]);

  useIsoLayoutEffect(() => {
    latest.current = {
      segments: shownSegments,
      sizing: shownSizing,
      position: shownPosition,
      arcs,
      arcsKey,
      physics: resolvedPhysics,
      pointer: geometry.indicatorAngle,
      pivot: geometry.flapper.pivotDistance,
      direction: spinDirection,
      canSpin,
      sound,
      onSpinStart,
      onSpinEnd,
      onTick,
    };
    if (!positioned.current && arcs.length > 0) {
      // Start with the first segment centered under the indicator rather than on a peg.
      engine.placeAt(wheelAngleFor(arcs[0].mid, geometry.indicatorAngle));
      positioned.current = true;
    }
    engine.setFlapperConfig(geometry.flapper);
    engine.setPegs(pegAngles, collide);
    engine.setPointerAngle(geometry.indicatorAngle);
    engine.renderNow();
  });

  const begin = useCallback(
    (plan: SpinPlan, index: number) => {
      const { segments: segs, sizing: sz, position } = latest.current;
      const result: SpinResult = { index, segment: segs[index] };
      pending.current = result;
      setLanded(null);
      setSpinning(true);
      setFrozen({ segments: segs, sizing: sz, position });
      engine.spin(plan);
      latest.current.onSpinStart?.(result);
    },
    [engine],
  );

  /** Picks the winner (weighted, or forced) and a random resting spot inside its slice. */
  const chooseTarget = useCallback((forced?: number): { index: number; angle: number } | null => {
    const { segments: segs, arcs: list, pointer } = latest.current;
    const index = forced ?? pickWeighted(segs, secureRandom());
    const arc = list.find((a) => a.index === index);
    if (!arc) return null;
    return { index, angle: wheelAngleFor(landingAngle(arc, secureRandom()), pointer) };
  }, []);

  const spin = useCallback(
    (options?: SpinOptions): boolean => {
      if (!latest.current.canSpin || engine.busy) return false;
      const target = chooseTarget(options?.index);
      if (!target) return false;
      unlockAudio();
      const p = latest.current.physics;
      const friction = { mu: p.friction, k: p.drag };
      const speed = lerp(p.minLaunchSpeed, p.maxLaunchSpeed, secureRandom());
      const plan = planLaunch({
        startAngle: engine.wheelAngle,
        direction: latest.current.direction === "counterclockwise" ? -1 : 1,
        spinUpTime: p.spinUpTime,
        friction,
        targetAngle: target.angle,
        minTravel: launchDistance(speed, p.spinUpTime, friction),
      });
      begin(plan, target.index);
      return true;
    },
    [begin, chooseTarget, engine],
  );

  const flick = useCallback(
    (velocity: number) => {
      const target = chooseTarget();
      if (!target) return;
      const p = latest.current.physics;
      const speed = Math.min(Math.abs(velocity), p.maxLaunchSpeed * 1.25);
      const friction = { mu: p.friction, k: p.drag };
      const plan = planCoast({
        startAngle: engine.wheelAngle,
        direction: velocity > 0 ? 1 : -1,
        launchSpeed: speed,
        friction,
        targetAngle: target.angle,
        // At least half a turn, unless the flick is too weak to get that far naturally.
        minTravel: Math.min(Math.PI, 0.6 * coastDistance(speed, friction)),
      });
      begin(plan, target.index);
    },
    [begin, chooseTarget, engine],
  );

  useImperativeHandle(ref, () => ({ spin, isSpinning: () => engine.spinning }), [spin, engine]);

  /* ---------------- Drag & flick ---------------- */

  /** Pointer position relative to the wheel: clockwise angle from 12 o'clock and radius in units. */
  const locate = (e: PointerEvent): { angle: number; radius: number } | null => {
    const m = overlayRef.current?.getScreenCTM();
    if (!m) return null;
    // Map the pointer into wheel units (exact even under rotated/scaled ancestors).
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { angle: Math.atan2(p.x, -p.y), radius: Math.hypot(p.x, p.y) };
  };

  const flickable = allowFlick && canSpin;

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!flickable || engine.busy || e.button !== 0) return;
    const at = locate(e);
    if (!at || at.radius < geometry.hubRadius || at.radius > geometry.radius + 4) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    unlockAudio();
    drag.current = { id: e.pointerId, last: at.angle };
    setLanded(null);
    engine.grab();
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const at = locate(e);
    if (!at) return;
    engine.dragBy(wrapPi(at.angle - d.last));
    d.last = at.angle;
  };

  const endDrag = (e: PointerEvent<SVGSVGElement>, allowSpin: boolean) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const velocity = engine.release();
    if (allowSpin && Math.abs(velocity) >= latest.current.physics.flickThreshold) flick(velocity);
  };

  /* ---------------- Render ---------------- */

  const g = geometry;
  const disc = g.radius + 1;
  const winnerArc = winner ? arcs.find((a) => a.index === winner.index) : undefined;
  const ids = {
    frame: `${uid}-frame`,
    peg: `${uid}-peg`,
    hub: `${uid}-hub`,
    shade: `${uid}-shade`,
    pointer: `${uid}-ptr`,
    shadow: `${uid}-shadow`,
  };
  const ratio = box.width / (2 * g.radius);
  const width =
    typeof size === "number"
      ? Number.isFinite(size) && size > 0
        ? `${size * ratio}px`
        : undefined
      : size
        ? `calc(${size} * ${ratio})`
        : undefined;

  const rootStyle: CSSVars = {
    position: "relative",
    ...(width ? { width, maxWidth: "100%" } : null),
    aspectRatio: `${box.width} / ${box.height}`,
    "--bl-frame-color": frame?.color,
    "--bl-peg-color": frame?.pegColor,
    "--bl-divider-color": frame?.dividerColor,
    "--bl-divider-width": frame?.dividerWidth,
    "--bl-indicator-color": indicator?.color,
    "--bl-hub-color": hub?.color,
    "--bl-hub-text": hub?.textColor,
    "--bl-label-color": label.color || undefined,
    ...style,
    ...styles.root,
  };

  const describe = announce === false ? null : (announce ?? ((r: SpinResult) => r.segment.title));
  const shadingOn = frame?.shading !== false;

  return (
    <div
      ref={rootRef}
      className={cx("bl-wheel", className, classNames.root)}
      style={rootStyle}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- no native element fits a widget group
      role="group"
      aria-label={ariaLabel}
      data-spinning={spinning || undefined}
      data-disabled={disabled || undefined}
    >
      <style nonce={nonce} dangerouslySetInnerHTML={{ __html: WHEEL_CSS }} />

      <div
        className={cx("bl-disc", classNames.disc)}
        style={{ ...place(0, 0, disc), overflow: "hidden", pointerEvents: "none", ...styles.disc }}
      >
        <div ref={rotorRef} style={{ width: "100%", height: "100%", willChange: "transform" }}>
          <svg
            viewBox={`${-disc} ${-disc} ${2 * disc} ${2 * disc}`}
            style={{ display: "block", width: "100%", height: "100%" }}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id={ids.frame}>
                <stop offset={g.sliceRadius / g.radius} className="bl-frame-inner" />
                <stop
                  offset={(g.sliceRadius + g.frameWidth * 0.45) / g.radius}
                  className="bl-frame-mid"
                />
                <stop offset="1" className="bl-frame-outer" />
              </radialGradient>
              <radialGradient id={ids.peg} cx="35%" cy="35%" r="70%">
                <stop offset="0" className="bl-peg-light" />
                <stop offset="0.45" className="bl-peg-mid" />
                <stop offset="1" className="bl-peg-dark" />
              </radialGradient>
              <radialGradient id={ids.shade}>
                <stop offset="0.55" stopColor="#000" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity="0.22" />
              </radialGradient>
            </defs>

            {g.frameWidth > 0 && (
              <circle
                r={g.radius}
                className={cx("bl-frame", classNames.frame)}
                style={styles.frame}
                fill={`url(#${ids.frame})`}
              />
            )}
            {arcs.length === 0 ? (
              <circle r={g.sliceRadius} className="bl-empty" />
            ) : (
              arcs.map((arc) => {
                const segment = shownSegments[arc.index];
                const common = {
                  className: cx("bl-slice", classNames.slice),
                  style: styles.slice,
                  fill: segment.color,
                };
                return wideSlice(arc) ? (
                  <circle key={arc.index} r={g.sliceRadius} {...common} />
                ) : (
                  <path key={arc.index} d={slicePath(arc, g.sliceRadius)} {...common} />
                );
              })
            )}
            {shadingOn && <circle r={g.sliceRadius} fill={`url(#${ids.shade})`} />}
            {winnerArc &&
              (wideSlice(winnerArc) ? (
                <circle
                  r={g.sliceRadius}
                  className={cx("bl-winner", classNames.winner)}
                  style={styles.winner}
                />
              ) : (
                <path
                  d={slicePath(winnerArc, g.sliceRadius)}
                  className={cx("bl-winner", classNames.winner)}
                  style={styles.winner}
                />
              ))}

            {arcs.map((arc, i) => {
              const segment = shownSegments[arc.index];
              const layout = layouts[i];
              const forced = segment.textColor || label.color || undefined;
              return (
                <g key={arc.index} transform={`rotate(${toDegrees(arc.mid) - 90})`}>
                  {segment.image && layout.imageSize > 0 && (
                    <image
                      className={cx("bl-image", classNames.image)}
                      style={styles.image}
                      href={segment.image}
                      x={layout.imageStart}
                      y={-layout.imageSize / 2}
                      width={layout.imageSize}
                      height={layout.imageSize}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  )}
                  {layout.text && (
                    <text
                      className={cx("bl-label", classNames.label)}
                      style={{
                        ...labelVars(segment.color, forced),
                        ...(segment.textColor ? { fill: segment.textColor } : null),
                        ...styles.label,
                        // Fitted size: inline so no stylesheet can override it and cause overflow.
                        fontSize: layout.fontSize,
                      }}
                      x={layout.textStart + layout.textWidth / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      direction={directionOf(layout.text)}
                      unicodeBidi="embed"
                    >
                      {layout.text}
                    </text>
                  )}
                </g>
              );
            })}

            {g.frameWidth > 0 && <circle r={g.sliceRadius} className="bl-rim-line" />}
            {g.pegs &&
              pegAngles.map((angle) => {
                const [x, y] = polar(angle, g.pegDistance);
                return (
                  <circle
                    key={angle}
                    className={cx("bl-peg", classNames.peg)}
                    style={styles.peg}
                    cx={x}
                    cy={y}
                    r={g.pegRadius}
                    fill={`url(#${ids.peg})`}
                  />
                );
              })}

            {/* Probe: tells the measurer which font labels really render with. */}
            <text
              ref={labelProbe}
              className={cx("bl-label", classNames.label)}
              style={{ ...styles.label, fontSize: 100 }}
              x={-9999}
              visibility="hidden"
            >
              M
            </text>
          </svg>
        </div>
      </div>

      <svg
        ref={overlayRef}
        className="bl-overlay"
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
        style={{ position: "absolute", inset: 0, display: "block", width: "100%", height: "100%" }}
        aria-hidden="true"
        data-grabbable={(flickable && !spinning) || undefined}
        data-static={!flickable || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, true)}
        onPointerCancel={(e) => endDrag(e, false)}
        onLostPointerCapture={(e) => endDrag(e, false)}
      >
        <defs>
          <radialGradient id={ids.hub} cx="40%" cy="35%" r="75%">
            <stop offset="0" className="bl-hub-light" />
            <stop offset="0.55" className="bl-hub-mid" />
            <stop offset="1" className="bl-hub-dark" />
          </radialGradient>
          <linearGradient id={ids.pointer} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" className="bl-indicator-light" />
            <stop offset="0.55" className="bl-indicator-mid" />
            <stop offset="1" className="bl-indicator-dark" />
          </linearGradient>
          <filter id={ids.shadow} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        {g.hubRadius > 0 && (
          <g className={cx("bl-hub", classNames.hub)} style={styles.hub}>
            <circle r={g.hubRadius} fill={`url(#${ids.hub})`} filter={`url(#${ids.shadow})`} />
            <circle r={Math.max(1, g.hubRadius - 6)} className="bl-hub-ring" />
            {hubText && hubFont > 0 && (
              <text
                className={cx("bl-hub-label", classNames.hubLabel)}
                style={{ ...styles.hubLabel, fontSize: hubFont }}
                textAnchor="middle"
                dominantBaseline="central"
                direction={detectDirection(hubText) ?? inheritedDirection}
                unicodeBidi="embed"
              >
                {hubText}
              </text>
            )}
          </g>
        )}
        <text
          ref={hubProbe}
          className={cx("bl-hub-label", classNames.hubLabel)}
          style={{ ...styles.hubLabel, fontSize: 100 }}
          x={-9999}
          visibility="hidden"
        >
          M
        </text>

        <g
          className={cx("bl-indicator", classNames.indicator)}
          style={styles.indicator}
          transform={`rotate(${toDegrees(g.indicatorAngle)})`}
          pointerEvents="none"
        >
          <g ref={flapperRef} fill={`url(#${ids.pointer})`} filter={`url(#${ids.shadow})`}>
            {indicator?.render ? (
              indicator.render({ tip: g.indicatorTip, scale: g.indicatorScale })
            ) : (
              <>
                {indicatorPaths(indicator?.shape ?? "pin", g.indicatorScale, g.indicatorTip)}
                <circle
                  className="bl-indicator-pin"
                  r={(indicator?.shape === "needle" ? 3.5 : 5) * g.indicatorScale}
                />
              </>
            )}
          </g>
        </g>
      </svg>

      {g.hubRadius > 0 && (
        <button
          type="button"
          className="bl-hub-button"
          aria-label={hub?.ariaLabel || hubText || "Spin"}
          disabled={!canSpin || spinning || hub?.clickable === false}
          tabIndex={hub?.clickable === false ? -1 : undefined}
          onClick={() => spin()}
          style={{
            ...place(0, 0, g.hubRadius),
            ...(hub?.clickable === false ? { pointerEvents: "none" } : null),
          }}
        >
          {!hubText && (
            <span
              className={classNames.hubLabel}
              style={{ fontSize: `${g.hubRadius * 0.36 * scale}px`, ...styles.hubLabel }}
            >
              {hubLabel}
            </span>
          )}
        </button>
      )}

      {describe && (
        <p className="bl-sr-only" aria-live="polite" dir="auto">
          {winner ? describe(winner) : ""}
        </p>
      )}
    </div>
  );
}

/**
 * A physics-driven prize wheel. Spin it with the hub, a ref (`ref.current.spin()`), or by
 * flicking it. Fully themable; see `FrameOptions`, `IndicatorOptions`, `HubOptions`,
 * `LabelOptions`, `classNames`, `styles` and the `--bl-*` CSS variables.
 */
export const FortuneWheel: ForwardRefExoticComponent<
  FortuneWheelProps & RefAttributes<FortuneWheelHandle>
> = forwardRef<FortuneWheelHandle, FortuneWheelProps>(FortuneWheelRender);

FortuneWheel.displayName = "FortuneWheel";
