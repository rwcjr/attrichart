# @attrichart/react

React component for [AttriChart](https://github.com/rwcjr/attrichart), the overlapping attribution flow chart. React 18 or 19 is a peer dependency; all DOM work happens in effects, so it is safe under SSR frameworks like Next.js.

```sh
npm install @attrichart/react
```

```tsx
import { AttriChart } from '@attrichart/react';

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

export function Dashboard() {
  return <AttriChart data={data} onNodeClick={(node) => console.log(node)} />;
}
```

## Props

| Prop                 | Type                           | Notes                                       |
| -------------------- | ------------------------------ | ------------------------------------------- |
| `data`               | `AttriChartData`               | Required. Stages plus records.              |
| `options`            | `AttriChartOptions`            | Everything from the core options reference. |
| `onNodeClick`        | `(node: NodeInfo) => void`     |                                             |
| `onRibbonClick`      | `(ribbon: RibbonInfo) => void` |                                             |
| `onHover`            | `(info: TooltipInfo) => void`  |                                             |
| `onLeave`            | `() => void`                   |                                             |
| `className`, `style` |                                | Applied to the wrapping div.                |

The chart updates in place when `data` or `options` change identity, so define them at module scope or memoize with `useMemo`; an inline object literal recreates the chart's input on every render. Handler props may change freely.

Full documentation and the options reference: [github.com/rwcjr/attrichart](https://github.com/rwcjr/attrichart).

MIT licensed.
