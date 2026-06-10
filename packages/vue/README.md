# @attrichart/vue

Vue 3 component for [AttriChart](https://github.com/rwcjr/attrichart), the overlapping attribution flow chart. Vue is a peer dependency; nothing touches the DOM until mounted, so it works under SSR and Nuxt.

```sh
npm install @attrichart/vue
```

```vue
<script setup>
import { AttriChart } from '@attrichart/vue';

const data = {
  stages: [
    { id: 'campaign', overlap: true, nodes: [{ id: 'search' }, { id: 'social' }] },
    { id: 'conversion', nodes: [{ id: 'purchase' }, { id: 'none' }] },
  ],
  records: [
    { value: 500, membership: { campaign: ['search'], conversion: 'purchase' } },
    { value: 200, membership: { campaign: ['search', 'social'], conversion: 'purchase' } },
    { value: 300, membership: { campaign: ['social'], conversion: 'none' } },
  ],
};
</script>

<template>
  <AttriChart :data="data" @node-click="(n) => console.log(n)" />
</template>
```

## Vuetify 3

Add `vuetify-theme` and the chart maps the active theme's `--v-theme-*` tokens to its palette and label colors, re-rendering on light/dark switches. No Vuetify dependency is added.

```vue
<v-card class="pa-6">
  <AttriChart :data="data" vuetify-theme />
</v-card>
```

Full documentation and the theme-token mapping: [github.com/rwcjr/attrichart](https://github.com/rwcjr/attrichart).

MIT licensed.
