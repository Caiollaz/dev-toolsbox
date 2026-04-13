/**
 * SSL Inspector Service
 * Uses Tauri invoke to inspect TLS certificates via Rust backend.
 */

export interface CertChainEntry {
  level: string;
  subject: string;
  issuer: string;
}

export interface SslCertInfo {
  subject: string;
  issuer: string;
  valid_from: string;
  valid_until: string;
  serial_number: string;
  signature_algorithm: string;
  key_size: string;
  is_valid: boolean;
  days_remaining: number;
  san: string[];
  chain: CertChainEntry[];
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

export async function inspectSsl(domain: string): Promise<SslCertInfo> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('SSL Inspector requires the desktop app');

  return invoke<SslCertInfo>('inspect_ssl', { domain });
}

export function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}
