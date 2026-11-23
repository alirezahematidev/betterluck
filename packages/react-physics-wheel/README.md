# react-physics-wheel

A physics-driven, fully themable prize wheel ("wheel of fortune") for React, with first-class **RTL and Persian** support.

**[Live demo and playground →](https://alirezahematidev.github.io/fortune-wheel/)**

- **Real physics.** The wheel spins up under torque, then coasts against axle friction and air drag. A spring-loaded flapper is knocked around by the rim's pegs and ticks as each one passes. You can also grab the wheel and flick it.
- **Fair, or decided by you.** Results are weighted by `frequency` using a CSPRNG, or forced with `spin({ index })` (for example, when your server picks the reward). Either way, the motion is solved so the wheel stops on the result. Nothing snaps into place at the end.
- **Labels never overlap or overflow.** Each slice shows `[image] title` along its radius, with the image toward the hub. Labels share one font size, long titles truncate per grapheme, and nothing renders below a readable pixel size. They adapt to the wheel's real rendered diameter.
- **Persian and RTL support.** Text direction is detected per label. Text shapes and reorders correctly, with ZWNJ-aware truncation and fonts measured from your own CSS.
- **Themable.** Props for the frame, pegs, indicator (three shapes or your own SVG), hub and labels, plus `className`/`style`, per-part `classNames`/`styles` and `--rpw-*` CSS variables.
- **Light and SSR-safe.** No dependencies, about 19 kB gzipped. Styles ship inside the component, and the bundle is marked `"use client"`.

## Install

```sh
pnpm add react-physics-wheel
# or: npm i react-physics-wheel / yarn add react-physics-wheel
```

You need React 18.2 or newer. The package is ESM-only.

## Quick start

```tsx
import { useRef } from "react";
import { FortuneWheel, type FortuneWheelHandle, type Segment } from "react-physics-wheel";

const segments: Segment[] = [
  { title: "100 Coins", reward: "100 coins", frequency: 20, color: "#ef476f", image: "/coin.svg" },
  { title: "Try Again", reward: "", frequency: 60, color: "#06d6a0" },
  { title: "Jackpot", reward: "1,000 coins", frequency: 1, color: "#7b2cbf", image: "/crown.svg" },
];

export function Prize() {
  const wheel = useRef<FortuneWheelHandle>(null);
  return (
    <>
      <FortuneWheel
        ref={wheel}
        segments={segments}
        size={420}
        onSpinEnd={({ segment }) => alert(`You won: ${segment.reward}`)}
      />
      <button onClick={() => wheel.current?.spin()}>Spin</button>
    </>
  );
}
```

Players can spin by clicking the hub, by flicking the wheel, or through your own button via the ref.

## Segments

| Field       | Type                | Notes                                                                             |
| ----------- | ------------------- | --------------------------------------------------------------------------------- |
| `title`     | `string`            | Drawn on the slice. It shrinks to fit, then truncates with `…`.                   |
| `reward`    | `string`            | Returned in results; not drawn.                                                   |
| `frequency` | `number`            | Relative weight. `0` never wins (and gets no slice with `sizing="proportional"`). |
| `color`     | `string`            | Slice fill, any CSS color. Hex colors also choose a readable label color.         |
| `textColor` | `string?`           | Label color for this slice.                                                       |
| `image`     | `string?`           | URL or data URL, drawn beside the title, toward the hub.                          |
| `id`        | `string \| number?` | Stable React key.                                                                 |

## Props

| Prop                   | Default       | Description                                                                                                    |
| ---------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| `segments`             | required      | `Segment[]`                                                                                                    |
| `size`                 | fill width    | Wheel diameter: a pixel number or any CSS length (`"60vmin"`). It never overflows its container.               |
| `sizing`               | `"equal"`     | `"equal"` slices, or `"proportional"` to frequency.                                                            |
| `spinDirection`        | `"clockwise"` | Or `"counterclockwise"`. Flicks go whichever way they're thrown.                                               |
| `physics`              | see below     | `Partial<WheelPhysics>`                                                                                        |
| `frame`                |               | [Frame options](#frame)                                                                                        |
| `indicator`            |               | [Indicator options](#indicator)                                                                                |
| `hub`                  |               | [Hub options](#hub)                                                                                            |
| `labels`               |               | [Label options](#labels)                                                                                       |
| `sound`                | `true`        | Synthesized peg ticks (Web Audio, no assets).                                                                  |
| `allowFlick`           | `true`        | Grab-and-flick to spin.                                                                                        |
| `disabled`             | `false`       | Blocks the hub, flicks and `spin()`.                                                                           |
| `className`, `style`   |               | Applied to the root. Use them for the font, CSS variables and so on.                                           |
| `classNames`, `styles` |               | Per part: `root`, `disc`, `slice`, `label`, `image`, `frame`, `peg`, `winner`, `hub`, `hubLabel`, `indicator`. |
| `aria-label`           |               | Accessible name of the wheel.                                                                                  |
| `announce`             | title, reward | `(result) => string` read to screen readers when a spin ends, or `false` for none.                             |
| `nonce`                |               | Nonce for the built-in `<style>` tag under a strict CSP.                                                       |
| `onSpinStart`          |               | `(result) => void`. Fires at launch with the segment it **will** land on.                                      |
| `onSpinEnd`            |               | `(result) => void`. Fires when the wheel comes to rest.                                                        |
| `onTick`               |               | Fires as each peg passes the indicator (haptics, custom sounds).                                               |

**Ref:** `spin(options?)` starts a spin. It returns `false` if the wheel is busy, disabled, or nothing can win. Pass `spin({ index })` to choose the landing segment. `isSpinning()` reports whether a spin is in progress.

### Sizing and units

`size` sets the wheel's diameter. If you leave it out, the wheel fills its container's width. The indicator may stick out past the diameter on its side, and the element reserves space for it.

Lengths in `frame`, `hub`, `indicator` and `labels` use **wheel units**: the wheel is 500 units across, scaled to whatever size it renders at. Labels also track the real pixel size. Text never renders below `labels.minFontPx` (default 9px) and images never below `labels.minImagePx` (default 12px). On a small wheel, long titles truncate first, then hide.

### Frame

| Option         | Default | Description                                          |
| -------------- | ------- | ---------------------------------------------------- |
| `width`        | `24`    | Rim thickness. `0` removes the rim.                  |
| `color`        |         | Rim color (shaded automatically).                    |
| `pegs`         | `true`  | Pegs that push the indicator.                        |
| `pegColor`     |         |                                                      |
| `pegSize`      | `4.5`   | Peg radius; shrinks automatically on crowded wheels. |
| `dividerColor` |         | Lines between slices.                                |
| `dividerWidth` | `1.5`   | `0` removes them.                                    |
| `shading`      | `true`  | Soft shading toward the rim.                         |

### Indicator

| Option     | Default | Description                                                                     |
| ---------- | ------- | ------------------------------------------------------------------------------- |
| `position` | `"top"` | `"top" \| "right" \| "bottom" \| "left"`, or degrees clockwise from 12 o'clock. |
| `shape`    | `"pin"` | `"pin" \| "triangle" \| "needle"`                                               |
| `color`    |         | Body color (shaded automatically).                                              |
| `size`     | `1`     | Scale. This also lengthens the indicator's physical arm.                        |
| `flap`     | `true`  | Let pegs push it around. With `false` it holds still but still ticks.           |
| `render`   |         | `({ tip, scale }) => ReactNode` to draw your own SVG indicator.                 |

A custom indicator is drawn in its own frame. The hinge is at the origin, and the indicator points down (+y) toward the wheel with its tip at `y = tip`:

```tsx
<FortuneWheel
  segments={segments}
  indicator={{
    render: ({ tip }) => <path d={`M-12 -6 L12 -6 L0 ${tip} Z`} fill="gold" stroke="#000" />,
  }}
/>
```

### Hub

| Option      | Default  | Description                                                                 |
| ----------- | -------- | --------------------------------------------------------------------------- |
| `label`     | `"SPIN"` | Strings are auto-fitted. Any other React node renders as-is (e.g. an icon). |
| `radius`    | `40`     | `0` hides the hub.                                                          |
| `color`     |          | Face color.                                                                 |
| `textColor` |          |                                                                             |
| `clickable` | `true`   | Clicking the hub spins.                                                     |
| `ariaLabel` |          | Accessible name of the hub button.                                          |

### Labels

| Option         | Default  | Description                                                                      |
| -------------- | -------- | -------------------------------------------------------------------------------- |
| `color`        | auto     | One color for all labels; otherwise automatic contrast per slice.                |
| `direction`    | `"auto"` | `"auto"` detects per label from its first strong character, or `"ltr" \| "rtl"`. |
| `maxFontSize`  | `24`     | In wheel units.                                                                  |
| `minFontPx`    | `9`      | Readability floor in CSS pixels.                                                 |
| `minImagePx`   | `12`     |                                                                                  |
| `imageScale`   | `1.9`    | Image size relative to the font size.                                            |
| `maxImageSize` | `52`     | In wheel units.                                                                  |
| `uniform`      | `true`   | One shared font size for all labels.                                             |
| `inset`        | `12`     | Gap between labels and the rim.                                                  |

## Persian and RTL

Labels in Persian (and other right-to-left scripts) just work. Each label's base direction is detected from its first strong character, so mixed content like `۱۰۰ سکه` or `100 سکه` orders correctly. Truncation never splits a grapheme or leaves a dangling ZWNJ. To use a Persian font, set it on the wheel:

```tsx
<FortuneWheel
  segments={[
    { title: "۱۰۰ سکه", reward: "۱۰۰ سکه", frequency: 3, color: "#ef476f" },
    { title: "جایزه‌ی بزرگ", reward: "۱۰۰۰ سکه", frequency: 1, color: "#7b2cbf" },
  ]}
  hub={{ label: "بچرخان", ariaLabel: "چرخاندن گردونه" }}
  announce={({ segment }) => `نتیجه: ${segment.title}`}
  style={{ fontFamily: "Vazirmatn, sans-serif" }}
/>
```

The wheel measures text in the font it actually renders with, including fonts from your classes, and it re-measures when web fonts finish loading.

## Styling

Default styles are wrapped in `:where()`, so they have zero specificity. Any class you pass wins without `!important`:

```css
.my-wheel {
  font-family: "Nunito", sans-serif;
  --rpw-label-weight: 800;
  --rpw-label-color: #fff;
  --rpw-label-halo: transparent;
  --rpw-frame-color: #6b4a12;
  --rpw-peg-color: #ffe08a;
  --rpw-indicator-color: #f5b700;
  --rpw-shadow: none;
}
```

| Variable                                                  | Controls                                    |
| --------------------------------------------------------- | ------------------------------------------- |
| `--rpw-font`                                              | Label and hub font family                   |
| `--rpw-label-color`                                       | Every label (default: automatic contrast)   |
| `--rpw-label-light` / `--rpw-label-dark`                  | Automatic label colors (`#fff` / `#1c1733`) |
| `--rpw-label-weight`                                      | Label weight (`700`)                        |
| `--rpw-label-halo`                                        | Outline around labels                       |
| `--rpw-frame-color`                                       | Rim                                         |
| `--rpw-peg-color`                                         | Pegs                                        |
| `--rpw-divider-color` / `--rpw-divider-width`             | Lines between slices                        |
| `--rpw-hub-color` / `--rpw-hub-accent` / `--rpw-hub-text` | Hub                                         |
| `--rpw-indicator-color` / `--rpw-indicator-stroke`        | Indicator                                   |
| `--rpw-winner-color`                                      | Highlight on the winning slice              |
| `--rpw-shadow`                                            | Drop shadow under the wheel                 |
| `--rpw-focus`                                             | Hub focus ring                              |

The `frame`, `indicator`, `hub` and `labels` color props set these same variables.

## Physics

**The winner is chosen first, and the motion is solved to land there.** A rest spot inside the winning slice is chosen at random, away from its edges, and the motion is planned to stop exactly on it.

- **Spin.** A constant torque spins the wheel up for `spinUpTime`. It then coasts under `dω/dt = −μ − k·ω`: dry friction `μ` plus air drag `k·ω`. The equation has a closed-form solution, so every frame reads the exact trajectory, with no integration drift and no frame-rate dependence. A random launch speed sets how long the spin lasts. The planner then solves for the speed that ends on the target, so friction stays as configured.
- **Flick.** The release speed comes from the drag. Here the friction is scaled instead: multiplying `μ` and `k` by the same factor replays the same deceleration curve faster or slower, so the coast distance changes exactly while the motion still looks natural.
- **Indicator.** A damped spring hinge with an end stop. Pegs are solid circles, and a peg only gets past once it has pushed the tip high enough to slip under it.
- **Rendering.** The disc is its own compositor layer, rotated with a CSS transform, so it is rasterized once and turned on the GPU. React doesn't re-render during a spin.

| `WheelPhysics`   | Default | Unit   |
| ---------------- | ------- | ------ |
| `spinUpTime`     | 0.45    | s      |
| `friction` (μ)   | 0.9     | rad/s² |
| `drag` (k)       | 0.32    | 1/s    |
| `minLaunchSpeed` | 15      | rad/s  |
| `maxLaunchSpeed` | 22      | rad/s  |
| `flickThreshold` | 4       | rad/s  |

`estimateSpin(physics)` returns the average duration and number of turns, which is handy when tuning.

## Server rendering

The component renders on the server. Its styles are inlined, layout-critical styles are inline, and nothing touches `window` during render. The bundle starts with `"use client"`, so it works directly in the Next.js App Router.

## Browser support

The package targets evergreen browsers (Chrome/Edge 111+, Firefox 121+, Safari 16.4+) and relies on `color-mix()`, `:has()` and `ResizeObserver`.

## License

MIT
