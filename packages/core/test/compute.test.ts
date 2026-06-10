import { describe, expect, it } from 'vitest';
import { computeLayout, computeTotals } from '../src/layout/compute';
import { validateData } from '../src/validate';
import { marketingData, prototypeConfig } from './fixtures';

const data = validateData(marketingData);

const reachConfig = { ...prototypeConfig, attributionMode: 'reach' as const };
const fractionalConfig = { ...prototypeConfig, attributionMode: 'fractional' as const };

// Prototype constants: drawH = 560 - 28 = 532, two gaps of 10 per column.
const DRAW_H = 532;
const PX = (DRAW_H - 20) / 5400;

describe('computeTotals', () => {
  it('matches the prototype unique total of 4,000', () => {
    expect(computeTotals(data).uniqueTotal).toBe(4000);
  });

  it('matches the prototype reach per campaign and 5,400 reach total', () => {
    const totals = computeTotals(data);
    expect(totals.nodeReach.campaign).toEqual({ search: 2150, social: 2200, display: 1050 });
    expect(totals.stageReachTotal.campaign).toBe(5400);
  });

  it('keeps standard stages at the unique total', () => {
    const totals = computeTotals(data);
    expect(totals.stageReachTotal.traffic).toBe(4000);
    expect(totals.stageReachTotal.conversion).toBe(4000);
    expect(totals.nodeReach.traffic).toEqual({ product: 1750, landing: 1250, blog: 1000 });
    expect(totals.nodeReach.conversion).toEqual({ purchase: 1750, lead: 1050, none: 1200 });
  });
});

describe('computeLayout, reach mode (prototype parity)', () => {
  const layout = computeLayout(data, reachConfig);

  it('derives the prototype pixel scale from the reach column', () => {
    expect(layout.pxPerUnit).toBeCloseTo(PX, 10);
  });

  it('places columns at the prototype x positions', () => {
    expect(layout.stageX).toEqual([8, 509, 1010]);
  });

  it('fills the full drawing height with the overlap column', () => {
    const campaignNodes = layout.nodes.filter((n) => n.stage.id === 'campaign');
    const barHeight = campaignNodes.reduce((s, n) => s + (n.yBot - n.yTop), 0);
    expect(barHeight).toBeCloseTo(5400 * PX, 8);
    const first = campaignNodes[0]!;
    const last = campaignNodes[campaignNodes.length - 1]!;
    expect(first.yTop).toBeCloseTo(14, 8);
    expect(last.yBot).toBeCloseTo(14 + DRAW_H, 8);
  });

  it('sizes each campaign bar by reach', () => {
    const byId = Object.fromEntries(
      layout.nodes.filter((n) => n.stage.id === 'campaign').map((n) => [n.node.id, n]),
    );
    expect(byId.search!.yBot - byId.search!.yTop).toBeCloseTo(2150 * PX, 8);
    expect(byId.social!.yBot - byId.social!.yTop).toBeCloseTo(2200 * PX, 8);
    expect(byId.display!.yBot - byId.display!.yTop).toBeCloseTo(1050 * PX, 8);
    expect(byId.search!.isReach).toBe(true);
    expect(byId.search!.value).toBe(2150);
  });

  it('consolidates standard stages to true unique counts and centers them', () => {
    const traffic = layout.nodes.filter((n) => n.stage.id === 'traffic');
    const total = traffic.reduce((s, n) => s + n.value, 0);
    expect(total).toBe(4000);
    const colHeight = 4000 * PX + 20;
    expect(traffic[0]!.yTop).toBeCloseTo(14 + (DRAW_H - colHeight) / 2, 8);
    const purchase = layout.nodes.find((n) => n.node.id === 'purchase')!;
    expect(purchase.percent).toBeCloseTo(1750 / 4000, 10);
    expect(purchase.isReach).toBe(false);
  });

  it('emits one ribbon per membership on the overlap hop and one per record after', () => {
    const hop0 = layout.ribbons.filter((r) => r.hopIndex === 0);
    const hop1 = layout.ribbons.filter((r) => r.hopIndex === 1);
    // memberships: 1+1+1+1+1+2+2+3 = 12
    expect(hop0).toHaveLength(12);
    expect(hop1).toHaveLength(8);
  });

  it('gives shared records full width from every source node', () => {
    // record index 7: 250 users in all three campaigns
    const shared = layout.ribbons.filter((r) => r.hopIndex === 0 && r.recordIndex === 7);
    expect(shared).toHaveLength(3);
    for (const ribbon of shared) {
      expect(ribbon.width).toBeCloseTo(250 * PX, 8);
    }
    // all three converge on the identical target band
    const targets = new Set(shared.map((r) => r.y1.toFixed(6)));
    expect(targets.size).toBe(1);
  });
});

