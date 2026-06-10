# Releasing

Releases use [Changesets](https://github.com/changesets/changesets) with semantic versioning.

## Standard flow

1. Every user-facing PR includes a changeset (`pnpm changeset`).
2. When ready to release, version the packages:

```sh
pnpm version-packages   # applies changesets, bumps versions, writes changelogs
git add -A && git commit -m "Version packages"
```

3. Tag and push. Pushing a `v*` tag triggers the release workflow, which builds, tests, and publishes to npm:

```sh
git tag v0.1.0
git push origin main --tags
```

The workflow needs an `NPM_TOKEN` repository secret with publish rights to the `@attrichart` npm org.

## Manual publish

If you need to publish by hand:

```sh
pnpm install
pnpm lint && pnpm build && pnpm typecheck && pnpm test
npm login            # account with access to the attrichart org
cd packages/core && npm publish --access public
cd ../vue && npm publish --access public
```

Publish `core` before `vue` so the new core version exists when vue's dependency resolves.

## First-time npm org setup

1. Create the org once: `npm org create attrichart` (or via npmjs.com, Add Organization, name `attrichart`, free public scope).
2. Both packages declare `"publishConfig": { "access": "public" }`, so scoped publishes work without extra flags.
3. Generate an automation token (npmjs.com, Access Tokens, type Automation) and save it as the `NPM_TOKEN` secret in the GitHub repo settings.
