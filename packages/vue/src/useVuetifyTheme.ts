import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

/** Colors resolved from the active Vuetify theme's CSS custom properties. */
export interface ResolvedVuetifyColors {
  /** From --v-theme-primary, -secondary, -tertiary, -info, -success, -warning, -error. */
  palette: string[];
  /** From --v-theme-on-surface. */
  textColor?: string;
  /** on-surface at reduced opacity, for sublabels. */
  mutedColor?: string;
  /** From --v-theme-surface. */
  surface?: string;
}

const PALETTE_TOKENS = ['primary', 'secondary', 'tertiary', 'info', 'success', 'warning', 'error'];

const TRIPLET = /^\d{1,3}(,\s*\d{1,3}){2}$/;

/** Vuetify 3 stores theme colors as "R,G,B" triplets. Accept those or any CSS color. */
function toColor(value: string): string {
  return TRIPLET.test(value) ? `rgb(${value})` : value;
}

function toMuted(value: string): string | undefined {
  return TRIPLET.test(value) ? `rgba(${value}, 0.62)` : undefined;
}

/**
 * Reads the surrounding Vuetify 3 theme without importing Vuetify. Colors are
 * resolved from the --v-theme-* custom properties that Vuetify scopes under
 * its v-theme--<name> classes, so reading them off the chart's own container
 * picks up exactly the theme that applies where the chart sits.
 *
 * Theme switches are detected by observing class changes on the nearest
 * v-theme--* ancestor (and the document root as a fallback), so the chart
 * re-resolves and re-renders when the app flips between light and dark.
 *
 * Everything runs inside onMounted, so this is safe under SSR and Nuxt.
 */
export function useVuetifyTheme(
  target: Ref<HTMLElement | null>,
  enabled: () => boolean,
): { colors: Ref<ResolvedVuetifyColors | null> } {
  const colors = ref<ResolvedVuetifyColors | null>(null);
  const observers: MutationObserver[] = [];

  const resolve = (): void => {
    const el = target.value;
    if (!el) return;
    const style = el.ownerDocument.defaultView?.getComputedStyle(el);
    if (!style) return;

    const read = (token: string): string => style.getPropertyValue(`--v-theme-${token}`).trim();
    const palette = PALETTE_TOKENS.map(read).filter(Boolean).map(toColor);
    if (palette.length === 0) {
      colors.value = null;
      return;
    }
    const onSurface = read('on-surface');
    colors.value = {
      palette,
      textColor: onSurface ? toColor(onSurface) : undefined,
      mutedColor: onSurface ? toMuted(onSurface) : undefined,
      surface: read('surface') ? toColor(read('surface')) : undefined,
    };
  };

  onMounted(() => {
    if (!enabled()) return;
    resolve();

    const el = target.value;
    if (!el || typeof MutationObserver === 'undefined') return;
    const roots = new Set<Element>();
    const themed = el.closest('[class*="v-theme--"]');
    if (themed) roots.add(themed);
    roots.add(el.ownerDocument.documentElement);
    for (const root of roots) {
      const observer = new MutationObserver(resolve);
      observer.observe(root, { attributes: true, attributeFilter: ['class'] });
      observers.push(observer);
    }
  });

  onBeforeUnmount(() => {
    observers.forEach((o) => o.disconnect());
    observers.length = 0;
  });

  return { colors };
}
