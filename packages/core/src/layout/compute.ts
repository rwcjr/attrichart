import type {
  AttriChartData,
  AttributionMode,
  FlowRecord,
  NodeDefinition,
  StageDefinition,
} from '../types';

export interface LayoutConfig {
  width: number;
  height: number;
  nodeWidth: number;
  nodeGap: number;
  padding: { top: number; right: number; bottom: number; left: number };
  attributionMode: AttributionMode;
}

export interface NodeLayout {
  stage: StageDefinition;
  stageIndex: number;
  node: NodeDefinition;
  x: number;
  yTop: number;
  yBot: number;
  /** Sum of full values of records touching this node. */
  reach: number;
  /** What the bar height represents: reach in reach mode on overlap stages, additive otherwise. */
  value: number;
  /** True when value is reach (may exceed the unique total). */
  isReach: boolean;
  /** value / uniqueTotal. */
  percent: number;
  recordIndices: number[];
}

export interface RibbonLayout {
  recordIndex: number;
  /** Index of the source stage; the hop goes to stage hopIndex + 1. */
  hopIndex: number;
  sourceStageId: string;
  sourceNodeId: string;
  targetStageId: string;
  targetNodeId: string;
  /** Right edge of the source node bar. */
  x0: number;
  /** Top of the ribbon at the source end. */
  y0: number;
  /** Left edge of the target node bar. */
  x1: number;
  /** Top of the ribbon at the target end. */
  y1: number;
  width: number;
}

export interface ChartLayout {
  width: number;
  height: number;
  pxPerUnit: number;
  uniqueTotal: number;
  nodes: NodeLayout[];
  ribbons: RibbonLayout[];
  /** Left x of each stage's node bars, by stage index. */
  stageX: number[];
}

export interface Totals {
  uniqueTotal: number;
  /** stageId -> nodeId -> reach. */
  nodeReach: Record<string, Record<string, number>>;
  /** stageId -> reach total (equals uniqueTotal on standard stages). */
  stageReachTotal: Record<string, number>;
}

