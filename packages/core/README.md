# @attrichart/core

A Sankey-style flow chart for journeys with overlapping membership, rendered in plain SVG with zero runtime dependencies.

Standard Sankey diagrams force every unit onto exactly one path. AttriChart lets one stage allow multi-membership: that stage renders reach (segments may sum past 100%), shared records are drawn from every node that contains them, the translucent ribbons darken where they stack, and downstream stages consolidate to true unique counts.

```sh
npm install @attrichart/core
```

```js
import { AttriChart } from '@attrichart/core';

const chart = new AttriChart(document.querySelector('#chart'), {
  stages: [
    { id: 'campaign', overlap: true, nodes: [{ id: 'search' }, { id: 'social' }] },
    { id: 'conversion', nodes: [{ id: 'purchase' }, { id: 'none' }] },
  ],
  records: [
    { value: 500, membership: { campaign: ['search'], conversion: 'purchase' } },
    { value: 200, membership: { campaign: ['search', 'social'], conversion: 'purchase' } },
    { value: 300, membership: { campaign: ['social'], conversion: 'none' } },
  ],
});
chart.render();
```

Full documentation, a live demo, options reference, and framework wrappers: [github.com/rwcjr/attrichart](https://github.com/rwcjr/attrichart).

MIT licensed.
