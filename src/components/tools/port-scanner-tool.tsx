import { useState, useEffect } from 'react';
import { Radar, Loader2 } from 'lucide-react';
import { scanPorts, isTauriEnvironment } from '../../services/port-scanner.service';
import type { PortResult } from '../../services/port-scanner.service';
import styles from './port-scanner-tool.module.css';

export function PortScannerTool() {
  const [host, setHost] = useState('127.0.0.1');
  const [portFrom, setPortFrom] = useState(1);
  const [portTo, setPortTo] = useState(1024);
  const [results, setResults] = useState<PortResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTauri, setIsTauri] = useState<boolean | null>(null);

  useEffect(() => {
    setIsTauri(isTauriEnvironment());
  }, []);

  const handleScan = async () => {
    if (loading) return;
    setError(null);
    setResults([]);
    setLoading(true);

    try {
      const data = await scanPorts(host, portFrom, portTo);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Desktop-only guard ─────────────────────────────

  if (isTauri === false) {
    return (
      <div className={styles.desktopOnly}>
        <div className={styles.desktopOnlyIcon}>
          <Radar size={32} />
        </div>
        <h3 className={styles.desktopOnlyTitle}>DESKTOP ONLY FEATURE</h3>
        <p className={styles.desktopOnlyDesc}>
          Port Scanner requires the DEXT desktop app to perform TCP port scanning.
          Download the app to use this tool.
        </p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────

  return (
    <>
      {/* Host + Port Range */}
      <div className={styles.inputBar}>
        <input
          type="text"
          className={styles.hostInput}
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="127.0.0.1"
          onKeyDown={(e) => { if (e.key === 'Enter') handleScan(); }}
        />
        <input
          type="number"
          className={styles.portInput}
          value={portFrom}
          onChange={(e) => setPortFrom(Number(e.target.value))}
          min={1}
          max={65535}
          placeholder="1"
        />
        <span className={styles.portSeparator}>-</span>
        <input
          type="number"
          className={styles.portInput}
          value={portTo}
          onChange={(e) => setPortTo(Number(e.target.value))}
          min={1}
          max={65535}
          placeholder="1024"
        />
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.scanBtn} ${loading ? styles.scanBtnLoading : ''}`}
          onClick={handleScan}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={14} className={styles.spinner} />
              <span>SCANNING...</span>
            </>
          ) : (
            <>
              <Radar size={14} />
              <span>SCAN</span>
            </>
          )}
        </button>
        <button
          className={styles.stopBtn}
          onClick={() => { setResults([]); setError(null); }}
        >
          STOP
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <span className={styles.errorDot} />
          <span>{error}</span>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className={styles.results}>
          <div className={styles.tableHeader}>
            <span className={styles.tableHeaderCell}>PORT</span>
            <span className={styles.tableHeaderCell}>STATUS</span>
            <span className={styles.tableHeaderCell}>SERVICE</span>
            <span className={styles.tableHeaderCell}>PID</span>
          </div>
          {results.map((r) => (
            <div key={r.port} className={styles.tableRow}>
              <span className={styles.portCell}>{r.port}</span>
              <span className={styles.statusCell}>
                <span className={styles.statusBadge}>OPEN</span>
              </span>
              <span className={styles.serviceCell}>{r.service || '—'}</span>
              <span className={styles.ttlCell}>—</span>
            </div>
          ))}
        </div>
      )}

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={`${styles.statusDot} ${loading ? styles.statusDotLoading : ''}`} />
          <span className={styles.statusText}>
            {loading
              ? 'SCANNING...'
              : results.length > 0
                ? `READY — ${results.length} open ports found (${portFrom}-${portTo})`
                : error
                  ? 'ERROR — Scan failed'
                  : 'READY — Configure and start scan'}
          </span>
        </div>
        <span className={styles.statusRight}>PORT_SCAN</span>
      </div>
    </>
  );
}
