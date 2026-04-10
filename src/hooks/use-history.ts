import { useState, useEffect, useCallback } from 'react';
import type { HistoryEntry, ToolType } from '../types';
import { loadHistory, addHistoryEntry, clearHistory } from '../services/storage.service';

export function useHistory(tool?: ToolType) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory()
      .then((all) => {
        const filtered = tool ? all.filter((e) => e.tool === tool) : all;
        setEntries(filtered);
      })
      .finally(() => setLoading(false));
  }, [tool]);

  const addEntry = useCallback(
    async (input: string, output: string) => {
      if (!tool) return;
      const updated = await addHistoryEntry({ tool, input, output });
      setEntries(updated.filter((e) => e.tool === tool));
    },
    [tool],
  );

  const clear = useCallback(async () => {
    await clearHistory();
    setEntries([]);
  }, []);

  return { entries, loading, addEntry, clear };
}
