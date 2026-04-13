import { useState, useEffect } from 'react';
import { Globe, Loader2, Copy } from 'lucide-react';
import { dnsResolve, isTauriEnvironment, RECORD_TYPES } from '../../services/dns-lookup.service';
import type { DnsRecord, RecordType } from '../../services/dns-lookup.service';
import { useClipboard } from '../../hooks/use-clipboard';
import styles from './dns-lookup-tool.module.css';

export function DnsLookupTool() {
  const [domain, setDomain] = useState('');
  const [recordType, setRecordType] = useState<RecordType>('A');
  const [results, setResults] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTauri, setIsTauri] = useState<boolean | null>(null);
  const { copy, copied } = useClipboard();

  useEffect(() => {
    setIsTauri(isTauriEnvironment());
  }, []);

  const handleResolve = async () => {
    if (loading || !domain.trim()) return;
    setError(null);
    setResults([]);
    setLoading(true);

    try {
      const data = await dnsResolve(domain.trim(), recordType);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'DNS lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text = results.map((r) => `${r.record_type}\t${r.value}\t${r.ttl}`).join('\n');
    copy(text);
  };

  // ── Desktop-only guard ─────────────────────────────

  if (isTauri === false) {
    return (
      <div className={styles.desktopOnly}>
        <div className={styles.desktopOnlyIcon}>
          <Globe size={32} />
        </div>
        <h3 className={styles.desktopOnlyTitle}>DESKTOP ONLY FEATURE</h3>
        <p className={styles.desktopOnlyDesc}>
          DNS Lookup requires the DEXT desktop app to resolve DNS records.
          Download the app to use this tool.
        </p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────

  return (
    <>
      {/* Domain + Record Type */}
      <div className={styles.inputBar}>
        <input
          type="text"
          className={styles.domainInput}
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="github.com"
          onKeyDown={(e) => { if (e.key === 'Enter') handleResolve(); }}
        />
        <select
          className={styles.typeSelect}
          value={recordType}
          onChange={(e) => setRecordType(e.target.value as RecordType)}
        >
          {RECORD_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.resolveBtn} ${loading ? styles.resolveBtnLoading : ''}`}
          onClick={handleResolve}
          disabled={loading || !domain.trim()}
        >
          {loading ? (
            <>
              <Loader2 size={14} className={styles.spinner} />
              <span>RESOLVING...</span>
            </>
          ) : (
            <>
              <Globe size={14} />
              <span>RESOLVE</span>
            </>
          )}
        </button>
        {results.length > 0 && (
          <button className={styles.copyBtn} onClick={handleCopy}>
            <Copy size={14} />
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
        )}
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
            <span className={styles.tableHeaderCell}>TYPE</span>
            <span className={styles.tableHeaderCell}>VALUE</span>
            <span className={styles.tableHeaderCell}>TTL</span>
          </div>
          {results.map((r, i) => (
            <div key={i} className={styles.tableRow}>
              <span className={styles.typeCell}>{r.record_type}</span>
              <span className={styles.valueCell}>{r.value}</span>
              <span className={styles.ttlCell}>{r.ttl}</span>
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
              ? 'RESOLVING...'
              : results.length > 0
                ? `READY — ${results.length} records found for ${domain}`
                : error
                  ? 'ERROR — DNS lookup failed'
                  : 'READY — Enter a domain to resolve'}
          </span>
        </div>
        <span className={styles.statusRight}>DNS_LOOKUP</span>
      </div>
    </>
  );
}
