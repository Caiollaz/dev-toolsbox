export interface ParsedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  auth?: { type: 'basic'; user: string; pass: string } | { type: 'bearer'; token: string };
}

export function parseCurl(cmd: string): ParsedRequest {
  // Normalize: remove line continuations and collapse whitespace
  let normalized = cmd
    .replace(/\\\n/g, ' ')
    .replace(/\\\r\n/g, ' ')
    .trim();

  // Remove leading 'curl' if present
  if (normalized.toLowerCase().startsWith('curl')) {
    normalized = normalized.slice(4).trim();
  }

  const result: ParsedRequest = {
    method: 'GET',
    url: '',
    headers: {},
  };

  // Tokenize respecting quotes
  const tokens = tokenize(normalized);

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token === '-X' || token === '--request') {
      i++;
      if (i < tokens.length) result.method = tokens[i].toUpperCase();
    } else if (token === '-H' || token === '--header') {
      i++;
      if (i < tokens.length) {
        const headerStr = tokens[i];
        const colonIdx = headerStr.indexOf(':');
        if (colonIdx !== -1) {
          const key = headerStr.slice(0, colonIdx).trim();
          const value = headerStr.slice(colonIdx + 1).trim();
          result.headers[key] = value;
        }
      }
    } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary') {
      i++;
      if (i < tokens.length) {
        result.body = tokens[i];
        if (result.method === 'GET') result.method = 'POST';
      }
    } else if (token === '-u' || token === '--user') {
      i++;
      if (i < tokens.length) {
        const [user, pass = ''] = tokens[i].split(':');
        result.auth = { type: 'basic', user, pass };
      }
    } else if (token.startsWith('-')) {
      // Skip unknown single-letter flags
      if (token.length === 2 && !token.startsWith('--')) {
        i++; // skip the value too
      }
    } else if (!result.url) {
      result.url = token;
    }

    i++;
  }

  // Detect bearer token from Authorization header
  const authHeader = Object.entries(result.headers).find(
    ([k]) => k.toLowerCase() === 'authorization',
  );
  if (authHeader && authHeader[1].toLowerCase().startsWith('bearer ')) {
    result.auth = { type: 'bearer', token: authHeader[1].slice(7) };
  }

  return result;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let escape = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (escape) {
      current += ch;
      escape = false;
      continue;
    }

    if (ch === '\\') {
      escape = true;
      continue;
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }

    if (ch === ' ' && !inSingle && !inDouble) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current) tokens.push(current);
  return tokens;
}

// --- Code generators ---

export type Language = 'fetch' | 'axios' | 'python' | 'go';

export function toFetchCode(req: ParsedRequest): string {
  const lines: string[] = [];
  const opts: string[] = [];

  opts.push(`  method: '${req.method}'`);

  const headers = { ...req.headers };
  if (req.auth?.type === 'basic') {
    headers['Authorization'] = `Basic \${btoa('${req.auth.user}:${req.auth.pass}')}`;
  } else if (req.auth?.type === 'bearer') {
    headers['Authorization'] = `Bearer ${req.auth.token}`;
  }

  if (Object.keys(headers).length > 0) {
    opts.push(`  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')}`);
  }

  if (req.body) {
    opts.push(`  body: ${isJson(req.body) ? `JSON.stringify(${req.body})` : `'${escapeStr(req.body)}'`}`);
  }

  lines.push(`const response = await fetch('${req.url}', {`);
  lines.push(opts.join(',\n'));
  lines.push('});');
  lines.push('');
  lines.push('const data = await response.json();');
  lines.push('console.log(data);');

  return lines.join('\n');
}