describe('computeLayout, fractional mode', () => {
  const layout = computeLayout(data, fractionalConfig);

  it('makes the overlap column strictly additive at the unique total', () => {
    const campaigns = layout.nodes.filter((n) => n.stage.id === 'campaign');
    const total = campaigns.reduce((s, n) => s + n.value, 0);
    expect(total).toBeCloseTo(4000, 8);
    expect(campaigns[0]!.isReach).toBe(false);
  });

  it('splits a shared record evenly across its source nodes', () => {
    const shared = layout.ribbons.filter((r) => r.hopIndex === 0 && r.recordIndex === 7);
    expect(shared).toHaveLength(3);
    const px = layout.pxPerUnit;
    for (const ribbon of shared) {
      expect(ribbon.width).toBeCloseTo((250 / 3) * px, 8);
    }
  });

  it('stacks fanned ribbons side by side inside the target band, no overlap', () => {
    const shared = layout.ribbons
      .filter((r) => r.hopIndex === 0 && r.recordIndex === 7)
      .sort((a, b) => a.y1 - b.y1);
    for (let i = 1; i < shared.length; i++) {
      expect(shared[i]!.y1).toBeCloseTo(shared[i - 1]!.y1 + shared[i - 1]!.width, 8);
    }
  });

  it('keeps ribbon widths additive into every standard node', () => {
    for (const node of layout.nodes.filter((n) => n.stage.id === 'traffic')) {
      const incoming = layout.ribbons
        .filter((r) => r.hopIndex === 0 && r.targetNodeId === node.node.id)
        .reduce((s, r) => s + r.width, 0);
      expect(incoming).toBeCloseTo(node.yBot - node.yTop, 8);
    }
  });

  it('uses a larger pixel scale because no column holds reach', () => {
    expect(layout.pxPerUnit).toBeCloseTo((DRAW_H - 20) / 4000, 10);
  });
});

describe('computeLayout, generalized shapes', () => {
  it('supports overlap on a middle stage of a four-stage chart', () => {
    const fourStage = validateData({
      stages: [
        { id: 's1', nodes: [{ id: 'a' }, { id: 'b' }] },
        { id: 's2', overlap: true, nodes: [{ id: 'x' }, { id: 'y' }] },
        { id: 's3', nodes: [{ id: 'm' }, { id: 'n' }] },
        { id: 's4', nodes: [{ id: 'p' }, { id: 'q' }] },
      ],
      records: [
        { value: 100, membership: { s1: 'a', s2: ['x', 'y'], s3: 'm', s4: 'p' } },
        { value: 50, membership: { s1: 'b', s2: ['y'], s3: 'n', s4: 'q' } },
      ],
    });
    const layout = computeLayout(fourStage, { ...prototypeConfig, attributionMode: 'reach' });
    // hop into the overlap stage fans out, hop out of it fans in
    expect(layout.ribbons.filter((r) => r.hopIndex === 0)).toHaveLength(3);
    expect(layout.ribbons.filter((r) => r.hopIndex === 1)).toHaveLength(3);
    expect(layout.ribbons.filter((r) => r.hopIndex === 2)).toHaveLength(2);
    const y = layout.nodes.find((n) => n.stage.id === 's2' && n.node.id === 'y')!;
    expect(y.isReach).toBe(true);
    expect(y.value).toBe(150);
  });

  it('handles two stages, both standard', () => {
    const tiny = validateData({
      stages: [
        { id: 'from', nodes: [{ id: 'a' }] },
        { id: 'to', nodes: [{ id: 'b' }, { id: 'c' }] },
      ],
      records: [
        { value: 10, membership: { from: 'a', to: 'b' } },
        { value: 30, membership: { from: 'a', to: 'c' } },
      ],
    });
    const layout = computeLayout(tiny, { ...prototypeConfig, attributionMode: 'reach' });
    expect(layout.ribbons).toHaveLength(2);
    expect(layout.uniqueTotal).toBe(40);
    const a = layout.nodes.find((n) => n.node.id === 'a')!;
    expect(a.percent).toBe(1);
  });
});
