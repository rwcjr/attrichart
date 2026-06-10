import type {
  AttriChartData,
  AttriChartEvent,
  AttriChartEventMap,
  AttriChartOptions,
  NodeInfo,
  RibbonInfo,
  TooltipInfo,
} from './types';
import { validateData, AttriChartError } from './validate';
import { resolveOptions, mergeOptions, type ResolvedOptions } from './options';
import {
  computeLayout,
  type ChartLayout,
  type NodeLayout,
  type RibbonLayout,
} from './layout/compute';
import { renderSVG } from './render/svg';
import { buildNodeColors } from './render/colors';
import { wireInteractions } from './render/interactions';
import { Tooltip, defaultTemplate } from './render/tooltip';

const DEFAULT_ASPECT = 560 / 1040;
const FALLBACK_WIDTH = 640;

type Listener<E extends AttriChartEvent> = (payload: AttriChartEventMap[E]) => void;

/**
 * Framework-agnostic overlapping attribution flow chart.
 *
 * ```ts
 * const chart = new AttriChart(el, data, options);
 * chart.render();
 * chart.update(newData);
 * chart.destroy();
 * ```
 */
export class AttriChart {
  private container: HTMLElement;
  private wrapper: HTMLDivElement | null = null;
  private data: AttriChartData;
  private rawOptions: AttriChartOptions;
  private options: ResolvedOptions;
  private layout: ChartLayout | null = null;
  private tooltip: Tooltip | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private lastMeasuredWidth = 0;
  private destroyed = false;
  private listeners = new Map<AttriChartEvent, Set<Listener<AttriChartEvent>>>();

  constructor(el: HTMLElement, data: AttriChartData, options: AttriChartOptions = {}) {
    if (!el || !(el instanceof HTMLElement)) {
      throw new AttriChartError('AttriChart needs a container HTMLElement.');
    }
    this.container = el;
    this.rawOptions = options;
    this.options = resolveOptions(options);
    this.data = validateData(data);
  }

  /** Draws the chart and, with width `auto`, starts observing container size. */
  render(): void {
    this.assertAlive();
    this.draw();
    this.observeResize();
  }

  /** Re-validates and redraws with new data and/or options merged over the old. */
  update(data?: AttriChartData, options?: AttriChartOptions): void {
    this.assertAlive();
    if (data) this.data = validateData(data);
    if (options) {
      this.rawOptions = mergeOptions(this.rawOptions, options);
      this.options = resolveOptions(this.rawOptions);
    }
    if (this.wrapper) {
      this.draw();
      this.observeResize();
    }
  }

  /** Removes all DOM, observers, and listeners. The instance is dead afterwards. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.tooltip?.destroy();
    this.tooltip = null;
    this.wrapper?.remove();
    this.wrapper = null;
    this.listeners.clear();
  }

  on<E extends AttriChartEvent>(event: E, handler: Listener<E>): this {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as Listener<AttriChartEvent>);
    return this;
  }

  off<E extends AttriChartEvent>(event: E, handler?: Listener<E>): this {
    if (!handler) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(handler as Listener<AttriChartEvent>);
    }
    return this;
  }

  /** The computed layout of the last render. Useful for tests and tooling. */
  getLayout(): ChartLayout | null {
    return this.layout;
  }

  private emit<E extends AttriChartEvent>(event: E, payload: AttriChartEventMap[E]): void {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }

  private assertAlive(): void {
    if (this.destroyed) {
      throw new AttriChartError('This AttriChart instance was destroyed. Create a new one.');
    }
  }

  private prefersReducedMotion(): boolean {
    if (!this.options.a11y.respectReducedMotion) return false;
    const win = this.container.ownerDocument.defaultView;
    return Boolean(win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  }

  private measure(): { width: number; height: number } {
    const width =
      this.options.width === 'auto'
        ? this.container.clientWidth || FALLBACK_WIDTH
        : this.options.width;
    const height =
      this.options.height === 'auto' ? Math.round(width * DEFAULT_ASPECT) : this.options.height;
    return { width, height };
  }

  private observeResize(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.options.width !== 'auto') return;
    const win = this.container.ownerDocument.defaultView;
    if (!win || typeof win.ResizeObserver === 'undefined') return;

    let frame = 0;
    this.resizeObserver = new win.ResizeObserver(() => {
      win.cancelAnimationFrame(frame);
      frame = win.requestAnimationFrame(() => {
        if (this.destroyed) return;
        const { width } = this.measure();
        if (width !== this.lastMeasuredWidth && width > 0) this.draw();
      });
    });
    this.resizeObserver.observe(this.container);
  }

