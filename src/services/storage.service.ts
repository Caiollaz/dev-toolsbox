import type { HistoryEntry } from '../types';

const STORAGE_FILE = 'dext-history.json';

/**
 * Storage service using Tauri fs API for local persistence.
 * Falls back to localStorage when running in browser (dev mode).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTauriFsApi(): Promise<any | null> {
  try {
    // Dynamic import — only resolves when running inside Tauri
    const moduleName = '@tauri-apps/plugin-fs';
    const fs = await (Function('m', 'return import(m)')(moduleName));
    return fs;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTauriPathApi(): Promise<any | null> {
  try {
    const moduleName = '@tauri-apps/api/path';
    const path = await (Function('m', 'return import(m)')(moduleName));
    return path;
  } catch {
    return null;
  }
}

async function getStoragePath(): Promise<string> {
  const path = await getTauriPathApi();
  if (path) {
    const appDataDir = await path.appDataDir();
    return `${appDataDir}/${STORAGE_FILE}`;
  }
  return STORAGE_FILE;
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  const fs = await getTauriFsApi();

  if (fs) {
    try {
      const storagePath = await getStoragePath();
      const content = await fs.readTextFile(storagePath);
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  // Fallback: localStorage
  try {
    const raw = localStorage.getItem(STORAGE_FILE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveHistory(entries: HistoryEntry[]): Promise<void> {
  const fs = await getTauriFsApi();

  if (fs) {
    try {
      const storagePath = await getStoragePath();
      await fs.writeTextFile(storagePath, JSON.stringify(entries, null, 2));
      return;
    } catch (err) {
      console.error('Failed to save with Tauri fs:', err);
    }
  }

  // Fallback: localStorage
  localStorage.setItem(STORAGE_FILE, JSON.stringify(entries));
}

export async function addHistoryEntry(entry: Omit<HistoryEntry, 'createdAt'>): Promise<HistoryEntry[]> {
  const entries = await loadHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    createdAt: new Date().toISOString(),
  };

  const updated = [newEntry, ...entries].slice(0, 100); // keep max 100 entries
  await saveHistory(updated);
  return updated;
}

export async function clearHistory(): Promise<void> {
  await saveHistory([]);
}
