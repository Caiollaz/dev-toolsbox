/**
 * DNS Lookup Service
 * Uses Tauri invoke to resolve DNS records via Rust backend.
 */

export interface DnsRecord {
  record_type: string;
  value: string;
  ttl: number;
}

export const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

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

export async function dnsResolve(domain: string, recordType: RecordType): Promise<DnsRecord[]> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('DNS Lookup requires the desktop app');

  return invoke<DnsRecord[]>('dns_resolve', { domain, recordType });
}