/** Membership of a record in a stage, always as an array. */
export function membershipOf(record: FlowRecord, stage: StageDefinition): string[] {
  const raw = record.membership[stage.id];
  if (raw === undefined) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export function computeTotals(data: AttriChartData): Totals {
  const uniqueTotal = data.records.reduce((sum, r) => sum + r.value, 0);
  const nodeReach: Totals['nodeReach'] = {};
  const stageReachTotal: Totals['stageReachTotal'] = {};

  for (const stage of data.stages) {
    const byNode: Record<string, number> = {};
    for (const node of stage.nodes) byNode[node.id] = 0;
    let stageTotal = 0;
    for (const record of data.records) {
      for (const nodeId of membershipOf(record, stage)) {
        byNode[nodeId] = (byNode[nodeId] ?? 0) + record.value;
        stageTotal += record.value;
      }
    }
    nodeReach[stage.id] = byNode;
    stageReachTotal[stage.id] = stageTotal;
  }

  return { uniqueTotal, nodeReach, stageReachTotal };
}

interface Band {
  yTop: number;
  height: number;
}

/**
 * Computes the full chart geometry. Pure: no DOM access, fully testable.
 *
 * The vertical scale (pxPerUnit) is set by the column that needs the most
 * room. In reach mode an overlap stage's total is its reach sum, so that
 * column fills the drawing height and standard columns center vertically,
 * exactly like the prototype.
 */
export function computeLayout(data: AttriChartData, config: LayoutConfig): ChartLayout {
  const { stages, records } = data;
  const { nodeWidth, nodeGap, padding, attributionMode } = config;
  const totals = computeTotals(data);
  const { uniqueTotal } = totals;

  const drawH = config.height - padding.top - padding.bottom;
  const innerW = config.width - padding.left - padding.right - nodeWidth;
  const stageX = stages.map((_, i) =>
    stages.length === 1 ? padding.left : padding.left + (i * innerW) / (stages.length - 1),
  );

  // Scale: the tightest column wins so nothing overflows.
  let pxPerUnit = Infinity;
  for (const stage of stages) {
    const isReachColumn = Boolean(stage.overlap) && attributionMode === 'reach';
    const columnTotal = isReachColumn ? totals.stageReachTotal[stage.id]! : uniqueTotal;
    const available = drawH - (stage.nodes.length - 1) * nodeGap;
    pxPerUnit = Math.min(pxPerUnit, available / columnTotal);
  }

  // Bands. Overlap stages key by `${nodeId}|${recordIndex}` because a record
  // appears once under every node it touches; standard stages key by record
  // index alone.
  const bandsByStage: Array<Map<string, Band>> = [];
  const nodes: NodeLayout[] = [];

  stages.forEach((stage, stageIndex) => {
    const isOverlap = Boolean(stage.overlap);
    const isReachColumn = isOverlap && attributionMode === 'reach';

    const bandHeightFor = (record: FlowRecord): number => {
      if (!isOverlap || attributionMode === 'reach') return record.value * pxPerUnit;
      const count = membershipOf(record, stage).length;
      return (record.value / count) * pxPerUnit;
    };

    const columnTotal = isReachColumn ? totals.stageReachTotal[stage.id]! : uniqueTotal;
    const colHeight = columnTotal * pxPerUnit + (stage.nodes.length - 1) * nodeGap;
    let y = padding.top + (drawH - colHeight) / 2;

    const bands = new Map<string, Band>();
    for (const node of stage.nodes) {
      const segTop = y;
      const recordIndices: number[] = [];
      let attributed = 0;
      records.forEach((record, recordIndex) => {
        if (!membershipOf(record, stage).includes(node.id)) return;
        const height = bandHeightFor(record);
        const key = isOverlap ? `${node.id}|${recordIndex}` : String(recordIndex);
        bands.set(key, { yTop: y, height });
        y += height;
        recordIndices.push(recordIndex);
        attributed += isReachColumn
          ? record.value
          : isOverlap
            ? record.value / membershipOf(record, stage).length
            : record.value;
      });
      nodes.push({
        stage,
        stageIndex,
        node,
        x: stageX[stageIndex]!,
        yTop: segTop,
        yBot: y,
        reach: totals.nodeReach[stage.id]![node.id] ?? 0,
        value: attributed,
        isReach: isReachColumn,
        percent: attributed / uniqueTotal,
        recordIndices,
      });
      y += nodeGap;
    }
    bandsByStage.push(bands);
  });

  // Ribbons: for every adjacent stage pair, every record draws the cartesian
  // product of its source memberships and target memberships.
  const ribbons: RibbonLayout[] = [];
  for (let hop = 0; hop < stages.length - 1; hop++) {
    const source = stages[hop]!;
    const target = stages[hop + 1]!;
    const sourceOverlap = Boolean(source.overlap);
    const targetOverlap = Boolean(target.overlap);
    const x0 = stageX[hop]! + nodeWidth;
    const x1 = stageX[hop + 1]!;

    records.forEach((record, recordIndex) => {
      const sourceNodes = membershipOf(record, source);
      const targetNodes = membershipOf(record, target);

      sourceNodes.forEach((sourceNodeId, si) => {
        const sourceBand = bandsByStage[hop]!.get(
          sourceOverlap ? `${sourceNodeId}|${recordIndex}` : String(recordIndex),
        )!;
        targetNodes.forEach((targetNodeId, ti) => {
          const targetBand = bandsByStage[hop + 1]!.get(
            targetOverlap ? `${targetNodeId}|${recordIndex}` : String(recordIndex),
          )!;

          if (attributionMode === 'reach') {
            // Full width at both ends. Ribbons sharing a destination band
            // converge and overlap completely, which is the visual encoding
            // of shared attribution.
            ribbons.push({
              recordIndex,
              hopIndex: hop,
              sourceStageId: source.id,
              sourceNodeId,
              targetStageId: target.id,
              targetNodeId,
              x0,
              y0: sourceBand.yTop,
              x1,
              y1: targetBand.yTop,
              width: record.value * pxPerUnit,
            });
          } else {
            // Fractional: slice both bands so widths stay strictly additive.
            const width = (record.value * pxPerUnit) / (sourceNodes.length * targetNodes.length);
            ribbons.push({
              recordIndex,
              hopIndex: hop,
              sourceStageId: source.id,
              sourceNodeId,
              targetStageId: target.id,
              targetNodeId,
              x0,
              y0: sourceBand.yTop + ti * width,
              x1,
              y1: targetBand.yTop + si * width,
              width,
            });
          }
        });
      });
    });
  }

  return {
    width: config.width,
    height: config.height,
    pxPerUnit,
    uniqueTotal,
    nodes,
    ribbons,
    stageX,
  };
}
