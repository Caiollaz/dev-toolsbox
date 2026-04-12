export type EnvDiffType = 'added' | 'removed' | 'changed' | 'equal';

export interface EnvDiff {
  type: EnvDiffType;
  key: string;
  oldValue?: string;
  newValue?: string;
}

export function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

export function compareEnvFiles(envA: string, envB: string): EnvDiff[] {
  const objA = parseEnvFile(envA);
  const objB = parseEnvFile(envB);
  const diffs: EnvDiff[] = [];
  const allKeys = new Set([...Object.keys(objA), ...Object.keys(objB)]);

  for (const key of Array.from(allKeys).sort()) {
    const inA = key in objA;
    const inB = key in objB;

    if (inA && !inB) {
      diffs.push({ type: 'removed', key, oldValue: objA[key] });
    } else if (!inA && inB) {
      diffs.push({ type: 'added', key, newValue: objB[key] });
    } else if (inA && inB) {
      if (objA[key] !== objB[key]) {
        diffs.push({ type: 'changed', key, oldValue: objA[key], newValue: objB[key] });
      } else {
        diffs.push({ type: 'equal', key, oldValue: objA[key], newValue: objB[key] });
      }
    }
  }

  return diffs;
}

export function generateEnvTemplate(content: string): string {
  const env = parseEnvFile(content);
  return Object.keys(env)
    .sort()
    .map((key) => `${key}=`)
    .join('\n');
}

export function mergeEnvFiles(envA: string, envB: string): string {
  const objA = parseEnvFile(envA);
  const objB = parseEnvFile(envB);
  const merged = { ...objA, ...objB };
  return Object.entries(merged)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}
