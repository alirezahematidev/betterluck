import { DEFAULT_PHYSICS, estimateSpin } from "react-physics-wheel";
import type { SegmentSizing, SpinDirection, WheelPhysics } from "react-physics-wheel";
import { useI18n } from "../i18n";
import type { DemoConfig } from "../model";
import { Section, Segmented, Slider, Toggle } from "./controls";
import { Icon } from "./Icon";

interface PanelProps {
  config: DemoConfig;
  onChange(config: DemoConfig): void;
  onResetAll(): void;
}

export function BehaviorPanel({ config, onChange, onResetAll }: PanelProps) {
  const { t, num } = useI18n();
  const u = t.units;
  const set = <K extends keyof DemoConfig>(key: K, value: DemoConfig[K]) =>
    onChange({ ...config, [key]: value });
  const setPhysics = (key: keyof WheelPhysics, value: number) => {
    const physics = { ...config.physics, [key]: value };
    // Keep the launch range ordered while dragging either end.
    if (key === "minLaunchSpeed" && value > physics.maxLaunchSpeed) physics.maxLaunchSpeed = value;
    if (key === "maxLaunchSpeed" && value < physics.minLaunchSpeed) physics.minLaunchSpeed = value;
    set("physics", physics);
  };
  const estimate = estimateSpin(config.physics);
  const sliders: {
    key: keyof WheelPhysics;
    label: string;
    unit: string;
    min: number;
    max: number;
    step: number;
    digits: number;
  }[] = [
    {
      key: "minLaunchSpeed",
      label: t.minLaunchSpeed,
      unit: u.radPerSec,
      min: 4,
      max: 40,
      step: 0.5,
      digits: 1,
    },
    {
      key: "maxLaunchSpeed",
      label: t.maxLaunchSpeed,
      unit: u.radPerSec,
      min: 4,
      max: 40,
      step: 0.5,
      digits: 1,
    },
    {
      key: "spinUpTime",
      label: t.spinUpTime,
      unit: u.seconds,
      min: 0,
      max: 1.5,
      step: 0.05,
      digits: 2,
    },
    {
      key: "friction",
      label: t.friction,
      unit: u.radPerSec2,
      min: 0.1,
      max: 4,
      step: 0.05,
      digits: 2,
    },
    { key: "drag", label: t.drag, unit: u.perSec, min: 0, max: 1.5, step: 0.01, digits: 2 },
    {
      key: "flickThreshold",
      label: t.flickThreshold,
      unit: u.radPerSec,
      min: 1,
      max: 12,
      step: 0.5,
      digits: 1,
    },
  ];

  return (
    <div className="panel-stack">
      <Section title={t.sliceSize}>
        <Segmented<SegmentSizing>
          label={t.sliceSize}
          hideLabel
          value={config.sizing}
          options={[
            { value: "equal", label: t.equal },
            { value: "proportional", label: t.proportional },
          ]}
          hint={config.sizing === "equal" ? t.equalHint : t.proportionalHint}
          onChange={(sizing) => set("sizing", sizing)}
        />
      </Section>

      <Section title={t.spinDirection}>
        <Segmented<SpinDirection>
          label={t.spinDirection}
          hideLabel
          value={config.spinDirection}
          options={[
            { value: "clockwise", label: t.clockwise },
            { value: "counterclockwise", label: t.counterclockwise },
          ]}
          onChange={(spinDirection) => set("spinDirection", spinDirection)}
        />
      </Section>

      <Section title={t.interaction}>
        <Toggle label={t.sound} checked={config.sound} onChange={(sound) => set("sound", sound)} />
        <Toggle
          label={t.flick}
          checked={config.allowFlick}
          onChange={(allowFlick) => set("allowFlick", allowFlick)}
        />
      </Section>

      <Section
        title={t.physics}
        hint={t.physicsHint(num(estimate.seconds, 1), num(estimate.turns, 1))}
      >
        {sliders.map((s) => (
          <Slider
            key={s.key}
            label={s.label}
            value={config.physics[s.key]}
            min={s.min}
            max={s.max}
            step={s.step}
            unit={s.unit}
            digits={s.digits}
            onChange={(v) => setPhysics(s.key, v)}
          />
        ))}
        <button
          type="button"
          className="btn subtle"
          onClick={() => set("physics", { ...DEFAULT_PHYSICS })}
        >
          <Icon name="reset" /> {t.resetPhysics}
        </button>
      </Section>

      <button type="button" className="btn danger-outline" onClick={onResetAll}>
        {t.resetAll}
      </button>
    </div>
  );
}
