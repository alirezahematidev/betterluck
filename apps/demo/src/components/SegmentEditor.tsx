import type { CSSProperties } from "react";
import { probabilities } from "betterluck";
import { useI18n } from "../i18n";
import { newId, sampleSegments, THEMES } from "../model";
import type { EditableSegment } from "../model";
import { Icon } from "./Icon";
import { ImageField } from "./ImageField";
import { NumberField } from "./NumberField";

interface SegmentEditorProps {
  segments: EditableSegment[];
  palette: string[];
  onChange(segments: EditableSegment[], samples?: boolean): void;
}

const isHex = (c: string) => /^#[\da-f]{6}$/i.test(c);

export function SegmentEditor({ segments, palette, onChange }: SegmentEditorProps) {
  const { t, percent, locale, num } = useI18n();
  const odds = probabilities(segments);

  const update = (id: string, patch: Partial<EditableSegment>) =>
    onChange(segments.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const move = (index: number, by: -1 | 1) => {
    const next = [...segments];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    onChange(next);
  };

  const duplicate = (index: number) => {
    const next = [...segments];
    next.splice(index + 1, 0, { ...segments[index], id: newId() });
    onChange(next);
  };

  const add = () =>
    onChange([
      ...segments,
      {
        id: newId(),
        title: `${t.newPrize} ${num(segments.length + 1)}`,
        frequency: 10,
        color: palette[segments.length % palette.length] ?? THEMES.twilight.palette[0],
      },
    ]);

  return (
    <div className="segment-editor">
      <ol className="segment-list">
        {segments.map((segment, index) => {
          const n = `${t.segmentN} ${num(index + 1)}`;
          return (
            <li
              key={segment.id}
              className="segment-card"
              style={{ "--seg": segment.color } as CSSProperties}
            >
              <div className="segment-head">
                <span className="segment-index">{num(index + 1)}</span>
                <input
                  type="color"
                  className="color-input"
                  aria-label={`${n}: ${t.color}`}
                  value={isHex(segment.color) ? segment.color : "#888888"}
                  onChange={(e) => update(segment.id, { color: e.target.value })}
                />
                <input
                  className="title-input"
                  dir="auto"
                  aria-label={`${n}: ${t.titleField}`}
                  placeholder={t.titleField}
                  value={segment.title}
                  onChange={(e) => update(segment.id, { title: e.target.value })}
                />
                <div className="segment-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    title={t.moveUp}
                    aria-label={t.moveUp}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <Icon name="up" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    title={t.moveDown}
                    aria-label={t.moveDown}
                    disabled={index === segments.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <Icon name="down" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    title={t.duplicate}
                    aria-label={t.duplicate}
                    onClick={() => duplicate(index)}
                  >
                    <Icon name="copy" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    title={t.remove}
                    aria-label={t.remove}
                    onClick={() => onChange(segments.filter((s) => s.id !== segment.id))}
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              </div>

              <div className="segment-fields">
                <div className="field narrow">
                  <label htmlFor={`freq-${segment.id}`}>{t.frequency}</label>
                  <NumberField
                    id={`freq-${segment.id}`}
                    value={segment.frequency}
                    onValueChange={(v) => update(segment.id, { frequency: Math.max(0, v) })}
                  />
                </div>
                <div className="odds">
                  <span>{t.chance}</span>
                  <strong>{percent(odds[index])}</strong>
                </div>
                <div className="field text-color">
                  <span className="field-label">{t.textColor}</span>
                  <div className="text-color-controls">
                    <label className="mini-toggle">
                      <input
                        type="checkbox"
                        aria-label={`${n}: ${t.textColor}, ${t.auto}`}
                        checked={!segment.textColor}
                        onChange={(e) =>
                          update(segment.id, {
                            textColor: e.target.checked ? undefined : "#ffffff",
                          })
                        }
                      />
                      {t.auto}
                    </label>
                    {segment.textColor && (
                      <input
                        type="color"
                        className="color-input small"
                        aria-label={`${n}: ${t.textColor}`}
                        value={isHex(segment.textColor) ? segment.textColor : "#ffffff"}
                        onChange={(e) => update(segment.id, { textColor: e.target.value })}
                      />
                    )}
                  </div>
                </div>
              </div>

              <ImageField
                value={segment.image}
                onChange={(image) => update(segment.id, { image })}
              />
            </li>
          );
        })}
      </ol>

      {segments.length === 0 && <p className="empty-note">{t.noSegments}</p>}

      <div className="editor-actions">
        <button type="button" className="btn add-btn" onClick={add}>
          <Icon name="plus" /> {t.addSegment}
        </button>
        <button
          type="button"
          className="btn subtle"
          onClick={() => onChange(sampleSegments(locale, palette), true)}
        >
          <Icon name="reset" /> {t.loadSamples}
        </button>
      </div>
    </div>
  );
}
