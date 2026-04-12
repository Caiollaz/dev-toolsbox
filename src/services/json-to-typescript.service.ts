export function jsonToTypeScript(json: string, rootName = 'Root'): string {
  const parsed = JSON.parse(json);
  const interfaces: string[] = [];

  function toPascalCase(str: string): string {
    return str
      .replace(/[_-]+/g, ' ')
      .replace(/(?:^|\s)\w/g, (match) => match.trim().toUpperCase())
      .replace(/\s/g, '');
  }

  function inferType(value: unknown, name: string): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    switch (typeof value) {
      case 'string':
        return 'string';
      case 'number':
        return Number.isInteger(value) ? 'number' : 'number';
      case 'boolean':
        return 'boolean';
      case 'object': {
        if (Array.isArray(value)) {
          return inferArrayType(value, name);
        }
        const interfaceName = toPascalCase(name);
        generateInterface(value as Record<string, unknown>, interfaceName);
        return interfaceName;
      }
      default:
        return 'unknown';
    }
  }

  function inferArrayType(arr: unknown[], name: string): string {
    if (arr.length === 0) return 'unknown[]';

    const types = new Set<string>();
    const singularName = name.endsWith('s') ? name.slice(0, -1) : name + 'Item';

    for (const item of arr) {
      types.add(inferType(item, singularName));
    }

    const typeArray = Array.from(types);
    if (typeArray.length === 1) {
      return `${typeArray[0]}[]`;
    }
    return `(${typeArray.join(' | ')})[]`;
  }

  function generateInterface(obj: Record<string, unknown>, name: string): void {
    // Check if interface already exists
    const existing = interfaces.find((i) => i.startsWith(`export interface ${name} `));
    if (existing) return;

    const lines: string[] = [];
    lines.push(`export interface ${name} {`);

    for (const [key, value] of Object.entries(obj)) {
      const isNullable = value === null;
      const type = inferType(value, key);
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;

      if (isNullable) {
        lines.push(`  ${safeKey}: ${type} | null;`);
      } else {
        lines.push(`  ${safeKey}: ${type};`);
      }
    }

    lines.push('}');
    interfaces.push(lines.join('\n'));
  }

  if (Array.isArray(parsed)) {
    if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
      generateInterface(parsed[0] as Record<string, unknown>, rootName);
      interfaces.push(`\nexport type ${rootName}List = ${rootName}[];`);
    } else {
      const itemType = parsed.length > 0 ? inferType(parsed[0], 'item') : 'unknown';
      interfaces.push(`export type ${rootName} = ${itemType}[];`);
    }
  } else if (typeof parsed === 'object' && parsed !== null) {
    generateInterface(parsed as Record<string, unknown>, rootName);
  } else {
    interfaces.push(`export type ${rootName} = ${typeof parsed};`);
  }

  return interfaces.join('\n\n');
}

export function validateJson(json: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(json);
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Invalid JSON',
    };
  }
}

export function formatJson(json: string, indent = 2): string {
  return JSON.stringify(JSON.parse(json), null, indent);
}
