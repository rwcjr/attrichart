# @attrichart/react

Planned React wrapper for [@attrichart/core](../core). Not yet implemented.

The package is marked `private` so it cannot be published by accident. Until it ships, use `@attrichart/core` directly in React:

```tsx
import { useEffect, useRef } from 'react';
import { AttriChart } from '@attrichart/core';

function Chart({ data, options }) {
  const el = useRef(null);

  useEffect(() => {
    const chart = new AttriChart(el.current, data, options);
    chart.render();
    return () => chart.destroy();
  }, [data, options]);

  return <div ref={el} style={{ width: '100%' }} />;
}
```

Contributions welcome. The Vue wrapper in `packages/vue` is the reference for scope: props for data and options, events for node click, ribbon click, and hover, and container-driven responsive sizing.
