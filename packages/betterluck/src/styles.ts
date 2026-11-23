/**
 * Default look. Every selector is wrapped in `:where()` so it has zero specificity: any class you
 * pass through `className` / `classNames` wins without `!important`. Colors come from CSS custom
 * properties, which the `frame`, `indicator`, `hub` and `labels` props set — or you can set them
 * yourself in CSS:
 *
 *   --bl-font            label + hub font family
 *   --bl-label-color     label color (default: automatic contrast per slice)
 *   --bl-label-light     light label color for dark slices (#fff)
 *   --bl-label-dark      dark label color for light slices (#1c1733)
 *   --bl-label-weight    label font weight (700)
 *   --bl-label-halo      outline around labels, e.g. `transparent` to remove
 *   --bl-frame-color     rim
 *   --bl-peg-color       pegs
 *   --bl-divider-color   lines between slices
 *   --bl-divider-width
 *   --bl-hub-color       hub face
 *   --bl-hub-accent      hub ring
 *   --bl-hub-text        hub label
 *   --bl-indicator-color indicator body
 *   --bl-indicator-stroke indicator outline
 *   --bl-winner-color    highlight on the winning slice
 *   --bl-shadow          drop shadow under the wheel
 *   --bl-focus           focus ring
 */
export const WHEEL_CSS = `
:where(.bl-wheel) {
  width: 100%;
  font-family: var(--bl-font, ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", Roboto, Vazirmatn, Tahoma, sans-serif);
  -webkit-tap-highlight-color: transparent;
}
:where(.bl-disc) {
  border-radius: 50%;
  box-shadow: var(--bl-shadow, 0 18px 40px rgb(0 0 0 / 0.4), 0 0 0 1px rgb(0 0 0 / 0.2));
}
:where(.bl-frame-inner) { stop-color: color-mix(in oklab, var(--bl-frame-color, #4a3784) 82%, black); }
:where(.bl-frame-mid) { stop-color: color-mix(in oklab, var(--bl-frame-color, #4a3784) 78%, white); }
:where(.bl-frame-outer) { stop-color: color-mix(in oklab, var(--bl-frame-color, #4a3784) 60%, black); }
:where(.bl-peg-light) { stop-color: color-mix(in oklab, var(--bl-peg-color, #ffcf4a) 30%, white); }
:where(.bl-peg-mid) { stop-color: var(--bl-peg-color, #ffcf4a); }
:where(.bl-peg-dark) { stop-color: color-mix(in oklab, var(--bl-peg-color, #ffcf4a) 62%, black); }
:where(.bl-peg) { stroke: rgb(0 0 0 / 0.35); stroke-width: 0.75; }
:where(.bl-slice) {
  stroke: var(--bl-divider-color, rgb(255 255 255 / 0.4));
  stroke-width: var(--bl-divider-width, 1.5);
  stroke-linejoin: round;
}
:where(.bl-empty) { fill: color-mix(in oklab, var(--bl-frame-color, #4a3784) 50%, #888); }
:where(.bl-rim-line) { fill: none; stroke: rgb(0 0 0 / 0.3); stroke-width: 2; }
:where(.bl-label) {
  font-weight: var(--bl-label-weight, 700);
  fill: var(--bl-label-color, var(--bl-label-auto));
  stroke: var(--bl-label-halo, var(--bl-label-auto-halo));
  stroke-width: 0.1em;
  stroke-linejoin: round;
  paint-order: stroke;
}
:where(.bl-image) { filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.35)); }
:where(.bl-winner) {
  fill: var(--bl-winner-color, #fff);
  fill-opacity: 0.16;
  stroke: var(--bl-winner-color, #fff);
  stroke-opacity: 0.9;
  stroke-width: 3;
  /* A few pulses, then a steady highlight (an endless animation would keep repainting the disc). */
  animation: bl-pulse 1.1s ease-in-out 3;
}
@keyframes bl-pulse {
  0%, 100% { fill-opacity: 0.16; stroke-opacity: 0.9; }
  50% { fill-opacity: 0.34; stroke-opacity: 0.45; }
}
:where(.bl-overlay) { touch-action: none; user-select: none; -webkit-user-select: none; }
:where(.bl-overlay[data-grabbable]) { cursor: grab; }
:where(.bl-overlay[data-grabbable]:active) { cursor: grabbing; }
:where(.bl-overlay[data-static]) { touch-action: auto; }
:where(.bl-hub-light) { stop-color: color-mix(in oklab, var(--bl-hub-color, #f1eefb) 20%, white); }
:where(.bl-hub-mid) { stop-color: var(--bl-hub-color, #f1eefb); }
:where(.bl-hub-dark) { stop-color: color-mix(in oklab, var(--bl-hub-color, #f1eefb) 78%, #2b2152); }
:where(.bl-hub) { transition: transform 0.1s; }
:where(.bl-hub-ring) {
  fill: none;
  stroke: var(--bl-hub-accent, var(--bl-frame-color, #6d5bd0));
  stroke-width: 2;
  transition: stroke 0.2s;
}
:where(.bl-hub-label) { fill: var(--bl-hub-text, #2b2152); font-weight: 800; }
:where(.bl-hub-button) {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--bl-hub-text, #2b2152);
  font: inherit;
  display: grid;
  place-items: center;
  cursor: pointer;
}
:where(.bl-hub-button:disabled) { cursor: default; }
:where(.bl-hub-button:focus-visible) { outline: 3px solid var(--bl-focus, #8fb6ff); outline-offset: 3px; }
:where(.bl-wheel:has(.bl-hub-button:hover:not(:disabled))) :where(.bl-hub-ring),
:where(.bl-wheel:has(.bl-hub-button:focus-visible)) :where(.bl-hub-ring) {
  stroke: var(--bl-indicator-color, #e5383b);
  stroke-width: 3;
}
:where(.bl-wheel:has(.bl-hub-button:active:not(:disabled))) :where(.bl-hub) { transform: scale(0.94); }
:where(.bl-wheel:has(.bl-hub-button:disabled)) :where(.bl-hub-label) { opacity: 0.45; }
:where(.bl-indicator-light) { stop-color: color-mix(in oklab, var(--bl-indicator-color, #e5383b) 70%, white); }
:where(.bl-indicator-mid) { stop-color: var(--bl-indicator-color, #e5383b); }
:where(.bl-indicator-dark) { stop-color: color-mix(in oklab, var(--bl-indicator-color, #e5383b) 65%, black); }
:where(.bl-indicator-body) {
  stroke: var(--bl-indicator-stroke, #fff);
  stroke-width: 2;
  stroke-linejoin: round;
}
:where(.bl-indicator-pin) {
  fill: var(--bl-indicator-stroke, #fff);
  stroke: color-mix(in oklab, var(--bl-indicator-color, #e5383b) 65%, black);
  stroke-width: 2;
}
:where(.bl-sr-only) {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  :where(.bl-winner) { animation: none; }
}
`;
