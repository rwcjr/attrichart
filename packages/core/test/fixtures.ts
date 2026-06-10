import type { AttriChartData } from '../src/types';

/**
 * The exact dataset from reference/attribution-flow.html, translated into
 * the generalized data model. Known truths:
 *
 * - unique total: 4,000
 * - reach: search 2,150 / social 2,200 / display 1,050, summing to 5,400
 * - traffic and conversion stages partition the 4,000 cleanly
 */
export const marketingData: AttriChartData = {
  stages: [
    {
      id: 'campaign',
      label: 'Campaigns',
      overlap: true,
      nodes: [
        { id: 'search', label: 'Paid Search', color: '#2563eb' },
        { id: 'social', label: 'Social', color: '#e07a2b' },
        { id: 'display', label: 'Display', color: '#129b8b' },
      ],
    },
    {
      id: 'traffic',
      label: 'Traffic type',
      nodes: [
        { id: 'product', label: 'Product Page' },
        { id: 'landing', label: 'Landing Page' },
        { id: 'blog', label: 'Blog' },
      ],
    },
    {
      id: 'conversion',
      label: 'Conversion',
      nodes: [
        { id: 'purchase', label: 'Purchase', color: '#2f9e57' },
        { id: 'lead', label: 'Lead', color: '#d99a16' },
        { id: 'none', label: 'No Conversion', color: '#9b958c' },
      ],
    },
  ],
  records: [
    {
      value: 900,
      membership: { campaign: ['search'], traffic: 'product', conversion: 'purchase' },
    },
    { value: 400, membership: { campaign: ['search'], traffic: 'landing', conversion: 'lead' } },
    { value: 700, membership: { campaign: ['social'], traffic: 'blog', conversion: 'none' } },
    { value: 350, membership: { campaign: ['social'], traffic: 'landing', conversion: 'lead' } },
    { value: 500, membership: { campaign: ['display'], traffic: 'landing', conversion: 'none' } },
    {
      value: 600,
      membership: { campaign: ['search', 'social'], traffic: 'product', conversion: 'purchase' },
    },
    {
      value: 300,
      membership: { campaign: ['social', 'display'], traffic: 'blog', conversion: 'lead' },
    },
    {
      value: 250,
      membership: {
        campaign: ['search', 'social', 'display'],
        traffic: 'product',
        conversion: 'purchase',
      },
    },
  ],
};

/** Geometry identical to the prototype's constants. */
export const prototypeConfig = {
  width: 1040,
  height: 560,
  nodeWidth: 22,
  nodeGap: 10,
  padding: { top: 14, right: 8, bottom: 14, left: 8 },
} as const;
