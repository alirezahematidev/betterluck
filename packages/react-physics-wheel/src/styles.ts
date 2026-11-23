/**
 * Default look. Every selector is wrapped in `:where()` so it has zero specificity: any class you
 * pass through `className` / `classNames` wins without `!important`. Colors come from CSS custom
 * properties, which the `frame`, `indicator`, `hub` and `labels` props set — or you can set them
 * yourself in CSS:
 *
 *   --rpw-font            label + hub font family
 *   --rpw-label-color     label color (default: automatic contrast per slice)
 *   --rpw-label-light     light label color for dark slices (#fff)
 *   --rpw-label-dark      dark label color for light slices (#1c1733)
 *   --rpw-label-weight    label font weight (700)
 *   --rpw-label-halo      outline around labels, e.g. `transparent` to remove
 *   --rpw-frame-color     rim
 *   --rpw-peg-color       pegs
 *   --rpw-divider-color   lines between slices
 *   --rpw-divider-width
 *   --rpw-hub-color       hub face
 *   --rpw-hub-accent      hub ring
 *   --rpw-hub-text        hub label
 *   --rpw-indicator-color indicator body
 *   --rpw-indicator-stroke indicator outline
 *   --rpw-winner-color    highlight on the winning slice
 *   --rpw-shadow          drop shadow under the wheel
 *   --rpw-focus           focus ring
 */
export const WHEEL_CSS = `
:where(.rpw) {
  width: 100%;
  font-family: var(--rpw-font, ui-rounded, "SF Pro Rounded", system-ui, -apple-system, "Segoe UI", Roboto, Vazirmatn, Tahoma, sans-serif);
  -webkit-tap-highlight-color: transparent;
}
:where(.rpw-disc) {
  border-radius: 50%;
  box-shadow: var(--rpw-shadow, 0 18px 40px rgb(0 0 0 / 0.4), 0 0 0 1px rgb(0 0 0 / 0.2));
}
:where(.rpw-frame-inner) { stop-color: color-mix(in oklab, var(--rpw-frame-color, #4a3784) 82%, black); }
:where(.rpw-frame-mid) { stop-color: color-mix(in oklab, var(--rpw-frame-color, #4a3784) 78%, white); }
:where(.rpw-frame-outer) { stop-color: color-mix(in oklab, var(--rpw-frame-color, #4a3784) 60%, black); }
:where(.rpw-peg-light) { stop-color: color-mix(in oklab, var(--rpw-peg-color, #ffcf4a) 30%, white); }
:where(.rpw-peg-mid) { stop-color: var(--rpw-peg-color, #ffcf4a); }
:where(.rpw-peg-dark) { stop-color: color-mix(in oklab, var(--rpw-peg-color, #ffcf4a) 62%, black); }
:where(.rpw-peg) { stroke: rgb(0 0 0 / 0.35); stroke-width: 0.75; }
:where(.rpw-slice) {
  stroke: var(--rpw-divider-color, rgb(255 255 255 / 0.4));
  stroke-width: var(--rpw-divider-width, 1.5);
  stroke-linejoin: round;
}
:where(.rpw-empty) { fill: color-mix(in oklab, var(--rpw-frame-color, #4a3784) 50%, #888); }
:where(.rpw-rim-line) { fill: none; stroke: rgb(0 0 0 / 0.3); stroke-width: 2; }
:where(.rpw-label) {
  font-weight: var(--rpw-label-weight, 700);
  fill: var(--rpw-label-color, var(--rpw-label-auto));
  stroke: var(--rpw-label-halo, var(--rpw-label-auto-halo));
  stroke-width: 0.1em;
  stroke-linejoin: round;
  paint-order: stroke;
}
:where(.rpw-image) { filter: drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.35)); }
:where(.rpw-winner) {
  fill: var(--rpw-winner-color, #fff);
  stroke: var(--rpw-winner-color, #fff);
  stroke-width: 3;
  animation: rpw-pulse 1.1s ease-in-out infinite;
}
@keyframes rpw-pulse {
  0%, 100% { fill-opacity: 0; stroke-opacity: 0.9; }
  50% { fill-opacity: 0.28; stroke-opacity: 0.4; }
}
:where(.rpw-overlay) { touch-action: none; user-select: none; -webkit-user-select: none; }
:where(.rpw-overlay[data-grabbable]) { cursor: grab; }
:where(.rpw-overlay[data-grabbable]:active) { cursor: grabbing; }
:where(.rpw-overlay[data-static]) { touch-action: auto; }
:where(.rpw-hub-light) { stop-color: color-mix(in oklab, var(--rpw-hub-color, #f1eefb) 20%, white); }
:where(.rpw-hub-mid) { stop-color: var(--rpw-hub-color, #f1eefb); }
:where(.rpw-hub-dark) { stop-color: color-mix(in oklab, var(--rpw-hub-color, #f1eefb) 78%, #2b2152); }
:where(.rpw-hub) { transition: transform 0.1s; }
:where(.rpw-hub-ring) {
  fill: none;
  stroke: var(--rpw-hub-accent, var(--rpw-frame-color, #6d5bd0));
  stroke-width: 2;
  transition: stroke 0.2s;
}
:where(.rpw-hub-label) { fill: var(--rpw-hub-text, #2b2152); font-weight: 800; }
:where(.rpw-hub-button) {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--rpw-hub-text, #2b2152);
  font: inherit;
  display: grid;
  place-items: center;
  cursor: pointer;
}
:where(.rpw-hub-button:disabled) { cursor: default; }
:where(.rpw-hub-button:focus-visible) { outline: 3px solid var(--rpw-focus, #8fb6ff); outline-offset: 3px; }
:where(.rpw:has(.rpw-hub-button:hover:not(:disabled))) :where(.rpw-hub-ring),
:where(.rpw:has(.rpw-hub-button:focus-visible)) :where(.rpw-hub-ring) {
  stroke: var(--rpw-indicator-color, #e5383b);
  stroke-width: 3;
}
:where(.rpw:has(.rpw-hub-button:active:not(:disabled))) :where(.rpw-hub) { transform: scale(0.94); }
:where(.rpw:has(.rpw-hub-button:disabled)) :where(.rpw-hub-label) { opacity: 0.45; }
:where(.rpw-indicator-light) { stop-color: color-mix(in oklab, var(--rpw-indicator-color, #e5383b) 70%, white); }
:where(.rpw-indicator-mid) { stop-color: var(--rpw-indicator-color, #e5383b); }
:where(.rpw-indicator-dark) { stop-color: color-mix(in oklab, var(--rpw-indicator-color, #e5383b) 65%, black); }
:where(.rpw-indicator-body) {
  stroke: var(--rpw-indicator-stroke, #fff);
  stroke-width: 2;
  stroke-linejoin: round;
}
:where(.rpw-indicator-pin) {
  fill: var(--rpw-indicator-stroke, #fff);
  stroke: color-mix(in oklab, var(--rpw-indicator-color, #e5383b) 65%, black);
  stroke-width: 2;
}
:where(.rpw-sr-only) {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  :where(.rpw-winner) { animation: none; fill-opacity: 0.2; }
}
`;
