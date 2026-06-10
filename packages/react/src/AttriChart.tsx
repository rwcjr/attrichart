import { useEffect, useRef, type CSSProperties } from 'react';
import {
  AttriChart as CoreChart,
  type AttriChartData,
  type AttriChartOptions,
  type NodeInfo,
  type RibbonInfo,
  type TooltipInfo,
} from '@attrichart/core';

export interface AttriChartProps {
  data: AttriChartData;
  options?: AttriChartOptions;
  onNodeClick?: (node: NodeInfo) => void;
  onRibbonClick?: (ribbon: RibbonInfo) => void;
  onHover?: (info: TooltipInfo) => void;
  onLeave?: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * React wrapper around @attrichart/core.
 *
 * The chart mounts once and updates in place when `data` or `options`
 * change identity, so memoize them (useMemo or module scope) rather than
 * recreating them inline on every render. Handlers are kept in a ref and
 * may change freely without touching the chart. All DOM work happens in
 * useEffect, so the component is SSR-safe.
 */
export function AttriChart({
  data,
  options,
  onNodeClick,
  onRibbonClick,
  onHover,
  onLeave,
  className,
  style,
}: AttriChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const chart = useRef<CoreChart | null>(null);

  const handlers = useRef({ onNodeClick, onRibbonClick, onHover, onLeave });
  handlers.current = { onNodeClick, onRibbonClick, onHover, onLeave };

  // Mount once; props are read through refs on later passes.
  const initial = useRef({ data, options });
  initial.current = { data, options };

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const instance = new CoreChart(el, initial.current.data, initial.current.options);
    instance
      .on('nodeClick', (payload) => handlers.current.onNodeClick?.(payload))
      .on('ribbonClick', (payload) => handlers.current.onRibbonClick?.(payload))
      .on('hover', (payload) => handlers.current.onHover?.(payload))
      .on('leave', () => handlers.current.onLeave?.());
    instance.render();
    chart.current = instance;
    return () => {
      instance.destroy();
      chart.current = null;
    };
  }, []);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    chart.current?.update(data, options);
  }, [data, options]);

  return <div ref={container} className={className} style={{ width: '100%', ...style }} />;
}
