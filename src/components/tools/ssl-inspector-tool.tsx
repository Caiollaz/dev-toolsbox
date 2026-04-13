import { useState, useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { inspectSsl, isTauriEnvironment, formatDate } from '../../services/ssl-inspector.service';
import type { SslCertInfo } from '../../services/ssl-inspector.service';
import styles from './ssl-inspector-tool.module.css';

export function SslInspectorTool() {
  const [domain, setDomain] = useState('');
  const [certInfo, setCertInfo] = useState<SslCertInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTauri, setIsTauri] = useState<boolean | null>(null);

  useEffect(() => {
    setIsTauri(isTauriEnvironment());
  }, []);

  const handleInspect = async () => {
    if (loading || !domain.trim()) return;
    setError(null);
    setCertInfo(null);
    setLoading(true);

    try {
      const data = await inspectSsl(domain.trim());
      setCertInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SSL inspection failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Desktop-only guard ─────────────────────────────

  if (isTauri === false) {
    return (
      <div className={styles.desktopOnly}>
        <div className={styles.desktopOnlyIcon}>
          <ShieldCheck size={32} />
        </div>
        <h3 className={styles.desktopOnlyTitle}>DESKTOP ONLY FEATURE</h3>
        <p className={styles.desktopOnlyDesc}>
          SSL Inspector requires the DEXT desktop app to inspect TLS certificates.
          Download the app to use this tool.
        </p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────

  return (
    <>
      {/* Domain Input */}
      <div className={styles.inputBar}>
        <input
          type="text"
          className={styles.domainInput}
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="github.com"
          onKeyDown={(e) => { if (e.key === 'Enter') handleInspect(); }}
        />
        <button
          className={`${styles.inspectBtn} ${loading ? styles.inspectBtnLoading : ''}`}
          onClick={handleInspect}
          disabled={loading || !domain.trim()}
        >
          {loading ? (
            <>
              <Loader2 size={14} className={styles.spinner} />
              <span>INSPECTING...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={14} />
              <span>INSPECT</span>
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <span className={styles.errorDot} />
          <span>{error}</span>
        </div>
      )}

      {/* Certificate Details */}
      {certInfo && (
        <div className={styles.certGrid}>
          {/* Certificate Info */}
          <div className={styles.certSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>// CERTIFICATE_INFO</span>
              <span className={`${styles.validBadge} ${certInfo.is_valid ? styles.validBadgeValid : styles.validBadgeExpired}`}>
                {certInfo.is_valid ? 'VALID' : 'EXPIRED'}
              </span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Subject</span>
              <span className={styles.kvValue}>{certInfo.subject}</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Issuer</span>
              <span className={styles.kvValue}>{certInfo.issuer}</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Valid From</span>
              <span className={styles.kvValue}>{formatDate(certInfo.valid_from)}</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Valid Until</span>
              <span className={styles.kvValue}>{formatDate(certInfo.valid_until)}</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Serial Number</span>
              <span className={styles.kvValue}>{certInfo.serial_number}</span>
            </div>
            <div className={styles.kvRow}>
              <span className={styles.kvKey}>Key Size</span>
              <span className={styles.kvValue}>{certInfo.key_size}</span>
            </div>
          </div>

          {/* SANs */}
          <div className={styles.certSection}>
            <span className={styles.sectionLabel}>// SUBJECT_ALT_NAMES</span>
            <div className={styles.sanList}>
              {certInfo.san.length > 0 ? (
                certInfo.san.map((name, i) => (
                  <span key={i} className={styles.sanItem}>{name}</span>
                ))
              ) : (
                <span className={styles.sanItem} style={{ color: 'var(--text-muted)' }}>No SANs found</span>
              )}
            </div>
          </div>

          {/* Certificate Chain */}
          <div className={`${styles.certSection} ${styles.certSectionFull}`}>
            <span className={styles.sectionLabel}>// CERTIFICATE_CHAIN</span>
            {certInfo.chain.map((entry, i) => (
              <div key={i} className={styles.chainEntry}>
                <span className={styles.chainLevel}>{entry.level}</span>
                <span className={styles.chainSubject}>{entry.subject}</span>
                <span className={styles.chainIssuer}>Issued by: {entry.issuer}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={`${styles.statusDot} ${loading ? styles.statusDotLoading : ''}`} />
          <span className={styles.statusText}>
            {loading
              ? 'INSPECTING...'
              : certInfo
                ? `READY — Certificate ${certInfo.is_valid ? 'valid' : 'EXPIRED'}, expires in ${certInfo.days_remaining} days`
                : error
                  ? 'ERROR — SSL inspection failed'
                  : 'READY — Enter a domain to inspect'}
          </span>
        </div>
        <span className={styles.statusRight}>SSL_INSPECT</span>
      </div>
    </>
  );
}
