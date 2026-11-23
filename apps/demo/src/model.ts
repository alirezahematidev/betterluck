import { DEFAULT_PHYSICS, resolvePhysics } from "betterluck";
import type {
  IndicatorShape,
  LabelDirection,
  Segment,
  SegmentSizing,
  SpinDirection,
  WheelPhysics,
} from "betterluck";
import type { Locale } from "./i18n";

export interface EditableSegment extends Segment {
  id: string;
}

export type Side = "top" | "right" | "bottom" | "left";
export type FontChoice = "rounded" | "vazirmatn" | "lalezar" | "nunito" | "serif" | "mono";
export type ThemeName = "twilight" | "casino" | "minimal" | "neon";

export const FONT_STACKS: Record<FontChoice, string> = {
  rounded: `ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", Roboto, Vazirmatn, sans-serif`,
  vazirmatn: "Vazirmatn, Tahoma, sans-serif",
  lalezar: "Lalezar, Vazirmatn, sans-serif",
  nunito: "Nunito, Vazirmatn, sans-serif",
  serif: `Georgia, "Times New Roman", "Noto Naskh Arabic", serif`,
  mono: `ui-monospace, "SF Mono", Menlo, Consolas, Vazirmatn, monospace`,
};

export interface DemoConfig {
  locale: Locale;
  segments: EditableSegment[];
  /** True until the user edits segments, so switching language swaps the samples too. */
  samples: boolean;
  theme: ThemeName | null;
  size: { mode: "fit" | "fixed"; px: number };
  sizing: SegmentSizing;
  spinDirection: SpinDirection;
  sound: boolean;
  allowFlick: boolean;
  physics: WheelPhysics;
  frame: {
    width: number;
    color: string;
    pegs: boolean;
    pegColor: string;
    pegSize: number;
    dividerColor: string;
    dividerWidth: number;
    shading: boolean;
  };
  indicator: { position: Side; shape: IndicatorShape; color: string; size: number; flap: boolean };
  hub: { label: string; radius: number; color: string; textColor: string };
  labels: {
    font: FontChoice;
    weight: number;
    colorMode: "auto" | "custom";
    color: string;
    maxFontSize: number;
    imageScale: number;
    uniform: boolean;
    direction: LabelDirection;
  };
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const icon = (name: string): string => `${import.meta.env.BASE_URL}icons/${name}.svg`;

export const PRESET_ICONS = ["coin", "gift", "diamond", "crown", "heart", "bolt", "star"].map(
  (name) => ({ name, url: icon(name) }),
);

const SAMPLE_SHAPE: { frequency: number; image?: string }[] = [
  { frequency: 18, image: "coin" },
  { frequency: 12, image: "bolt" },
  { frequency: 9, image: "heart" },
  { frequency: 22 },
  { frequency: 8, image: "gift" },
  { frequency: 1, image: "crown" },
  { frequency: 25, image: "coin" },
  { frequency: 5, image: "diamond" },
];

const SAMPLE_TITLES: Record<Locale, string[]> = {
  en: [
    "100 Coins",
    "Free Spin",
    "Extra Life",
    "Try Again",
    "Mystery Gift",
    "Jackpot",
    "50 Coins",
    "Diamond",
  ],
  fa: [
    "۱۰۰ سکه",
    "چرخش رایگان",
    "جان اضافه",
    "دوباره تلاش کن",
    "جعبه‌ی شانس",
    "جایزه‌ی بزرگ",
    "۵۰ سکه",
    "الماس",
  ],
};

export const HUB_LABELS: Record<Locale, string> = { en: "SPIN", fa: "بچرخان" };

interface Theme {
  palette: string[];
  frame: DemoConfig["frame"];
  indicator: Pick<DemoConfig["indicator"], "shape" | "color">;
  hub: Pick<DemoConfig["hub"], "color" | "textColor">;
}

export const THEMES: Record<ThemeName, Theme> = {
  twilight: {
    palette: [
      "#ef476f",
      "#f78c6b",
      "#ffd166",
      "#06d6a0",
      "#118ab2",
      "#7b2cbf",
      "#ff7aa2",
      "#3a86ff",
    ],
    frame: {
      width: 24,
      color: "#4a3784",
      pegs: true,
      pegColor: "#ffcf4a",
      pegSize: 4.5,
      dividerColor: "#ffffff66",
      dividerWidth: 1.5,
      shading: true,
    },
    indicator: { shape: "pin", color: "#e5383b" },
    hub: { color: "#f1eefb", textColor: "#2b2152" },
  },
  casino: {
    palette: [
      "#b3001b",
      "#141414",
      "#b3001b",
      "#141414",
      "#0b7a3e",
      "#b3001b",
      "#141414",
      "#d4a017",
    ],
    frame: {
      width: 30,
      color: "#6b4a12",
      pegs: true,
      pegColor: "#ffe08a",
      pegSize: 5,
      dividerColor: "#e9c46a",
      dividerWidth: 2,
      shading: true,
    },
    indicator: { shape: "triangle", color: "#f5b700" },
    hub: { color: "#2a2a2a", textColor: "#ffd166" },
  },
  minimal: {
    palette: [
      "#a5b4fc",
      "#f9a8d4",
      "#fcd34d",
      "#86efac",
      "#7dd3fc",
      "#c4b5fd",
      "#fdba74",
      "#99f6e4",
    ],
    frame: {
      width: 8,
      color: "#e5e7eb",
      pegs: false,
      pegColor: "#9ca3af",
      pegSize: 3,
      dividerColor: "#ffffff",
      dividerWidth: 3,
      shading: false,
    },
    indicator: { shape: "needle", color: "#111827" },
    hub: { color: "#ffffff", textColor: "#111827" },
  },
  neon: {
    palette: [
      "#ff2bd6",
      "#00e5ff",
      "#39ff14",
      "#ffe600",
      "#ff6b00",
      "#8a2be2",
      "#00ffa3",
      "#ff3864",
    ],
    frame: {
      width: 20,
      color: "#141a2e",
      pegs: true,
      pegColor: "#39ff14",
      pegSize: 4,
      dividerColor: "#0b0f1a",
      dividerWidth: 3,
      shading: true,
    },
    indicator: { shape: "triangle", color: "#ff2bd6" },
    hub: { color: "#0b0f1a", textColor: "#39ff14" },
  },
};

export function sampleSegments(
  locale: Locale,
  palette = THEMES.twilight.palette,
): EditableSegment[] {
  return SAMPLE_SHAPE.map((shape, i) => ({
    id: newId(),
    title: SAMPLE_TITLES[locale][i],
    frequency: shape.frequency,
    color: palette[i % palette.length],
    ...(shape.image ? { image: icon(shape.image) } : {}),
  }));
}

export function applyTheme(config: DemoConfig, name: ThemeName): DemoConfig {
  const theme = THEMES[name];
  return {
    ...config,
    theme: name,
    frame: { ...theme.frame },
    indicator: { ...config.indicator, ...theme.indicator },
    hub: { ...config.hub, ...theme.hub },
    segments: config.segments.map((s, i) => ({
      ...s,
      color: theme.palette[i % theme.palette.length],
    })),
  };
}

export function defaultConfig(locale: Locale): DemoConfig {
  const t = THEMES.twilight;
  return {
    locale,
    segments: sampleSegments(locale),
    samples: true,
    theme: "twilight",
    size: { mode: "fit", px: 520 },
    sizing: "equal",
    spinDirection: "clockwise",
    sound: true,
    allowFlick: true,
    physics: { ...DEFAULT_PHYSICS },
    frame: { ...t.frame },
    indicator: { position: "top", size: 1, flap: true, ...t.indicator },
    hub: { label: HUB_LABELS[locale], radius: 40, ...t.hub },
    labels: {
      font: locale === "fa" ? "vazirmatn" : "rounded",
      weight: 700,
      colorMode: "auto",
      color: "#ffffff",
      maxFontSize: 24,
      imageScale: 1.9,
      uniform: true,
      direction: "auto",
    },
  };
}

/** Switches language; sample segments and the default hub label follow it, user content doesn't. */
export function switchLocale(config: DemoConfig, locale: Locale): DemoConfig {
  const palette = config.theme ? THEMES[config.theme].palette : undefined;
  const hubIsDefault = Object.values(HUB_LABELS).includes(config.hub.label);
  const fontIsDefault =
    (config.labels.font === "rounded" && config.locale === "en") ||
    (config.labels.font === "vazirmatn" && config.locale === "fa");
  return {
    ...config,
    locale,
    segments: config.samples ? sampleSegments(locale, palette) : config.segments,
    hub: hubIsDefault ? { ...config.hub, label: HUB_LABELS[locale] } : config.hub,
    labels: fontIsDefault
      ? { ...config.labels, font: locale === "fa" ? "vazirmatn" : "rounded" }
      : config.labels,
  };
}

/* ------------------------------------------------------------------------------------------------
 * Persistence
 * ---------------------------------------------------------------------------------------------- */

const STORAGE_KEY = "betterluck/demo/v3";

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** Merges stored values over defaults, keeping only keys and types the defaults know about. */
function mergeKnown<T>(base: T, stored: unknown): T {
  if (!isRecord(base) || !isRecord(stored)) return base;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(base)) {
    const incoming = stored[key];
    if (incoming === undefined) continue;
    if (isRecord(value) && !Array.isArray(value)) out[key] = mergeKnown(value, incoming);
    else if (typeof incoming === typeof value || value === null) out[key] = incoming;
  }
  return out as T;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");

/** `value` if it's one of `allowed`, else `fallback`. */
const pick = <T extends string>(value: T, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value) ? value : fallback;

const clampNumber = (v: number, min: number, max: number, fallback: number): number =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

function parseSegment(raw: unknown): EditableSegment | null {
  if (!isRecord(raw)) return null;
  const frequency = Number(raw.frequency);
  return {
    id: str(raw.id) || newId(),
    title: str(raw.title),
    frequency: Number.isFinite(frequency) && frequency >= 0 ? frequency : 1,
    color: str(raw.color) || "#888888",
    ...(str(raw.textColor) ? { textColor: str(raw.textColor) } : {}),
    ...(str(raw.image) ? { image: str(raw.image) } : {}),
  };
}

export function initialLocale(): Locale {
  try {
    return navigator.language.toLowerCase().startsWith("fa") ? "fa" : "en";
  } catch {
    return "en";
  }
}

export function loadConfig(): DemoConfig {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!isRecord(raw)) return defaultConfig(initialLocale());
    const locale: Locale = raw.locale === "fa" ? "fa" : "en";
    const base = defaultConfig(locale);
    const merged = mergeKnown(base, raw);
    const segments = Array.isArray(raw.segments)
      ? raw.segments.map(parseSegment).filter((s): s is EditableSegment => s !== null)
      : merged.segments;
    // Stored strings must still be valid choices; anything else falls back to the default.
    return {
      ...merged,
      locale,
      segments,
      theme: merged.theme && Object.hasOwn(THEMES, merged.theme) ? merged.theme : null,
      size: {
        mode: pick(merged.size.mode, ["fit", "fixed"], "fit"),
        px: clampNumber(merged.size.px, 140, 760, 520),
      },
      sizing: pick(merged.sizing, ["equal", "proportional"], "equal"),
      spinDirection: pick(merged.spinDirection, ["clockwise", "counterclockwise"], "clockwise"),
      physics: resolvePhysics(merged.physics),
      indicator: {
        ...merged.indicator,
        position: pick(merged.indicator.position, ["top", "right", "bottom", "left"], "top"),
        shape: pick(merged.indicator.shape, ["pin", "triangle", "needle"], "pin"),
      },
      labels: {
        ...merged.labels,
        font: pick(merged.labels.font, Object.keys(FONT_STACKS) as FontChoice[], base.labels.font),
        colorMode: pick(merged.labels.colorMode, ["auto", "custom"], "auto"),
        direction: pick(merged.labels.direction, ["auto", "ltr", "rtl"], "auto"),
      },
    };
  } catch {
    return defaultConfig(initialLocale());
  }
}