export function toAxiosCode(req: ParsedRequest): string {
  const lines: string[] = [];
  const config: string[] = [];

  const headers = { ...req.headers };
  if (req.auth?.type === 'bearer') {
    headers['Authorization'] = `Bearer ${req.auth.token}`;
  }

  if (Object.keys(headers).length > 0) {
    config.push(`  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')}`);
  }

  if (req.auth?.type === 'basic') {
    config.push(`  auth: {\n    username: '${req.auth.user}',\n    password: '${req.auth.pass}'\n  }`);
  }

  const method = req.method.toLowerCase();
  const hasBody = req.body && ['post', 'put', 'patch'].includes(method);

  lines.push(`const { data } = await axios.${method}(`);
  lines.push(`  '${req.url}'${hasBody || config.length > 0 ? ',' : ''}`);

  if (hasBody) {
    lines.push(`  ${isJson(req.body!) ? req.body : `'${escapeStr(req.body!)}'`}${config.length > 0 ? ',' : ''}`);
  }

  if (config.length > 0) {
    lines.push(`  {`);
    lines.push(config.join(',\n'));
    lines.push(`  }`);
  }

  lines.push(');');
  lines.push('');
  lines.push('console.log(data);');

  return lines.join('\n');
}

export function toPythonCode(req: ParsedRequest): string {
  const lines: string[] = [];
  lines.push('import requests');
  lines.push('');

  const headers = { ...req.headers };
  if (req.auth?.type === 'bearer') {
    headers['Authorization'] = `Bearer ${req.auth.token}`;
  }

  const kwargs: string[] = [];

  if (Object.keys(headers).length > 0) {
    kwargs.push(`    headers=${pythonDict(headers)}`);
  }

  if (req.auth?.type === 'basic') {
    kwargs.push(`    auth=('${req.auth.user}', '${req.auth.pass}')`);
  }

  if (req.body) {
    if (isJson(req.body)) {
      kwargs.push(`    json=${req.body}`);
    } else {
      kwargs.push(`    data='${escapeStr(req.body)}'`);
    }
  }

  const method = req.method.toLowerCase();
  lines.push(`response = requests.${method}(`);
  lines.push(`    '${req.url}'${kwargs.length > 0 ? ',' : ''}`);
  if (kwargs.length > 0) {
    lines.push(kwargs.join(',\n'));
  }
  lines.push(')');
  lines.push('');
  lines.push('print(response.json())');

  return lines.join('\n');
}

export function toGoCode(req: ParsedRequest): string {
  const lines: string[] = [];
  lines.push('package main');
  lines.push('');
  lines.push('import (');
  lines.push('    "fmt"');
  lines.push('    "io"');
  lines.push('    "net/http"');
  if (req.body) lines.push('    "strings"');
  lines.push(')');
  lines.push('');
  lines.push('func main() {');

  if (req.body) {
    lines.push(`    body := strings.NewReader(\`${req.body}\`)`);
    lines.push(`    req, err := http.NewRequest("${req.method}", "${req.url}", body)`);
  } else {
    lines.push(`    req, err := http.NewRequest("${req.method}", "${req.url}", nil)`);
  }

  lines.push('    if err != nil {');
  lines.push('        panic(err)');
  lines.push('    }');

  const headers = { ...req.headers };
  if (req.auth?.type === 'bearer') {
    headers['Authorization'] = `Bearer ${req.auth.token}`;
  }

  for (const [key, value] of Object.entries(headers)) {
    lines.push(`    req.Header.Set("${key}", "${value}")`);
  }

  if (req.auth?.type === 'basic') {
    lines.push(`    req.SetBasicAuth("${req.auth.user}", "${req.auth.pass}")`);
  }

  lines.push('');
  lines.push('    client := &http.Client{}');
  lines.push('    resp, err := client.Do(req)');
  lines.push('    if err != nil {');
  lines.push('        panic(err)');
  lines.push('    }');
  lines.push('    defer resp.Body.Close()');
  lines.push('');
  lines.push('    respBody, _ := io.ReadAll(resp.Body)');
  lines.push('    fmt.Println(string(respBody))');
  lines.push('}');

  return lines.join('\n');
}

// Helpers

function isJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

function escapeStr(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function pythonDict(obj: Record<string, string>): string {
  const entries = Object.entries(obj).map(([k, v]) => `'${k}': '${v}'`);
  return `{${entries.join(', ')}}`;
}
