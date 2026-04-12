export interface FieldDef {
  name: string;
  type: string;
}

const FIRST_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry',
  'Ivy', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olivia', 'Paul',
  'Quinn', 'Rose', 'Sam', 'Tara', 'Uma', 'Victor', 'Wendy', 'Xander',
  'Yara', 'Zach', 'Aria', 'Blake', 'Clara', 'Dylan', 'Elena', 'Felix',
  'Gina', 'Hugo', 'Iris', 'James', 'Kira', 'Liam', 'Maya', 'Nora',
  'Oscar', 'Petra', 'Riley', 'Sofia', 'Tyler', 'Vera', 'Wyatt', 'Zoe',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Hill', 'Scott', 'Green', 'Adams',
];

const DOMAINS = [
  'gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com',
  'company.com', 'example.com', 'test.org', 'mail.io',
];

const COMPANIES = [
  'Acme Corp', 'Globex Inc', 'Initech', 'Umbrella Corp', 'Wayne Enterprises',
  'Stark Industries', 'Cyberdyne', 'Oscorp', 'LexCorp', 'Aperture Science',
];

const CITIES = [
  'New York', 'London', 'Tokyo', 'Paris', 'Berlin', 'Sydney', 'Toronto',
  'Amsterdam', 'Singapore', 'Dubai', 'Seoul', 'Mumbai', 'São Paulo',
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startYear = 2020, endYear = 2025): string {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString();
}

function generateValue(name: string, type: string): unknown {
  const lowerName = name.toLowerCase();
  const lowerType = type.toLowerCase();

  // Type-based inference
  if (lowerType === 'boolean' || lowerType === 'bool') return Math.random() > 0.5;
  if (lowerType === 'number' || lowerType === 'int' || lowerType === 'integer') return rand(1, 1000);
  if (lowerType === 'float' || lowerType === 'double' || lowerType === 'decimal') {
    return parseFloat((Math.random() * 1000).toFixed(2));
  }
  if (lowerType === 'date' || lowerType === 'datetime') return randomDate();

  // Name-based inference (for string types)
  if (lowerName === 'id' || lowerName === 'uuid') return crypto.randomUUID();
  if (lowerName === 'firstname' || lowerName === 'first_name') return pick(FIRST_NAMES);
  if (lowerName === 'lastname' || lowerName === 'last_name') return pick(LAST_NAMES);
  if (lowerName === 'name' || lowerName === 'fullname' || lowerName === 'full_name') {
    return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  }
  if (lowerName === 'email' || lowerName.endsWith('email')) {
    return `${pick(FIRST_NAMES).toLowerCase()}${rand(1, 999)}@${pick(DOMAINS)}`;
  }
  if (lowerName === 'phone' || lowerName.endsWith('phone')) {
    return `(${rand(200, 999)}) ${rand(100, 999)}-${rand(1000, 9999)}`;
  }
  if (lowerName === 'url' || lowerName === 'website' || lowerName.endsWith('url')) {
    return `https://www.${pick(DOMAINS)}/${pick(FIRST_NAMES).toLowerCase()}`;
  }
  if (lowerName === 'company' || lowerName === 'organization') return pick(COMPANIES);
  if (lowerName === 'city') return pick(CITIES);
  if (lowerName === 'country') return pick(['US', 'UK', 'JP', 'DE', 'FR', 'BR', 'CA', 'AU']);
  if (lowerName === 'age') return rand(18, 80);
  if (lowerName === 'price' || lowerName === 'amount' || lowerName === 'cost') {
    return parseFloat((Math.random() * 500 + 0.99).toFixed(2));
  }
  if (lowerName === 'status') return pick(['active', 'inactive', 'pending', 'archived']);
  if (lowerName === 'role') return pick(['admin', 'user', 'editor', 'viewer', 'moderator']);
  if (lowerName === 'avatar' || lowerName === 'image' || lowerName === 'photo') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${pick(FIRST_NAMES)}`;
  }
  if (lowerName.includes('date') || lowerName.includes('_at') || lowerName.endsWith('at')) {
    return randomDate();
  }
  if (lowerName === 'active' || lowerName === 'enabled' || lowerName === 'verified') {
    return Math.random() > 0.5;
  }
  if (lowerName === 'description' || lowerName === 'bio' || lowerName === 'about') {
    return `Sample ${lowerName} text for ${pick(FIRST_NAMES)}.`;
  }
  if (lowerName === 'title') return `${pick(['Senior', 'Junior', 'Lead', 'Staff'])} ${pick(['Engineer', 'Designer', 'Manager', 'Analyst'])}`;
  if (lowerName === 'address') return `${rand(100, 9999)} ${pick(LAST_NAMES)} ${pick(['St', 'Ave', 'Blvd', 'Dr'])}`;
  if (lowerName === 'zip' || lowerName === 'zipcode' || lowerName === 'postal') return String(rand(10000, 99999));
  if (lowerName === 'color') return `#${rand(0, 16777215).toString(16).padStart(6, '0')}`;
  if (lowerName === 'tag' || lowerName === 'category') return pick(['tech', 'design', 'business', 'science', 'art', 'music']);

  // Default string
  return `${name}_${rand(1, 9999)}`;
}

export function parseInterface(definition: string): FieldDef[] {
  const fields: FieldDef[] = [];
  const lines = definition.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('{') || trimmed.startsWith('}') || trimmed.startsWith('interface') || trimmed.startsWith('type') || trimmed.startsWith('export')) {
      continue;
    }

    // Match "name: type" or "name?: type" patterns
    const match = trimmed.match(/^(\w+)\??\s*:\s*(.+?)\s*[;,]?\s*$/);
    if (match) {
      fields.push({ name: match[1], type: match[2] });
    }
  }

  return fields;
}

export function generateMockData(fields: FieldDef[], count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, () => {
    const obj: Record<string, unknown> = {};
    for (const field of fields) {
      obj[field.name] = generateValue(field.name, field.type);
    }
    return obj;
  });
}

export function formatAsJson(data: Record<string, unknown>[]): string {
  return JSON.stringify(data, null, 2);
}

export function formatAsCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = String(row[h] ?? '');
      return val.includes(',') || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}