export function saveConfig(config: DemoConfig): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

/** Reads an uploaded image as a data URL, downscaling raster images so they stay storage-friendly. */
export async function imageFileToDataUrl(file: File, maxSize = 192): Promise<string> {
  const asDataUrl = () =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result)));
      reader.addEventListener("error", () =>
        reject(reader.error ?? new Error("Could not read file")),
      );
      reader.readAsDataURL(file);
    });
  if (file.type === "image/svg+xml" || typeof createImageBitmap !== "function") return asDataUrl();

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return asDataUrl();
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/webp", 0.9);
}

/* ------------------------------------------------------------------------------------------------
 * Code generation for the "Code" tab
 * ---------------------------------------------------------------------------------------------- */

const json = (value: unknown) => JSON.stringify(value);

function objectLiteral(entries: [string, unknown][], indent: string): string | null {
  const parts = entries.filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${json(v)}`);
  if (parts.length === 0) return null;
  const inline = `{ ${parts.join(", ")} }`;
  return inline.length <= 72
    ? inline
    : `{\n${parts.map((p) => `${indent}  ${p},`).join("\n")}\n${indent}}`;
}

/** `value` unless it equals `base` (so generated code only shows what you changed). */
const diff = <T>(value: T, base: T): T | undefined =>
  json(value) === json(base) ? undefined : value;

/** Library defaults for frame options (colors have no fixed default, so they're always shown). */
const FRAME_BASE: Partial<DemoConfig["frame"]> = {
  width: 24,
  pegs: true,
  pegSize: 4.5,
  dividerWidth: 1.5,
  shading: true,
};

/** JSX for the current configuration, showing only what differs from the library defaults. */
export function generateCode(config: DemoConfig): string {
  const d = defaultConfig(config.locale);
  const props: string[] = ["segments={segments}"];
  const add = (name: string, literal: string | null) => {
    if (literal) props.push(`${name}={${literal}}`);
  };

  if (config.size.mode === "fixed") props.push(`size={${config.size.px}}`);
  if (config.sizing !== "equal") props.push(`sizing="${config.sizing}"`);
  if (config.spinDirection !== "clockwise") props.push(`spinDirection="${config.spinDirection}"`);
  if (!config.sound) props.push("sound={false}");
  if (!config.allowFlick) props.push("allowFlick={false}");

  const p = config.physics;
  add(
    "physics",
    objectLiteral(
      (Object.keys(p) as (keyof WheelPhysics)[]).map((k) => [k, diff(p[k], DEFAULT_PHYSICS[k])]),
      "  ",
    ),
  );
  const f = config.frame;
  add(
    "frame",
    objectLiteral(
      (Object.keys(f) as (keyof DemoConfig["frame"])[]).map((k) => [k, diff(f[k], FRAME_BASE[k])]),
      "  ",
    ),
  );
  const i = config.indicator;
  add(
    "indicator",
    objectLiteral(
      [
        ["position", diff(i.position, "top")],
        ["shape", diff(i.shape, "pin")],
        ["color", i.color],
        ["size", diff(i.size, 1)],
        ["flap", diff(i.flap, true)],
      ],
      "  ",
    ),
  );
  const h = config.hub;
  add(
    "hub",
    objectLiteral(
      [
        ["label", diff(h.label, "SPIN")],
        ["radius", diff(h.radius, 40)],
        ["color", h.color],
        ["textColor", h.textColor],
      ],
      "  ",
    ),
  );
  const l = config.labels;
  add(
    "labels",
    objectLiteral(
      [
        ["color", l.colorMode === "custom" ? l.color : undefined],
        ["maxFontSize", diff(l.maxFontSize, d.labels.maxFontSize)],
        ["imageScale", diff(l.imageScale, d.labels.imageScale)],
        ["uniform", diff(l.uniform, true)],
        ["direction", diff(l.direction, "auto")],
      ],
      "  ",
    ),
  );
  const style = objectLiteral(
    [
      ["fontFamily", l.font === "rounded" ? undefined : FONT_STACKS[l.font]],
      ['"--bl-label-weight"', l.weight === 700 ? undefined : l.weight],
    ],
    "  ",
  );
  add("style", style);
  props.push("onSpinEnd={({ segment }) => console.log(segment.title)}");

  const sample = config.segments.slice(0, 2).map((s) =>
    objectLiteral(
      [
        ["title", s.title],
        ["frequency", s.frequency],
        ["color", s.color],
        ["textColor", s.textColor],
        ["image", s.image?.startsWith("data:") ? "data:…" : s.image],
      ],
      "  ",
    ),
  );
  const more = config.segments.length > 2 ? `\n  // …${config.segments.length - 2} more` : "";

  return `import { FortuneWheel, type Segment } from "betterluck";

const segments: Segment[] = [
${sample.map((s) => `  ${s},`).join("\n")}${more}
];

export function Prize() {
  return (
    <FortuneWheel
${props.map((line) => `      ${line}`).join("\n")}
    />
  );
}
`;
}
