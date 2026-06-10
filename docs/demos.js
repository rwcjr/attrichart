/* global attrichart */
const { AttriChart } = attrichart;

const marketing = {
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
        { id: 'product', label: 'Product Page', color: '#3c3a36' },
        { id: 'landing', label: 'Landing Page', color: '#3c3a36' },
        { id: 'blog', label: 'Blog', color: '#3c3a36' },
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

const streaming = {
  stages: [
    {
      id: 'device',
      label: 'Signup device',
      nodes: [
        { id: 'mobile', label: 'Mobile', color: '#8b5cf6' },
        { id: 'desktop', label: 'Desktop', color: '#2563eb' },
        { id: 'tv', label: 'TV', color: '#129b8b' },
      ],
    },
    {
      id: 'genres',
      label: 'Genres watched',
      overlap: true,
      nodes: [
        { id: 'drama', label: 'Drama', color: '#d94862' },
        { id: 'comedy', label: 'Comedy', color: '#e07a2b' },
        { id: 'docs', label: 'Documentary', color: '#d99a16' },
      ],
    },
    {
      id: 'plan',
      label: 'Plan',
      nodes: [
        { id: 'free', label: 'Free', color: '#9b958c' },
        { id: 'standard', label: 'Standard', color: '#3c3a36' },
        { id: 'premium', label: 'Premium', color: '#1c1b19' },
      ],
    },
    {
      id: 'outcome',
      label: 'Renewal',
      nodes: [
        { id: 'renewed', label: 'Renewed', color: '#2f9e57' },
        { id: 'churned', label: 'Churned', color: '#d94862' },
      ],
    },
  ],
  records: [
    {
      value: 300,
      membership: { device: 'mobile', genres: ['drama'], plan: 'free', outcome: 'churned' },
    },
    {
      value: 260,
      membership: {
        device: 'mobile',
        genres: ['drama', 'comedy'],
        plan: 'standard',
        outcome: 'renewed',
      },
    },
    {
      value: 220,
      membership: { device: 'desktop', genres: ['comedy'], plan: 'standard', outcome: 'renewed' },
    },
    {
      value: 140,
      membership: { device: 'desktop', genres: ['docs'], plan: 'premium', outcome: 'renewed' },
    },
    {
      value: 180,
      membership: { device: 'tv', genres: ['drama', 'docs'], plan: 'premium', outcome: 'renewed' },
    },
    {
      value: 160,
      membership: { device: 'tv', genres: ['comedy'], plan: 'free', outcome: 'churned' },
    },
    {
      value: 90,
      membership: {
        device: 'mobile',
        genres: ['drama', 'comedy', 'docs'],
        plan: 'premium',
        outcome: 'renewed',
      },
    },
    {
      value: 150,
      membership: { device: 'desktop', genres: ['drama'], plan: 'standard', outcome: 'churned' },
    },
  ],
};

new AttriChart(document.getElementById('demo-reach'), marketing, {
  a11y: { label: 'Campaign attribution flow, reach mode' },
}).render();

new AttriChart(document.getElementById('demo-fractional'), marketing, {
  attributionMode: 'fractional',
  a11y: { label: 'Campaign attribution flow, fractional mode' },
}).render();

new AttriChart(document.getElementById('demo-stages'), streaming, {
  a11y: { label: 'Streaming service journey across four stages' },
}).render();
