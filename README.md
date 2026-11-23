# Fortune Wheel

A physics-driven, fully themable prize wheel for React, with RTL and Persian support. It's published as [`react-physics-wheel`](packages/react-physics-wheel).

**[Live demo and playground →](https://alirezahematidev.github.io/fortune-wheel/)** (English and فارسی)

| Path                                                           | What it is                                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`packages/react-physics-wheel`](packages/react-physics-wheel) | The library. See its [README](packages/react-physics-wheel/README.md) for usage and the full API. |
| [`apps/demo`](apps/demo)                                       | The playground deployed to GitHub Pages. It exposes every option and generates matching code.     |

## Development

Requirements: Node 20.19+ (see `.nvmrc`) and pnpm (the version is pinned in `package.json`).

```sh
pnpm install
pnpm dev          # demo at http://localhost:5173, hot-reloading the library from source
```

| Script                                           | What it does                                            |
| ------------------------------------------------ | ------------------------------------------------------- |
| `pnpm check`                                     | Format check, lint, type-check and tests (what CI runs) |
| `pnpm test`                                      | Unit tests (vitest)                                     |
| `pnpm lint`                                      | oxlint (`pnpm lint:fix` to auto-fix)                    |
| `pnpm format`                                    | oxfmt (`pnpm format:check` to verify)                   |
| `pnpm build`                                     | Builds the library (tsdown) and the demo (Vite)         |
| `pnpm --filter react-physics-wheel lint:package` | Validates the package with publint and arethetypeswrong |

## Releasing

Releases are driven by [release-it](https://github.com/release-it/release-it) with
[Conventional Commits](https://www.conventionalcommits.org/). Each release bumps the version, updates
`CHANGELOG.md`, commits `chore(release): vX.Y.Z`, tags `vX.Y.Z`, pushes, creates a GitHub release and
publishes to npm. Before publishing it runs `pnpm check`, builds, and validates the package.

**From your machine** (on `main`, with a clean working tree):

```sh
npm login                          # once
export GITHUB_TOKEN=$(gh auth token)
pnpm release                       # interactive: pick patch / minor / major
pnpm release minor --ci            # or non-interactive
pnpm release --dry-run             # see what would happen
```

**From GitHub Actions:** run the **Release** workflow and pick the increment. It publishes with npm
provenance and needs one of:

- npm [trusted publishing](https://docs.npmjs.com/trusted-publishers): on npmjs.com, add this repository and the `release.yml` workflow as a trusted publisher for `react-physics-wheel` (recommended, no secrets needed), or
- an `NPM_TOKEN` repository secret holding an npm automation token.

The demo is redeployed to GitHub Pages on every push to `main` (`.github/workflows/pages.yml`).

## License

[MIT](LICENSE)
