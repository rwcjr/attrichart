import type { AttriChartData, FlowRecord } from './types';

/** Thrown for invalid data or options. The message says what to fix. */
export class AttriChartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttriChartError';
  }
}

function fail(message: string): never {
  throw new AttriChartError(message);
}

/**
 * Validates data and returns it with membership normalized: overlap stages
 * always map to a string[], standard stages always map to a string.
 * Throws AttriChartError with an actionable message otherwise.
 */
export function validateData(data: AttriChartData): AttriChartData {
  if (!data || typeof data !== 'object') fail('data must be an object with stages and records.');
  const { stages, records } = data;

  if (!Array.isArray(stages) || stages.length < 2) {
    fail('data.stages must be an array of at least two stages.');
  }
  if (!Array.isArray(records) || records.length === 0) {
    fail('data.records must be a non-empty array.');
  }

  const stageIds = new Set<string>();
  const nodeIdsByStage = new Map<string, Set<string>>();

  for (const stage of stages) {
    if (!stage.id) fail('Every stage needs an id.');
    if (stageIds.has(stage.id)) fail(`Duplicate stage id "${stage.id}".`);
    stageIds.add(stage.id);

    if (!Array.isArray(stage.nodes) || stage.nodes.length === 0) {
      fail(`Stage "${stage.id}" needs a non-empty nodes array.`);
    }
    const nodeIds = new Set<string>();
    for (const node of stage.nodes) {
      if (!node.id) fail(`A node in stage "${stage.id}" is missing an id.`);
      if (nodeIds.has(node.id)) {
        fail(`Duplicate node id "${node.id}" in stage "${stage.id}".`);
      }
      nodeIds.add(node.id);
    }
    nodeIdsByStage.set(stage.id, nodeIds);
  }

  const normalizedRecords: FlowRecord[] = records.map((record, i) => {
    const name = record.id ? `Record "${record.id}"` : `Record at index ${i}`;
    if (typeof record.value !== 'number' || !Number.isFinite(record.value) || record.value <= 0) {
      fail(`${name} has value ${String(record.value)}; value must be a finite number > 0.`);
    }
    if (!record.membership || typeof record.membership !== 'object') {
      fail(`${name} is missing its membership map.`);
    }

    const membership: Record<string, string | string[]> = {};
    for (const stage of stages) {
      const raw = record.membership[stage.id];
      if (raw === undefined) {
        fail(`${name} has no membership for stage "${stage.id}".`);
      }
      const nodeIds = nodeIdsByStage.get(stage.id)!;
      const asArray = Array.isArray(raw) ? raw : [raw];

      if (asArray.length === 0) {
        fail(`${name} has an empty membership for stage "${stage.id}".`);
      }
      const seen = new Set<string>();
      for (const nodeId of asArray) {
        if (!nodeIds.has(nodeId)) {
          fail(`${name} references unknown node "${nodeId}" in stage "${stage.id}".`);
        }
        if (seen.has(nodeId)) {
          fail(`${name} lists node "${nodeId}" twice for stage "${stage.id}".`);
        }
        seen.add(nodeId);
      }

      if (stage.overlap) {
        membership[stage.id] = asArray;
      } else {
        if (asArray.length > 1) {
          fail(
            `${name} maps to ${asArray.length} nodes in stage "${stage.id}", ` +
              `but that stage is not overlap-enabled. Set overlap: true on the stage ` +
              `or use a single nodeId.`,
          );
        }
        membership[stage.id] = asArray[0]!;
      }
    }

    const unknownStages = Object.keys(record.membership).filter((k) => !stageIds.has(k));
    if (unknownStages.length > 0) {
      fail(`${name} references unknown stage "${unknownStages[0]}".`);
    }

    return { ...record, membership };
  });

  return { stages, records: normalizedRecords };
}
