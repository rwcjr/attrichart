# Contributing to AttriChart

Thanks for your interest. This document covers the workflow; for what the library is and how it works, start with the README and `reference/attribution-flow.html`, the vanilla prototype the engine was ported from.

## Setup

```sh
pnpm install
pnpm build
pnpm test
```

Requires Node 18+ and pnpm.

## Repository layout

- `packages/core`: the framework-agnostic engine. Layout math lives in `src/layout` and is pure (no DOM), rendering in `src/render`.
- `packages/vue`: the Vue 3 wrapper and Vuetify theme integration.
- `packages/react`: the React wrapper.
- `examples/`: runnable HTML and Vue examples.
- `docs/`: the demo site deployed to GitHub Pages.

## Development workflow

1. Fork and branch from `main`.
2. Make your change. New layout behavior needs a test in `packages/core/test`; the suite validates against known numbers from the reference prototype (4,000 unique users, 5,400 reach).
3. Run the full check locally:

```sh
pnpm lint && pnpm build && pnpm typecheck && pnpm test
```

4. Add a changeset describing your change:

```sh
pnpm changeset
```

5. Open a pull request. CI runs the same checks.

## Code style

ESLint and Prettier are configured; run `pnpm format` before committing. TypeScript is strict mode and should stay that way. Avoid adding runtime dependencies to `@attrichart/core`; the zero-dependency core is a feature.

## Reporting bugs

Use the bug report issue template. A minimal dataset that reproduces the problem (stages plus a handful of records) makes fixes much faster.

## Releases

Maintainers release through Changesets. See RELEASING.md for the process, including manual publish steps.
