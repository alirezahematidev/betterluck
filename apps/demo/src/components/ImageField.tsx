import { useId, useState } from "react";
import { useI18n } from "../i18n";
import { imageFileToDataUrl, PRESET_ICONS } from "../model";
import { Icon } from "./Icon";

interface ImageFieldProps {
  value: string | undefined;
  onChange(value: string | undefined): void;
}

export function ImageField({ value, onChange }: ImageFieldProps) {
  const { t } = useI18n();
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const isData = value?.startsWith("data:") ?? false;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t.notAnImage);
      return;
    }
    try {
      setError(null);
      onChange(await imageFileToDataUrl(file));
    } catch {
      setError(t.imageReadError);
    }
  };

  return (
    <div className="image-field">
      <div className="image-thumb" data-empty={!value || undefined}>
        {value ? <img src={value} alt="" /> : <Icon name="upload" size={18} />}
      </div>
      <div className="image-controls">
        <div className="image-row">
          <input
            type="url"
            dir="ltr"
            placeholder={t.imageUrl}
            aria-label={t.imageUrl}
            value={isData ? "" : (value ?? "")}
            onChange={(e) => onChange(e.target.value.trim() || undefined)}
          />
          <label className="icon-btn" htmlFor={inputId} title={t.upload}>
            <Icon name="upload" />
            <span className="sr-only">{t.upload}</span>
          </label>
          <input
            id={inputId}
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="icon-btn"
            title={t.removeImage}
            disabled={!value}
            onClick={() => onChange(undefined)}
          >
            <Icon name="x" />
            <span className="sr-only">{t.removeImage}</span>
          </button>
        </div>
        <fieldset className="presets">
          <legend className="sr-only">{t.presetImages}</legend>
          {PRESET_ICONS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="preset"
              data-active={value === preset.url || undefined}
              title={preset.name}
              onClick={() => onChange(preset.url)}
            >
              <img src={preset.url} alt={preset.name} />
            </button>
          ))}
          {isData && <span className="uploaded-tag">{t.uploaded}</span>}
        </fieldset>
        {error && <p className="field-error">{error}</p>}
      </div>
    </div>
  );
}
