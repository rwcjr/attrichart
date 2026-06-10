<template>
  <v-app>
    <v-main>
      <v-container style="max-width: 1100px">
        <v-row>
          <v-col cols="12">
            <v-card class="pa-6">
              <div class="d-flex align-center justify-space-between mb-2 flex-wrap ga-4">
                <div>
                  <h2 class="text-h5 mb-1">Campaign attribution</h2>
                  <p class="text-body-2 text-medium-emphasis mb-0" style="max-width: 560px">
                    The chart reads node colors and label colors from the active Vuetify theme and
                    re-renders when it changes. Toggle the theme to see it follow.
                  </p>
                </div>
                <v-btn variant="tonal" @click="toggleTheme">
                  Switch to {{ theme.global.current.value.dark ? 'light' : 'dark' }} theme
                </v-btn>
              </div>
              <AttriChart :data="data" :options="options" vuetify-theme @node-click="onNodeClick" />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useTheme } from 'vuetify';
import { AttriChart } from '@attrichart/vue';

const theme = useTheme();

function toggleTheme() {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark';
}

function onNodeClick(node) {
  console.log('node clicked:', node.node.id, node.value);
}

const options = {
  a11y: { label: 'Campaign attribution flow' },
};

// Node colors are intentionally omitted so the Vuetify theme palette applies.
const data = {
  stages: [
    {
      id: 'campaign',
      label: 'Campaigns',
      overlap: true,
      nodes: [
        { id: 'search', label: 'Paid Search' },
        { id: 'social', label: 'Social' },
        { id: 'display', label: 'Display' },
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
        { id: 'purchase', label: 'Purchase' },
        { id: 'lead', label: 'Lead' },
        { id: 'none', label: 'No Conversion' },
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
</script>
