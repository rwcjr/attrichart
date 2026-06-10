import type { TooltipInfo } from '../types';

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Self-contained tooltip. Every style is inline so nothing leaks into or out
 * of the host page. Lives inside the chart's own wrapper element.
 */
export class Tooltip {
  private el: HTMLDivElement;
  private host: HTMLElement;

  constructor(host: HTMLElement, reducedMotion: boolean) {
    this.host = host;
    this.el = host.ownerDocument.createElement('div');
    const s = this.el.style;
    s.position = 'absolute';
    s.pointerEvents = 'none';
    s.opacity = '0';
    s.left = '0';
    s.top = '0';
    s.zIndex = '10';
    s.background = 'rgba(28, 27, 25, 0.92)';
    s.color = '#ffffff';
    s.fontFamily = 'inherit';
    s.fontSize = '12px';
    s.lineHeight = '1.45';
    s.padding = '6px 10px';
    s.borderRadius = '6px';
    s.whiteSpace = 'nowrap';
    s.transform = 'translate(-50%, calc(-100% - 10px))';
    if (!reducedMotion) s.transition = 'opacity 120ms ease';
    this.el.setAttribute('aria-hidden', 'true');
    host.appendChild(this.el);
  }

  show(html: string, clientX: number, clientY: number): void {
    const rect = this.host.getBoundingClientRect();
    this.el.innerHTML = html;
    this.el.style.left = `${clientX - rect.left}px`;
    this.el.style.top = `${clientY - rect.top}px`;
    this.el.style.opacity = '1';
  }

  hide(): void {
    this.el.style.opacity = '0';
  }

  destroy(): void {
    this.el.remove();
  }
}

/** Default tooltip body when no custom template is supplied. */
export function defaultTemplate(info: TooltipInfo, format: (v: number) => string): string {
  if (info.kind === 'node') {
    const n = info.node;
    const label = escapeHtml(n.node.label ?? n.node.id);
    const detail = n.isReach
      ? `${format(n.value)} reach`
      : `${format(n.value)} (${Math.round(n.percent * 100)}%)`;
    return `<strong>${label}</strong><br>${detail}`;
  }
  const r = info.ribbon;
  const from = escapeHtml(r.sourceNode.label ?? r.sourceNode.id);
  const to = escapeHtml(r.targetNode.label ?? r.targetNode.id);
  const head = r.record.id ? `<strong>${escapeHtml(r.record.id)}</strong><br>` : '';
  return `${head}${from} &rarr; ${to}<br>${format(r.value)}`;
}
