import { describe, expect, it } from 'vitest';
import { validateData, AttriChartError } from '../src/validate';
import { marketingData } from './fixtures';

const base = () => JSON.parse(JSON.stringify(marketingData)) as typeof marketingData;

describe('validateData', () => {
  it('accepts the reference dataset', () => {
    expect(() => validateData(marketingData)).not.toThrow();
  });

  it('normalizes bare strings on overlap stages to arrays', () => {
    const data = base();
    data.records[0]!.membership.campaign = 'search';
    const validated = validateData(data);
    expect(validated.records[0]!.membership.campaign).toEqual(['search']);
  });

  it('normalizes single-element arrays on standard stages to strings', () => {
    const data = base();
    data.records[0]!.membership.traffic = ['product'];
    const validated = validateData(data);
    expect(validated.records[0]!.membership.traffic).toBe('product');
  });

  it('rejects fewer than two stages', () => {
    expect(() =>
      validateData({ stages: [{ id: 'only', nodes: [{ id: 'a' }] }], records: [] }),
    ).toThrow(AttriChartError);
  });

  it('rejects empty records', () => {
    const data = base();
    data.records = [];
    expect(() => validateData(data)).toThrow(/non-empty/);
  });

  it('rejects duplicate stage ids', () => {
    const data = base();
    data.stages[1]!.id = 'campaign';
    expect(() => validateData(data)).toThrow(/Duplicate stage id/);
  });

  it('rejects duplicate node ids within a stage', () => {
    const data = base();
    data.stages[0]!.nodes[1]!.id = 'search';
    expect(() => validateData(data)).toThrow(/Duplicate node id/);
  });

  it('rejects non-positive and non-finite values', () => {
    for (const value of [0, -5, NaN, Infinity]) {
      const data = base();
      data.records[0]!.value = value;
      expect(() => validateData(data)).toThrow(/finite number > 0/);
    }
  });

  it('rejects a record missing membership for a stage', () => {
    const data = base();
    delete (data.records[0]!.membership as Record<string, unknown>).traffic;
    expect(() => validateData(data)).toThrow(/no membership for stage "traffic"/);
  });

  it('rejects unknown node references', () => {
    const data = base();
    data.records[0]!.membership.traffic = 'checkout';
    expect(() => validateData(data)).toThrow(/unknown node "checkout"/);
  });

  it('rejects multi-membership on a standard stage with a helpful message', () => {
    const data = base();
    data.records[0]!.membership.traffic = ['product', 'landing'];
    expect(() => validateData(data)).toThrow(/overlap: true/);
  });

  it('rejects duplicate node ids inside one membership array', () => {
    const data = base();
    data.records[0]!.membership.campaign = ['search', 'search'];
    expect(() => validateData(data)).toThrow(/twice/);
  });

  it('rejects references to unknown stages', () => {
    const data = base();
    (data.records[0]!.membership as Record<string, string>).bogus = 'x';
    expect(() => validateData(data)).toThrow(/unknown stage "bogus"/);
  });
});
