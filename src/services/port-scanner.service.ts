/**
 * Port Scanner Service
 * Uses Tauri invoke to scan TCP ports via Rust backend.
 */

export interface PortResult {
  port: number;
  open: boolean;
  service: string;
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
    const mod = await import('@tauri-apps/api/core');
    return mod.invoke;
  } catch {
    return null;
  }
}

export async function scanPorts(host: string, from: number, to: number): Promise<PortResult[]> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('Port Scanner requires the desktop app');

  return invoke<PortResult[]>('scan_ports', { host, from, to });
}
