// Renders the marketing attribution example headlessly and writes docs/hero.svg.
// Run after building core: node packages/core/scripts/make-hero.mjs
import { writeFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { AttriChart } from '../dist/index.js';

const window = new Window();
globalThis.HTMLElement = window.HTMLElement;

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

const el = window.document.createElement('div');
window.document.body.appendChild(el);

new AttriChart(el, marketing, {
  width: 1040,
  height: 560,
  font: { family: 'system-ui, sans-serif', color: '#1c1b19' },
  a11y: { label: 'Campaign attribution flow: campaigns to traffic type to conversion' },
}).render();

const svg = el.querySelector('svg');
svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
writeFileSync(new URL('../../../docs/hero.svg', import.meta.url), svg.outerHTML + '\n');
console.log('wrote docs/hero.svg');