  private draw(): void {
    const doc = this.container.ownerDocument;
    const { width, height } = this.measure();
    this.lastMeasuredWidth = width;

    this.layout = computeLayout(this.data, {
      width,
      height,
      nodeWidth: this.options.nodeWidth,
      nodeGap: this.options.nodeGap,
      padding: this.options.padding,
      attributionMode: this.options.attributionMode,
    });

    if (!this.wrapper) {
      this.wrapper = doc.createElement('div');
      this.wrapper.style.position = 'relative';
      this.wrapper.style.width = '100%';
      this.container.appendChild(this.wrapper);
    } else {
      this.tooltip?.destroy();
      this.tooltip = null;
      this.wrapper.replaceChildren();
    }

    const reducedMotion = this.prefersReducedMotion();
    const nodeColors = buildNodeColors(this.data, this.options);
    const result = renderSVG(doc, this.data, this.layout, this.options, nodeColors, (ribbon) =>
      this.ribbonInfo(ribbon),
    );
    this.wrapper.appendChild(result.svg);

    if (this.options.tooltip.enabled) {
      this.tooltip = new Tooltip(this.wrapper, reducedMotion);
    }

    wireInteractions(
      result,
      {
        isolatePath: this.options.hover.isolatePath,
        dimOpacity: this.options.hover.dimOpacity,
        reducedMotion,
      },
      {
        ribbonEnter: (ribbon, ev) =>
          this.handleHover({ kind: 'ribbon', ribbon: this.ribbonInfo(ribbon) }, ev),
        ribbonMove: (ribbon, ev) => this.moveTooltip(ev),
        ribbonLeave: () => this.handleLeave(),
        ribbonClick: (ribbon) => this.emit('ribbonClick', this.ribbonInfo(ribbon)),
        nodeEnter: (node, ev) => this.handleHover({ kind: 'node', node: this.nodeInfo(node) }, ev),
        nodeMove: (node, ev) => this.moveTooltip(ev),
        nodeLeave: () => this.handleLeave(),
        nodeClick: (node) => this.emit('nodeClick', this.nodeInfo(node)),
      },
    );
  }

  private lastTooltipHtml = '';

  private handleHover(info: TooltipInfo, ev: MouseEvent): void {
    this.emit('hover', info);
    if (this.tooltip) {
      const template = this.options.tooltip.template;
      this.lastTooltipHtml = template
        ? template(info)
        : defaultTemplate(info, this.options.labels.format);
      this.tooltip.show(this.lastTooltipHtml, ev.clientX, ev.clientY);
    }
  }

  private moveTooltip(ev: MouseEvent): void {
    this.tooltip?.show(this.lastTooltipHtml, ev.clientX, ev.clientY);
  }

  private handleLeave(): void {
    this.emit('leave', undefined);
    this.tooltip?.hide();
  }

  private ribbonInfo(ribbon: RibbonLayout): RibbonInfo {
    const record = this.data.records[ribbon.recordIndex]!;
    const sourceStage = this.data.stages.find((s) => s.id === ribbon.sourceStageId)!;
    const targetStage = this.data.stages.find((s) => s.id === ribbon.targetStageId)!;
    return {
      record,
      recordIndex: ribbon.recordIndex,
      sourceStage,
      sourceNode: sourceStage.nodes.find((n) => n.id === ribbon.sourceNodeId)!,
      targetStage,
      targetNode: targetStage.nodes.find((n) => n.id === ribbon.targetNodeId)!,
      value: record.value,
    };
  }

  private nodeInfo(node: NodeLayout): NodeInfo {
    return {
      stage: node.stage,
      node: node.node,
      value: node.value,
      isReach: node.isReach,
      records: node.recordIndices.map((i) => this.data.records[i]!),
      percent: node.percent,
    };
  }
}
