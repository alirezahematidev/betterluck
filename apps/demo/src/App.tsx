import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { FortuneWheel, probabilities, totalWeight } from "betterluck";
import type { FortuneWheelHandle, LabelOptions, Segment } from "betterluck";
import { BehaviorPanel } from "./components/BehaviorPanel";
import { CodePanel } from "./components/CodePanel";
import { Icon } from "./components/Icon";
import { SegmentEditor } from "./components/SegmentEditor";
import { StylePanel } from "./components/StylePanel";
import { I18nContext, makeI18n } from "./i18n";
import { defaultConfig, FONT_STACKS, loadConfig, saveConfig, switchLocale, THEMES } from "./model";
import type { DemoConfig } from "./model";
import "./App.css";

const REPO_URL = "https://github.com/alirezahematidev/betterluck";

interface HistoryEntry {
  key: number;
  segment: Segment;
  chance: number;
}

type Tab = "segments" | "style" | "behavior" | "code";
const TABS: Tab[] = ["segments", "style", "behavior", "code"];

export default function App() {
  const [config, setConfig] = useState<DemoConfig>(loadConfig);
  const [tab, setTab] = useState<Tab>("segments");
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saveFailed, setSaveFailed] = useState(false);
  const wheel = useRef<FortuneWheelHandle>(null);
  const spinCount = useRef(0);

  const i18n = useMemo(() => makeI18n(config.locale), [config.locale]);
  const { t, num } = i18n;
  const { segments, labels } = config;
  const canSpin = segments.length > 0 && totalWeight(segments) > 0;
  const latest = history[0];

  // Before paint, so a Persian page never flashes left-to-right.
  useLayoutEffect(() => {
    document.documentElement.lang = config.locale;
    document.documentElement.dir = i18n.dir;
    document.title = `betterluck: ${t.title}`;
  }, [config.locale, i18n.dir, t.title]);

  const commit = (next: DemoConfig) => {
    setConfig(next);
    setSaveFailed(!saveConfig(next));
  };

  const labelOptions: LabelOptions = useMemo(
    () => ({
      color: labels.colorMode === "custom" ? labels.color : undefined,
      maxFontSize: labels.maxFontSize,
      imageScale: labels.imageScale,
      uniform: labels.uniform,
      direction: labels.direction,
    }),
    [labels],
  );
  const wheelStyle = useMemo(
    () =>
      ({
        fontFamily: FONT_STACKS[labels.font],
        "--bl-label-weight": labels.weight,
      }) as CSSProperties,
    [labels.font, labels.weight],
  );
  const palette = config.theme ? THEMES[config.theme].palette : THEMES.twilight.palette;

  /** Arrow keys move between tabs (mirrored in RTL), Home/End jump to the ends. */
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const forward = i18n.dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const back = i18n.dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    const at = TABS.indexOf(tab);
    const next =
      e.key === forward
        ? TABS[(at + 1) % TABS.length]
        : e.key === back
          ? TABS[(at - 1 + TABS.length) % TABS.length]
          : e.key === "Home"
            ? TABS[0]
            : e.key === "End"
              ? TABS.at(-1)
              : undefined;
    if (!next) return;
    e.preventDefault();
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <I18nContext.Provider value={i18n}>
      <div className="app">
        <header className="app-header">
          <div className="brand">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <nav className="header-actions">
            <button
              type="button"
              className="btn subtle"
              aria-label={t.languageLabel}
              lang={config.locale === "fa" ? "en" : "fa"}
              onClick={() => commit(switchLocale(config, config.locale === "fa" ? "en" : "fa"))}
            >
              <Icon name="globe" /> {t.language}
            </button>
            <a className="btn subtle" href={REPO_URL} target="_blank" rel="noreferrer">
              <Icon name="github" /> {t.github}
            </a>
          </nav>
        </header>

        <main className="layout">
          <section className="stage" aria-label={t.title}>
            <div className="wheel-wrap" data-fit={config.size.mode === "fit" || undefined}>
              <FortuneWheel
                ref={wheel}
                segments={segments}
                size={config.size.mode === "fixed" ? config.size.px : undefined}
                sizing={config.sizing}
                spinDirection={config.spinDirection}
                physics={config.physics}
                sound={config.sound}
                allowFlick={config.allowFlick}
                frame={config.frame}
                indicator={config.indicator}
                hub={{ ...config.hub, ariaLabel: t.spin }}
                labels={labelOptions}
                style={wheelStyle}
                aria-label={t.title}
                announce={({ segment }) => `${t.youLanded}: ${segment.title}`}
                onSpinStart={() => setSpinning(true)}
                onSpinEnd={(result) => {
                  setSpinning(false);
                  spinCount.current += 1;
                  const entry: HistoryEntry = {
                    key: spinCount.current,
                    segment: result.segment,
                    chance: probabilities(segments)[result.index] ?? 0,
                  };
                  setHistory((h) => [entry, ...h].slice(0, 12));
                }}
              />
            </div>

            <button
              type="button"
              className="spin-btn"
              disabled={spinning || !canSpin}
              onClick={() => wheel.current?.spin()}
            >
              {spinning ? t.spinning : t.spin}
            </button>
            {canSpin ? (
              config.allowFlick && <p className="stage-hint">{t.hint}</p>
            ) : (
              <p className="stage-note">{t.noWeight}</p>
            )}

            <div className="result">
              {latest && !spinning ? (
                <div
                  key={latest.key}
                  className="result-card"
                  style={{ borderColor: latest.segment.color }}
                >
                  {latest.segment.image && <img src={latest.segment.image} alt="" />}
                  <div>
                    <p className="result-kicker">{t.youLanded}</p>
                    <p className="result-title" dir="auto">
                      {latest.segment.title || t.untitled}
                    </p>
                    <p className="result-chance">
                      {t.chance}: {i18n.percent(latest.chance)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="result-card placeholder">
                  <p>{spinning ? t.goodLuck : t.resultPlaceholder}</p>
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="history">
                <div className="history-head">
                  <h2>{t.recent}</h2>
                  <button type="button" className="link-btn" onClick={() => setHistory([])}>
                    {t.clear}
                  </button>
                </div>
                <ol>
                  {history.map((entry) => (
                    <li key={entry.key} dir="auto">
                      <span className="dot" style={{ background: entry.segment.color }} />
                      {entry.segment.title || t.untitled}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>

          <aside className="panel">
            <div className="tabs" role="tablist" aria-label={t.title}>
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls={`panel-${id}`}
                  className="tab"
                  tabIndex={tab === id ? 0 : -1}
                  onClick={() => setTab(id)}
                  onKeyDown={onTabKey}
                >
                  {
                    {
                      segments: (
                        <>
                          {t.tabSegments}
                          <span className="tab-count"> ({num(segments.length)})</span>
                        </>
                      ),
                      style: t.tabStyle,
                      behavior: t.tabBehavior,
                      code: t.tabCode,
                    }[id]
                  }
                </button>
              ))}
            </div>

            {spinning && tab !== "code" && <p className="panel-lock">{t.editingPaused}</p>}
            {saveFailed && <p className="panel-warn">{t.saveFailed}</p>}

            <fieldset className="panel-body" disabled={spinning && tab !== "code"}>
              <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
                {tab === "segments" && (
                  <SegmentEditor
                    segments={segments}
                    palette={palette}
                    onChange={(next, samples = false) =>
                      commit({ ...config, segments: next, samples })
                    }
                  />
                )}
                {tab === "style" && <StylePanel config={config} onChange={commit} />}
                {tab === "behavior" && (
                  <BehaviorPanel
                    config={config}
                    onChange={commit}
                    onResetAll={() => {
                      commit(defaultConfig(config.locale));
                      setHistory([]);
                    }}
                  />
                )}
                {tab === "code" && <CodePanel config={config} />}
              </div>
            </fieldset>
          </aside>
        </main>

        <footer className="app-footer">
          <span>{t.savedLocally}</span>
          <span dir="ltr">betterluck · MIT</span>
        </footer>
      </div>
    </I18nContext.Provider>
  );
}
