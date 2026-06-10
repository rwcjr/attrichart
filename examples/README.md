# Examples

Build the library first from the repo root:

```sh
pnpm install
pnpm build
```

## demo.html

Three charts on one page: the marketing attribution example in reach mode, the same data in fractional mode, and a four-stage journey with the overlap stage in the middle. Open the file directly in a browser after building.

## vanilla/

The smallest possible usage: one script tag, one chart, a click handler. Open `vanilla/index.html` after building.

## vue-vuetify/

A Vuetify 3 app with the chart inside a `v-card`, bound to the active Vuetify theme, with a light/dark toggle. Run it with:

```sh
pnpm --filter attrichart-example-vue-vuetify dev
```
