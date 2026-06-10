import { describe, expect, it } from 'vitest';
import { ribbonPath } from '../src/layout/ribbon';

describe('ribbonPath', () => {
  it('builds the prototype path shape: bezier top edge, line, mirrored bottom edge', () => {
    const d = ribbonPath(30, 100, 509, 200, 50);
    // midpoint x = 30 + (509 - 30) / 2 = 269.5
    expect(d).toBe('M30,100 C269.5,100 269.5,200 509,200 L509,250 C269.5,250 269.5,150 30,150 Z');
  });

  it('keeps constant width between the two edges', () => {
    const d = ribbonPath(0, 10, 100, 40, 25);
    expect(d).toContain('L100,65');
    expect(d.endsWith('0,35 Z')).toBe(true);
  });
});
