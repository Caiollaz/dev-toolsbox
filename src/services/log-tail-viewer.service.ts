/**
 * Log Tail Viewer Service
 * Uses Tauri invoke to read and watch log files via Rust backend.
 */

export interface LogLine {
  line_number: number;
  content: string;
  level: string;
  timestamp: string;
}

export type LogLevel = 'all' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export const LOG_LEVELS: LogLevel[] = ['all', 'error', 'warn', 'info', 'debug', 'trace'];

let _isTauri: boolean | null = null;

export function isTauriEnvironment(): boolean {
  if (_isTauri === null) {
    _isTauri = !!(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  }
  return _isTauri;
}

async function getTauriInvoke(): Promise<typeof import('@tauri-apps/api/core').invoke | null> {
  try {
    const mod = await (Function('m', 'return import(m)') as (m: string) => Promise<typeof import('@tauri-apps/api/core')>)('@tauri-apps/api/core');
    return mod.invoke;
  } catch {
    return null;
  }
}

export async function getTauriEventApi(): Promise<typeof import('@tauri-apps/api/event') | null> {
  try {
    const mod = await (Function('m', 'return import(m)') as (m: string) => Promise<typeof import('@tauri-apps/api/event')>)('@tauri-apps/api/event');
    return mod;
  } catch {
    return null;
  }
}

export async function logReadFile(path: string, lines: number = 200): Promise<LogLine[]> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('Log Tail Viewer requires the desktop app');

  return invoke<LogLine[]>('log_read_file', { path, lines });
}

export async function logWatchStart(path: string): Promise<void> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('Log Tail Viewer requires the desktop app');

  return invoke<void>('log_watch_start', { path });
}

export async function logWatchStop(): Promise<void> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('Log Tail Viewer requires the desktop app');

  return invoke<void>('log_watch_stop');
}

export function getLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'error': return 'var(--color-error)';
    case 'warn': return 'var(--color-warning)';
    case 'info': return 'var(--accent)';
    case 'debug': return 'var(--text-secondary)';
    case 'trace': return 'var(--text-muted)';
    default: return 'var(--text-primary)';
  }
}

export function filterLogLines(lines: LogLine[], level: LogLevel, filter: string): LogLine[] {
  return lines.filter((line) => {
    if (level !== 'all' && line.level !== level) return false;
    if (filter && !line.content.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });
}
