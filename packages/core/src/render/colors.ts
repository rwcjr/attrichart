import type { AttriChartData, RibbonInfo } from '../types';
import type { ResolvedOptions } from '../options';
import type { RibbonLayout } from '../layout/compute';

/** stageId:nodeId -> resolved CSS color. */
export function buildNodeColors(
  data: AttriChartData,
  options: ResolvedOptions,
): Map<string, string> {
  const colors = new Map<string, string>();
  const palette = options.colors.palette;
  for (const stage of data.stages) {
    stage.nodes.forEach((node, i) => {
      const color =
        node.color ?? options.colors.node?.(node, stage) ?? palette[i % palette.length]!;
      colors.set(`${stage.id}:${node.id}`, color);
    });
  }
  return colors;
}

/**
 * Resolves a ribbon's color. Default rule, matching the prototype: a hop
 * leaving an overlap stage is colored by its source node (so stacked
 * translucent ribbons darken in the source's hue), any other hop is colored
 * by its target node (the consolidated outcome).
 */
export function ribbonColor(
  ribbon: RibbonLayout,
  info: RibbonInfo,
  nodeColors: Map<string, string>,
  options: ResolvedOptions,
): string {
  const setting = options.colors.ribbon;
  if (typeof setting === 'function') return setting(info);
  const side =
    setting ??
    (info.sourceStage.overlap && options.attributionMode === 'reach' ? 'source' : 'target');
  return side === 'source'
    ? nodeColors.get(`${ribbon.sourceStageId}:${ribbon.sourceNodeId}`)!
    : nodeColors.get(`${ribbon.targetStageId}:${ribbon.targetNodeId}`)!;
}
