/**
 * Docker Dashboard Service
 * Uses Tauri invoke to manage Docker containers via Rust backend (bollard).
 */

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  created: number;
}

export interface DockerStats {
  running: number;
  stopped: number;
  total: number;
}

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

export async function dockerList(): Promise<[ContainerInfo[], DockerStats]> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('Docker Dashboard requires the desktop app');

  return invoke<[ContainerInfo[], DockerStats]>('docker_list');
}

export async function dockerStart(containerId: string): Promise<void> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('Docker Dashboard requires the desktop app');

  return invoke<void>('docker_start', { containerId });
}

export async function dockerStop(containerId: string): Promise<void> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('Docker Dashboard requires the desktop app');

  return invoke<void>('docker_stop', { containerId });
}

export async function dockerRestart(containerId: string): Promise<void> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('Docker Dashboard requires the desktop app');

  return invoke<void>('docker_restart', { containerId });
}

export async function dockerLogs(containerId: string, lines: number = 100): Promise<string[]> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('Docker Dashboard requires the desktop app');

  return invoke<string[]>('docker_logs', { containerId, lines });
}

export function getStateColor(state: string): string {
  switch (state.toLowerCase()) {
    case 'running': return 'running';
    case 'exited': return 'exited';
    case 'paused': return 'paused';
    case 'restarting': return 'restarting';
    default: return 'unknown';
  }
}
