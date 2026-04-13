/**
 * OpenVPN Manager Service
 * Uses Tauri invoke to manage OpenVPN connections via openvpn3.
 * Saves profiles (username + password + path) in localStorage.
 */

export interface OvpnConfig {
  profile_path: string;
  username: string;
  password: string;
  otp: string;
}

export interface OvpnStatus {
  state: 'connected' | 'disconnected' | 'connecting' | 'error';
  server: string;
  local_ip: string;
  remote_ip: string;
  uptime: string;
  bytes_sent: string;
  bytes_received: string;
  protocol: string;
}

export interface OvpnLogLine {
  content: string;
  level: 'info' | 'success' | 'error' | 'warn';
}

export interface SavedProfile {
  id: string;
  name: string;
  profile_path: string;
  username: string;
  password: string;
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

export async function ovpnConnect(config: OvpnConfig): Promise<string> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('OpenVPN Manager requires the desktop app');
  return invoke<string>('ovpn_connect', { config });
}

export async function ovpnDisconnect(): Promise<string> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('OpenVPN Manager requires the desktop app');
  return invoke<string>('ovpn_disconnect');
}

export async function ovpnStatus(profilePath: string): Promise<OvpnStatus> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('OpenVPN Manager requires the desktop app');
  return invoke<OvpnStatus>('ovpn_status', { profilePath });
}

export async function ovpnGetLogs(lines: number): Promise<OvpnLogLine[]> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('OpenVPN Manager requires the desktop app');
  return invoke<OvpnLogLine[]>('ovpn_get_logs', { lines });
}

export async function ovpnWatchStart(): Promise<void> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('OpenVPN Manager requires the desktop app');
  return invoke<void>('ovpn_watch_start');
}

export async function ovpnWatchStop(): Promise<void> {
  const invoke = await getTauriInvoke();
  if (!invoke) throw new Error('OpenVPN Manager requires the desktop app');
  return invoke<void>('ovpn_watch_stop');
}

// --- Saved profiles (localStorage) ---

const STORAGE_KEY = 'dext_ovpn_profiles';

export function loadSavedProfiles(): SavedProfile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveProfile(profile: SavedProfile): void {
  const profiles = loadSavedProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function deleteSavedProfile(id: string): void {
  const profiles = loadSavedProfiles().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}
