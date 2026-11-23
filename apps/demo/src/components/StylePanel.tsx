import type { IndicatorShape, LabelDirection } from "betterluck";
import { useI18n } from "../i18n";
import { applyTheme, THEMES } from "../model";
import type { DemoConfig, FontChoice, Side, ThemeName } from "../model";
import { ColorField, Section, Segmented, Select, Slider, TextField, Toggle } from "./controls";

/** Four hard color stops: a tiny preview of a theme's palette. */
const swatch = (palette: string[]) =>
  `linear-gradient(90deg, ${palette
    .slice(0, 4)
    .map((c, i) => `${c} ${i * 25}% ${(i + 1) * 25}%`)
    .join(", ")})`;

interface PanelProps {
  config: DemoConfig;
  onChange(config: DemoConfig): void;
}

export function StylePanel({ config, onChange }: PanelProps) {
  const { t } = useI18n();
  const { frame, indicator, hub, labels } = config;
  // Any manual change means the config no longer matches a named theme.
  const set = <K extends keyof DemoConfig>(key: K, value: DemoConfig[K]) =>
    onChange({ ...config, [key]: value, theme: null });
  const setFrame = (patch: Partial<DemoConfig["frame"]>) => set("frame", { ...frame, ...patch });
  const setIndicator = (patch: Partial<DemoConfig["indicator"]>) =>
    set("indicator", { ...indicator, ...patch });
  const setHub = (patch: Partial<DemoConfig["hub"]>) => set("hub", { ...hub, ...patch });
  const setLabels = (patch: Partial<DemoConfig["labels"]>) =>
    set("labels", { ...labels, ...patch });
  const u = t.units;

  return (
    <div className="panel-stack">
      <Section title={t.theme} hint={t.themeHint}>
        <div className="theme-grid">
          {(Object.keys(THEMES) as ThemeName[]).map((name) => (
            <button
              key={name}
              type="button"
              className="theme-btn"
              data-active={config.theme === name || undefined}
              onClick={() => onChange(applyTheme(config, name))}
            >
              <span
                className="theme-swatches"
                aria-hidden="true"
                style={{ background: swatch(THEMES[name].palette) }}
              />
              {t.themes[name]}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t.size}>
        <Segmented
          label={t.size}
          hideLabel
          value={config.size.mode}
          options={[
            { value: "fit", label: t.fitContainer },
            { value: "fixed", label: t.fixed },
          ]}
          onChange={(mode) => set("size", { ...config.size, mode })}
        />
        {config.size.mode === "fixed" && (
          <Slider
            label={t.diameter}
            value={config.size.px}
            min={140}
            max={760}
            step={10}
            unit={u.px}
            digits={0}
            onChange={(px) => set("size", { ...config.size, px })}
          />
        )}
      </Section>

      <Section title={t.frame}>
        <Slider
          label={t.frameWidth}
          value={frame.width}
          min={0}
          max={60}
          step={1}
          unit={u.units}
          digits={0}
          onChange={(width) => setFrame({ width })}
        />
        <ColorField
          label={t.frameColor}
          value={frame.color}
          onChange={(color) => setFrame({ color })}
        />
        <Toggle label={t.pegs} checked={frame.pegs} onChange={(pegs) => setFrame({ pegs })} />
        {frame.pegs && (
          <>
            <ColorField
              label={t.pegColor}
              value={frame.pegColor}
              onChange={(pegColor) => setFrame({ pegColor })}
            />
            <Slider
              label={t.pegSize}
              value={frame.pegSize}
              min={1.5}
              max={9}
              step={0.5}
              unit={u.units}
              onChange={(pegSize) => setFrame({ pegSize })}
            />
          </>
        )}
        <ColorField
          label={t.dividerColor}
          value={frame.dividerColor}
          onChange={(dividerColor) => setFrame({ dividerColor })}
        />
        <Slider
          label={t.dividerWidth}
          value={frame.dividerWidth}
          min={0}
          max={6}
          step={0.5}
          unit={u.units}
          onChange={(dividerWidth) => setFrame({ dividerWidth })}
        />
        <Toggle
          label={t.shading}
          checked={frame.shading}
          onChange={(shading) => setFrame({ shading })}
        />
      </Section>

      <Section title={t.indicator}>
        <Segmented<Side>
          label={t.position}
          value={indicator.position}
          options={(["top", "right", "bottom", "left"] as const).map((v) => ({
            value: v,
            label: t.positions[v],
          }))}
          onChange={(position) => setIndicator({ position })}
        />
        <Segmented<IndicatorShape>
          label={t.shape}
          value={indicator.shape}
          options={(["pin", "triangle", "needle"] as const).map((v) => ({
            value: v,
            label: t.shapes[v],
          }))}
          onChange={(shape) => setIndicator({ shape })}
        />
        <ColorField
          label={t.color}
          value={indicator.color}
          onChange={(color) => setIndicator({ color })}
        />
        <Slider
          label={t.indicatorSize}
          value={indicator.size}
          min={0.5}
          max={2}
          step={0.05}
          digits={2}
          onChange={(size) => setIndicator({ size })}
        />
        <Toggle
          label={t.flap}
          checked={indicator.flap}
          onChange={(flap) => setIndicator({ flap })}
        />
      </Section>

      <Section title={t.hub}>
        <TextField label={t.hubLabel} value={hub.label} onChange={(label) => setHub({ label })} />
        <Slider
          label={t.hubRadius}
          value={hub.radius}
          min={0}
          max={80}
          step={1}
          unit={u.units}
          digits={0}
          onChange={(radius) => setHub({ radius })}
        />
        <ColorField label={t.hubColor} value={hub.color} onChange={(color) => setHub({ color })} />
        <ColorField
          label={t.hubTextColor}
          value={hub.textColor}
          onChange={(textColor) => setHub({ textColor })}
        />
      </Section>

      <Section title={t.labels}>
        <Select<FontChoice>
          label={t.font}
          value={labels.font}
          options={(Object.keys(t.fonts) as FontChoice[]).map((v) => ({
            value: v,
            label: t.fonts[v],
          }))}
          onChange={(font) => setLabels({ font })}
        />
        <Slider
          label={t.weight}
          value={labels.weight}
          min={400}
          max={900}
          step={100}
          digits={0}
          onChange={(weight) => setLabels({ weight })}
        />
        <Segmented
          label={t.labelColor}
          value={labels.colorMode}
          options={[
            { value: "auto", label: t.auto },
            { value: "custom", label: t.custom },
          ]}
          onChange={(colorMode) => setLabels({ colorMode })}
        />
        {labels.colorMode === "custom" && (
          <ColorField
            label={t.labelColor}
            value={labels.color}
            onChange={(color) => setLabels({ color })}
          />
        )}
        <Slider
          label={t.maxFontSize}
          value={labels.maxFontSize}
          min={10}
          max={48}
          step={1}
          unit={u.units}
          digits={0}
          onChange={(maxFontSize) => setLabels({ maxFontSize })}
        />
        <Slider
          label={t.imageScale}
          value={labels.imageScale}
          min={0}
          max={3}
          step={0.1}
          onChange={(imageScale) => setLabels({ imageScale })}
        />
        <Segmented<LabelDirection>
          label={t.direction}
          value={labels.direction}
          options={(["auto", "ltr", "rtl"] as const).map((v) => ({
            value: v,
            label: t.directions[v],
          }))}
          onChange={(direction) => setLabels({ direction })}
        />
        <Toggle
          label={t.uniform}
          checked={labels.uniform}
          onChange={(uniform) => setLabels({ uniform })}
        />
      </Section>
    </div>
  );
}
