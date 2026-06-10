import type { AttriChartOptions } from './types';

export interface ResolvedOptions {
  width: number | 'auto';
  height: number | 'auto';
  attributionMode: 'reach' | 'fractional';
  nodeWidth: number;
  nodeGap: number;
  padding: { top: number; right: number; bottom: number; left: number };
  colors: Required<Pick<NonNullable<AttriChartOptions['colors']>, 'palette'>> &
    NonNullable<AttriChartOptions['colors']>;
  ribbonOpacity: number;
  font: { family: string; size: number; color: string; mutedColor: string };
  labels: {
    show: boolean;
    values: boolean;
    percent: boolean;
    format: (value: number) => string;
  };
  tooltip: { enabled: boolean; template?: NonNullable<AttriChartOptions['tooltip']>['template'] };
  hover: { isolatePath: boolean; dimOpacity: number };
  a11y: { label: string; respectReducedMotion: boolean };
}

export const DEFAULT_PALETTE = [
  '#2563eb',
  '#e07a2b',
  '#129b8b',
  '#8b5cf6',
  '#d94862',
  '#d99a16',
  '#2f9e57',
  '#9b958c',
];

const defaultFormat = (value: number): string => value.toLocaleString();

export function resolveOptions(options: AttriChartOptions = {}): ResolvedOptions {
  return {
    width: options.width ?? 'auto',
    height: options.height ?? 'auto',
    attributionMode: options.attributionMode ?? 'reach',
    nodeWidth: options.nodeWidth ?? 22,
    nodeGap: options.nodeGap ?? 10,
    padding: {
      top: options.padding?.top ?? 14,
      right: options.padding?.right ?? 8,
      bottom: options.padding?.bottom ?? 14,
      left: options.padding?.left ?? 8,
    },
    colors: {
      palette: options.colors?.palette ?? DEFAULT_PALETTE,
      node: options.colors?.node,
      ribbon: options.colors?.ribbon,
    },
    ribbonOpacity: options.ribbonOpacity ?? 0.4,
    font: {
      family: options.font?.family ?? 'inherit',
      size: options.font?.size ?? 12.5,
      color: options.font?.color ?? 'currentColor',
      mutedColor: options.font?.mutedColor ?? '',
    },
    labels: {
      show: options.labels?.show ?? true,
      values: options.labels?.values ?? true,
      percent: options.labels?.percent ?? true,
      format: options.labels?.format ?? defaultFormat,
    },
    tooltip: {
      enabled: options.tooltip?.enabled ?? true,
      template: options.tooltip?.template,
    },
    hover: {
      isolatePath: options.hover?.isolatePath ?? true,
      dimOpacity: options.hover?.dimOpacity ?? 0.06,
    },
    a11y: {
      label: options.a11y?.label ?? 'Attribution flow chart',
      respectReducedMotion: options.a11y?.respectReducedMotion ?? true,
    },
  };
}

/** Merge a partial options object over an existing one (used by update()). */
export function mergeOptions(
  base: AttriChartOptions,
  patch: AttriChartOptions = {},
): AttriChartOptions {
  return {
    ...base,
    ...patch,
    padding: { ...base.padding, ...patch.padding },
    colors: { ...base.colors, ...patch.colors },
    font: { ...base.font, ...patch.font },
    labels: { ...base.labels, ...patch.labels },
    tooltip: { ...base.tooltip, ...patch.tooltip },
    hover: { ...base.hover, ...patch.hover },
    a11y: { ...base.a11y, ...patch.a11y },
  };
}
