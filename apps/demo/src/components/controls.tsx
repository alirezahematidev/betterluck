import { useId } from "react";
import type { ReactNode } from "react";
import { useI18n } from "../i18n";

export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <fieldset className="section">
      <legend>{title}</legend>
      {hint && <p className="hint">{hint}</p>}
      {children}
    </fieldset>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  digits?: number;
  hint?: string;
  onChange(value: number): void;
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  digits = 1,
  hint,
  onChange,
}: SliderProps) {
  const { num } = useI18n();
  const id = useId();
  return (
    <div className="slider" title={hint}>
      <label className="slider-label" htmlFor={id}>
        {label}
        <output htmlFor={id}>
          {num(value, digits)}
          {unit && <small> {unit}</small>}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.valueAsNumber)}
      />
    </div>
  );
}

const HEX6 = /^#[\da-f]{6}/i;

/** Color picker that keeps an existing alpha suffix (#rrggbbaa) intact. */
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
}) {
  const id = useId();
  const base = HEX6.test(value) ? value.slice(0, 7) : "#888888";
  const alpha = HEX6.test(value) ? value.slice(7) : "";
  return (
    <div className="color-field">
      <input id={id} type="color" value={base} onChange={(e) => onChange(e.target.value + alpha)} />
      <label htmlFor={id}>{label}</label>
      <code dir="ltr">{value}</code>
    </div>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  /** Keep the label for screen readers only (e.g. when the section title already says it). */
  hideLabel?: boolean;
  value: T;
  options: { value: T; label: string }[];
  onChange(value: T): void;
  hint?: string;
}

export function Segmented<T extends string>({
  label,
  hideLabel,
  value,
  options,
  onChange,
  hint,
}: SegmentedProps<T>) {
  const name = useId();
  return (
    <div className="segmented-field">
      <span className={hideLabel ? "sr-only" : "field-label"} id={`${name}-label`}>
        {label}
      </span>
      <div className="segmented" role="radiogroup" aria-labelledby={`${name}-label`}>
        {options.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange(value: boolean): void;
}) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange(value: T): void;
}

export function Select<T extends string>({ label, value, options, onChange }: SelectProps<T>) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
