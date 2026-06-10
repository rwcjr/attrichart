import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue';
import {
  AttriChart as CoreChart,
  type AttriChartData,
  type AttriChartOptions,
  type NodeInfo,
  type RibbonInfo,
  type TooltipInfo,
} from '@attrichart/core';
import { useVuetifyTheme } from './useVuetifyTheme';

/** Explicit theme override. Wins over `vuetify-theme` resolution. */
export interface ChartTheme {
  palette?: string[];
  textColor?: string;
  mutedColor?: string;
}

/**
 * Vue 3 wrapper around @attrichart/core.
 *
 * All DOM work happens in onMounted, so the component imports and renders
 * cleanly under SSR (Nuxt). With `vuetify-theme` set, node colors and label
 * colors come from the surrounding Vuetify theme and follow light/dark
 * switches at runtime. Theme-derived values only fill option slots the
 * caller left unset, so explicit options always win.
 */
export const AttriChart = defineComponent({
  name: 'AttriChart',
  props: {
    data: { type: Object as PropType<AttriChartData>, required: true },
    options: { type: Object as PropType<AttriChartOptions>, default: () => ({}) },
    /** Read --v-theme-* custom properties and re-render on theme switches. */
    vuetifyTheme: { type: Boolean, default: false },
    /** Explicit colors. Wins over vuetifyTheme. */
    theme: { type: Object as PropType<ChartTheme | null>, default: null },
  },
  emits: {
    'node-click': (_payload: NodeInfo) => true,
    'ribbon-click': (_payload: RibbonInfo) => true,
    hover: (_payload: TooltipInfo) => true,
    leave: () => true,
  },
  setup(props, { emit, expose }) {
    const container = ref<HTMLElement | null>(null);
    let chart: CoreChart | null = null;

    const vuetify = useVuetifyTheme(container, () => props.vuetifyTheme);

    const themedOptions = (): AttriChartOptions => {
      const base = props.options;
      const palette = props.theme?.palette ?? base.colors?.palette ?? vuetify.colors.value?.palette;
      const textColor =
        props.theme?.textColor ?? base.font?.color ?? vuetify.colors.value?.textColor;
      const mutedColor =
        props.theme?.mutedColor ?? base.font?.mutedColor ?? vuetify.colors.value?.mutedColor;
      return {
        ...base,
        colors: { ...base.colors, ...(palette ? { palette } : {}) },
        font: {
          ...base.font,
          ...(textColor ? { color: textColor } : {}),
          ...(mutedColor ? { mutedColor } : {}),
        },
      };
    };

    onMounted(() => {
      if (!container.value) return;
      chart = new CoreChart(container.value, props.data, themedOptions());
      chart
        .on('nodeClick', (payload) => emit('node-click', payload))
        .on('ribbonClick', (payload) => emit('ribbon-click', payload))
        .on('hover', (payload) => emit('hover', payload))
        .on('leave', () => emit('leave'));
      chart.render();
    });

    watch(
      () => props.data,
      (data) => chart?.update(data),
      { deep: true },
    );
    watch(
      [() => props.options, () => props.theme, vuetify.colors],
      () => chart?.update(undefined, themedOptions()),
      { deep: true },
    );

    onBeforeUnmount(() => {
      chart?.destroy();
      chart = null;
    });

    expose({
      /** The underlying core instance, for getLayout() and friends. */
      chart: () => chart,
    });

    return () => h('div', { ref: container, style: { width: '100%' } });
  },
});
