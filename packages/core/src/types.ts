/**
 * A node inside a stage, for example one campaign, one traffic type,
 * or one conversion outcome.
 */
export interface NodeDefinition {
  /** Unique within its stage. */
  id: string;
  /** Display label. Defaults to the id. */
  label?: string;
  /** Any CSS color. Wins over the palette and the color hook. */
  color?: string;
}

/**
 * One column of the chart. Stages are rendered left to right in array order.
 */
export interface StageDefinition {
  /** Unique across stages. Records reference this id in their membership map. */
  id: string;
  /** Display label shown as the column heading. Defaults to the id. */
  label?: string;
  /**
   * When true, records may belong to several nodes in this stage at once.
   * The stage renders reach, so its segments may sum past 100% of the
   * unique total. Defaults to false (a clean partition).
   */
  overlap?: boolean;
  nodes: NodeDefinition[];
}

/**
 * A cohort: every unit of `value` shares the exact same path through all stages.
 */
export interface FlowRecord {
  /** Optional stable identity, surfaced in events and tooltips. */
  id?: string;
  /** Size of the cohort. Must be a finite number greater than zero. */
  value: number;
  /**
   * stageId to nodeId. Overlap stages accept an array of nodeIds;
   * standard stages take exactly one nodeId.
   */
  membership: Record<string, string | string[]>;
}

export interface AttriChartData {
  /** Ordered left to right. At least two stages are required. */
  stages: StageDefinition[];
  records: FlowRecord[];
}

/**
 * How shared records are drawn on overlap stages.
 *
 * - `reach`: a shared record carries its full width into every node that
 *   contains it. Translucent ribbons stack and darken where membership
 *   overlaps. Overlap-stage segments sum past 100%.
 * - `fractional`: a shared record splits its width evenly across its nodes
 *   so every column stays strictly additive. No overlap darkening.
 */
export type AttributionMode = 'reach' | 'fractional';

export interface ColorOptions {
  /** Cycled per stage for nodes without an explicit color. */
  palette?: string[];
  /** Hook to compute a node color. Wins over the palette, loses to node.color. */
  node?: (node: NodeDefinition, stage: StageDefinition) => string;
  /**
   * Which end of a hop colors its ribbons. The default follows the
   * prototype: `source` when the hop leaves an overlap stage, otherwise
   * `target`.
   */
  ribbon?: 'source' | 'target' | ((info: RibbonInfo) => string);
}

export interface FontOptions {
  /** Defaults to `inherit` so the chart picks up the surrounding theme. */
  family?: string;
  /** Label size in px. Sublabels render slightly smaller. */
  size?: number;
  /** Label color. Defaults to `currentColor`. */
  color?: string;
  /** Sublabel color. Defaults to the label color at reduced opacity. */
  mutedColor?: string;
}

export interface LabelOptions {
  show?: boolean;
  /** Show counts under node labels. */
  values?: boolean;
  /** Show percent of the unique total on standard stages. */
  percent?: boolean;
  /** Number formatter for counts. Defaults to toLocaleString. */
  format?: (value: number) => string;
}

export interface TooltipOptions {
  enabled?: boolean;
  /** Returns HTML. Receives the hovered ribbon or node. */
  template?: (info: TooltipInfo) => string;
}

export interface HoverOptions {
  /** Dim everything except the hovered record's full path. */
  isolatePath?: boolean;
  /** Opacity of dimmed ribbons while a path is isolated. */
  dimOpacity?: number;
}

export interface A11yOptions {
  /** aria-label for the SVG. A generic default is provided. */
  label?: string;
  /** Disable transitions when the user prefers reduced motion. */
  respectReducedMotion?: boolean;
}

export interface PaddingOptions {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface AttriChartOptions {
  /** `auto` (default) fills the container and re-lays out on resize. */
  width?: number | 'auto';
  /** `auto` (default) derives height from width at a 0.54 aspect ratio. */
  height?: number | 'auto';
  attributionMode?: AttributionMode;
  /** Width of the node bars in px. */
  nodeWidth?: number;
  /** Vertical gap between nodes in a column, in px. */
  nodeGap?: number;
  padding?: PaddingOptions;
  colors?: ColorOptions;
  /** Base opacity of ribbons leaving an overlap stage. */
  ribbonOpacity?: number;
  font?: FontOptions;
  labels?: LabelOptions;
  tooltip?: TooltipOptions;
  hover?: HoverOptions;
  a11y?: A11yOptions;
}

/** A ribbon between two adjacent stages, resolved for events and hooks. */
export interface RibbonInfo {
  record: FlowRecord;
  recordIndex: number;
  sourceStage: StageDefinition;
  sourceNode: NodeDefinition;
  targetStage: StageDefinition;
  targetNode: NodeDefinition;
  /** The record's full value. In fractional mode ribbons draw a share of it. */
  value: number;
}

/** A node, resolved for events and hooks. */
export interface NodeInfo {
  stage: StageDefinition;
  node: NodeDefinition;
  /** Reach on overlap stages, true unique count on standard stages. */
  value: number;
  /** True when `value` is reach rather than a unique count. */
  isReach: boolean;
  /** Records that touch this node. */
  records: FlowRecord[];
  /** Share of the unique total. Only meaningful on standard stages. */
  percent: number;
}

export type TooltipInfo = { kind: 'ribbon'; ribbon: RibbonInfo } | { kind: 'node'; node: NodeInfo };

export interface AttriChartEventMap {
  nodeClick: NodeInfo;
  ribbonClick: RibbonInfo;
  hover: TooltipInfo;
  leave: void;
}

export type AttriChartEvent = keyof AttriChartEventMap;
