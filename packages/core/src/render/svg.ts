import type { AttriChartData, RibbonInfo } from '../types';
import type { ResolvedOptions } from '../options';
import type { ChartLayout, NodeLayout, RibbonLayout } from '../layout/compute';
import { ribbonPath } from '../layout/ribbon';
import { ribbonColor } from './colors';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface RenderResult {
  svg: SVGSVGElement;
  ribbonEls: Array<{ el: SVGPathElement; ribbon: RibbonLayout }>;
  nodeEls: Array<{ el: SVGGElement; node: NodeLayout }>;
}

function svgEl<K extends keyof SVGElementTagNameMap>(
  doc: Document,
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const el = doc.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

export function renderSVG(
  doc: Document,
  data: AttriChartData,
  layout: ChartLayout,
  options: ResolvedOptions,
  nodeColors: Map<string, string>,
  ribbonInfoFor: (ribbon: RibbonLayout) => RibbonInfo,
): RenderResult {
  const svg = svgEl(doc, 'svg', {
    viewBox: `0 0 ${layout.width} ${layout.height}`,
    role: 'img',
    'aria-label': options.a11y.label,
  });
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.display = 'block';
  svg.style.fontFamily = options.font.family;

  const desc = svgEl(doc, 'desc');
  desc.textContent =
    `Flow chart with ${data.stages.length} stages and a unique total of ` +
    `${options.labels.format(layout.uniqueTotal)}.`;
  svg.appendChild(desc);

  // Ribbons first so node bars and labels render above them.
  const ribbonGroup = svgEl(doc, 'g');
  const ribbonEls: RenderResult['ribbonEls'] = [];
  for (const ribbon of layout.ribbons) {
    const info = ribbonInfoFor(ribbon);
    const fromOverlap = info.sourceStage.overlap && options.attributionMode === 'reach';
    const opacity = fromOverlap ? options.ribbonOpacity : Math.min(options.ribbonOpacity + 0.1, 1);
    const el = svgEl(doc, 'path', {
      d: ribbonPath(ribbon.x0, ribbon.y0, ribbon.x1, ribbon.y1, ribbon.width),
      fill: ribbonColor(ribbon, info, nodeColors, options),
      'fill-opacity': opacity,
      'data-record': ribbon.recordIndex,
      'aria-hidden': 'true',
    });
    el.style.cursor = 'pointer';
    ribbonGroup.appendChild(el);
    ribbonEls.push({ el, ribbon });
  }
  svg.appendChild(ribbonGroup);

  // Node bars and labels.
  const nodeEls: RenderResult['nodeEls'] = [];
  for (const node of layout.nodes) {
    const g = svgEl(doc, 'g');
    const color = nodeColors.get(`${node.stage.id}:${node.node.id}`)!;
    const rect = svgEl(doc, 'rect', {
      x: node.x,
      y: node.yTop,
      width: options.nodeWidth,
      height: Math.max(node.yBot - node.yTop, 0),
      rx: 3,
      fill: color,
      stroke: 'rgba(0, 0, 0, 0.12)',
      'stroke-width': 1,
    });
    rect.style.cursor = 'pointer';
    g.appendChild(rect);

    if (options.labels.show) {
      const onRight = node.stageIndex === 0;
      const x = onRight ? node.x + options.nodeWidth + 8 : node.x - 8;
      const anchor = onRight ? 'start' : 'end';
      const cy = (node.yTop + node.yBot) / 2;

      const label = svgEl(doc, 'text', {
        x,
        y: cy - 2,
        'text-anchor': anchor,
        'font-size': options.font.size,
        'font-weight': 600,
        fill: options.font.color,
      });
      label.textContent = node.node.label ?? node.node.id;
      g.appendChild(label);

      if (options.labels.values) {
        const sub = svgEl(doc, 'text', {
          x,
          y: cy + 13,
          'text-anchor': anchor,
          'font-size': Math.max(options.font.size - 1.5, 8),
          fill: options.font.mutedColor || options.font.color,
        });
        if (!options.font.mutedColor) sub.setAttribute('fill-opacity', '0.62');
        const count = options.labels.format(node.value);
        sub.textContent = node.isReach
          ? `${count} reach`
          : options.labels.percent
            ? `${count} · ${Math.round(node.percent * 100)}%`
            : count;
        g.appendChild(sub);
      }
    }

    const labelText = node.node.label ?? node.node.id;
    const valueText = node.isReach
      ? `${options.labels.format(node.value)} reach`
      : options.labels.format(node.value);
    g.setAttribute('role', 'graphics-symbol');
    g.setAttribute('aria-label', `${labelText}: ${valueText}`);

    svg.appendChild(g);
    nodeEls.push({ el: g, node });
  }

  return { svg, ribbonEls, nodeEls };
}
