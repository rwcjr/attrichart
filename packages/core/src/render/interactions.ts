import type { NodeLayout, RibbonLayout } from '../layout/compute';
import type { RenderResult } from './svg';

export interface InteractionConfig {
  isolatePath: boolean;
  dimOpacity: number;
  reducedMotion: boolean;
}

export interface InteractionHandlers {
  ribbonEnter(ribbon: RibbonLayout, ev: MouseEvent): void;
  ribbonMove(ribbon: RibbonLayout, ev: MouseEvent): void;
  ribbonLeave(ribbon: RibbonLayout, ev: MouseEvent): void;
  ribbonClick(ribbon: RibbonLayout, ev: MouseEvent): void;
  nodeEnter(node: NodeLayout, ev: MouseEvent): void;
  nodeMove(node: NodeLayout, ev: MouseEvent): void;
  nodeLeave(node: NodeLayout, ev: MouseEvent): void;
  nodeClick(node: NodeLayout, ev: MouseEvent): void;
}

/**
 * Wires hover and click behavior onto a freshly rendered SVG. Hovering a
 * ribbon isolates the full path of its record across every hop: all other
 * ribbons dim, the record's ribbons brighten. Listeners die with the SVG,
 * so re-rendering needs no explicit teardown.
 */
export function wireInteractions(
  result: RenderResult,
  config: InteractionConfig,
  handlers: InteractionHandlers,
): void {
  const { ribbonEls, nodeEls } = result;
  const transition = config.reducedMotion ? 'none' : 'opacity 140ms ease';

  const isolate = (recordIndex: number): void => {
    for (const { el, ribbon } of ribbonEls) {
      el.style.opacity = ribbon.recordIndex === recordIndex ? '0.95' : String(config.dimOpacity);
    }
  };
  const release = (): void => {
    for (const { el } of ribbonEls) el.style.opacity = '';
  };

  for (const entry of ribbonEls) {
    const { el, ribbon } = entry;
    el.style.transition = transition;
    el.addEventListener('mouseenter', (ev) => {
      if (config.isolatePath) isolate(ribbon.recordIndex);
      handlers.ribbonEnter(ribbon, ev);
    });
    el.addEventListener('mousemove', (ev) => handlers.ribbonMove(ribbon, ev));
    el.addEventListener('mouseleave', (ev) => {
      if (config.isolatePath) release();
      handlers.ribbonLeave(ribbon, ev);
    });
    el.addEventListener('click', (ev) => handlers.ribbonClick(ribbon, ev));
  }

  for (const entry of nodeEls) {
    const { el, node } = entry;
    el.addEventListener('mouseenter', (ev) => handlers.nodeEnter(node, ev));
    el.addEventListener('mousemove', (ev) => handlers.nodeMove(node, ev));
    el.addEventListener('mouseleave', (ev) => handlers.nodeLeave(node, ev));
    el.addEventListener('click', (ev) => handlers.nodeClick(node, ev));
  }
}
