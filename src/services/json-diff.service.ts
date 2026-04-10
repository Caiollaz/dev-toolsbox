export type DiffType = 'added' | 'removed' | 'changed';

export interface DiffEntry {
  type: DiffType;
  key: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export function compareJson(jsonA: string, jsonB: string): DiffEntry[] {
  const objA = JSON.parse(jsonA);
  const objB = JSON.parse(jsonB);

  return diffObjects(objA, objB);
}

function diffObjects(
  objA: Record<string, unknown>,
  objB: Record<string, unknown>,
  prefix = '',
): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)]);

  for (const key of allKeys) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const inA = key in objA;
    const inB = key in objB;

    if (inA && !inB) {
      diffs.push({ type: 'removed', key: fullKey, oldValue: objA[key] });
    } else if (!inA && inB) {
      diffs.push({ type: 'added', key: fullKey, newValue: objB[key] });
    } else if (inA && inB) {
      const valA = objA[key];
      const valB = objB[key];

      if (
        typeof valA === 'object' &&
        typeof valB === 'object' &&
        valA !== null &&
        valB !== null &&
        !Array.isArray(valA) &&
        !Array.isArray(valB)
      ) {
        diffs.push(
          ...diffObjects(
            valA as Record<string, unknown>,
            valB as Record<string, unknown>,
            fullKey,
          ),
        );
      } else if (JSON.stringify(valA) !== JSON.stringify(valB)) {
        diffs.push({
          type: 'changed',
          key: fullKey,
          oldValue: valA,
          newValue: valB,
        });
      }
    }
  }

  return diffs;
}
