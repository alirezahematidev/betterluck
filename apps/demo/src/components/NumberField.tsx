import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { useI18n } from "../i18n";
import { parseLocaleNumber } from "../numbers";

interface NumberFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> {
  value: number;
  onValueChange(value: number): void;
}

/**
 * Number input that shows locale digits, keeps the raw text while typing (so "0." or "" survive)
 * and only reports finite numbers upward.
 */
export function NumberField({ value, onValueChange, onBlur, ...rest }: NumberFieldProps) {
  const { num } = useI18n();
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={draft ?? num(value, 4).replace(/[٬,](?=\d{3})/g, "")}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = parseLocaleNumber(e.target.value);
        if (Number.isFinite(n)) onValueChange(n);
      }}
      onBlur={(e) => {
        setDraft(null);
        onBlur?.(e);
      }}
    />
  );
}
