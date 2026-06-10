// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { AttriChart } from '../src/AttriChart';
import { AttriChartError } from '../src/validate';
import { marketingData } from './fixtures';

function mount(): HTMLElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

describe('AttriChart rendering', () => {
  it('renders an svg with all ribbons, bars, and labels', () => {
    const el = mount();
    const chart = new AttriChart(el, marketingData, { width: 1040, height: 560 });
    chart.render();

    const svg = el.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('role')).toBe('img');
    // 12 overlap-hop ribbons + 8 consolidated ribbons
    expect(el.querySelectorAll('path')).toHaveLength(20);
    // 9 node bars
    expect(el.querySelectorAll('rect')).toHaveLength(9);
    expect(svg!.textContent).toContain('Paid Search');
    expect(svg!.textContent).toMatch(/2,?150 reach/);
    chart.destroy();
  });

  it('update() swaps attribution mode in place', () => {
    const el = mount();
    const chart = new AttriChart(el, marketingData, { width: 1040, height: 560 });
    chart.render();
    chart.update(undefined, { attributionMode: 'fractional' });
    // fractional campaign column is additive, so the reach suffix disappears
    expect(el.querySelector('svg')!.textContent).not.toMatch(/reach/);
    expect(chart.getLayout()!.pxPerUnit).toBeCloseTo((560 - 28 - 20) / 4000, 10);
    chart.destroy();
  });

  it('destroy() removes everything and bricks the instance', () => {
    const el = mount();
    const chart = new AttriChart(el, marketingData, { width: 800, height: 400 });
    chart.render();
    chart.destroy();
    expect(el.children).toHaveLength(0);
    expect(() => chart.render()).toThrow(AttriChartError);
  });

  it('emits nodeClick with resolved payloads', () => {
    const el = mount();
    const chart = new AttriChart(el, marketingData, { width: 1040, height: 560 });
    const clicks: string[] = [];
    chart.on('nodeClick', (node) => clicks.push(`${node.node.id}:${node.value}`));
    chart.render();

    const firstBar = el.querySelector('rect')!.parentElement as unknown as SVGGElement;
    firstBar.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clicks).toEqual(['search:2150']);
    chart.destroy();
  });

  it('rejects a missing container with a clear error', () => {
    expect(() => new AttriChart(null as unknown as HTMLElement, marketingData)).toThrow(
      /container/,
    );
  });
});
