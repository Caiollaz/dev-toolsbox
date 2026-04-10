import { useState } from 'react';
import { InputArea } from '../shared/input-area';
import { ActionButton } from '../shared/action-button';
import { CopyButton } from '../shared/copy-button';
import { decodeJwt, checkExpiration } from '../../services/jwt.service';
import type { JwtDecoded, ExpirationStatus } from '../../services/jwt.service';
import { useHistory } from '../../hooks/use-history';
import { useClipboard } from '../../hooks/use-clipboard';
import styles from './jwt-decoder-tool.module.css';

export function JwtDecoderTool() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState<JwtDecoded | null>(null);
  const [expStatus, setExpStatus] = useState<ExpirationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addEntry } = useHistory('jwt-decoder');
  const headerClip = useClipboard();
  const payloadClip = useClipboard();

  const handleDecode = () => {
    try {
      setError(null);
      const result = decodeJwt(token);
      setDecoded(result);

      const exp = checkExpiration(result.payload);
      setExpStatus(exp);

      addEntry(token, JSON.stringify(result, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decode failed');
      setDecoded(null);
      setExpStatus(null);
    }
  };

  return (
    <>
      <InputArea
        label="TOKEN_INPUT"
        value={token}
        onChange={setToken}
        placeholder="Paste your JWT token here..."
        rows={3}
      />

      <div className={styles.actions}>
        <ActionButton onClick={handleDecode}>DECODE</ActionButton>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorDot} />
          <span>{error}</span>
        </div>
      )}

      {decoded && (
        <>
          <div className={styles.decodedSection}>
            <span className={styles.label}>// DECODED_OUTPUT</span>
            <div className={styles.panels}>
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <span className={styles.panelTitle}>HEADER</span>
                  <CopyButton
                    onClick={() =>
                      headerClip.copy(JSON.stringify(decoded.header, null, 2))
                    }
                    copied={headerClip.copied}
                  />
                </div>
                <pre className={styles.code}>
                  {JSON.stringify(decoded.header, null, 2)}
                </pre>
              </div>
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <span className={styles.panelTitle}>PAYLOAD</span>
                  <CopyButton
                    onClick={() =>
                      payloadClip.copy(JSON.stringify(decoded.payload, null, 2))
                    }
                    copied={payloadClip.copied}
                  />
                </div>
                <pre className={styles.code}>
                  {JSON.stringify(decoded.payload, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {expStatus && (
            <div
              className={`${styles.expBar} ${expStatus.isExpired ? styles.expired : styles.valid}`}
            >
              <div className={styles.expLeft}>
                <span className={styles.expDot} />
                <span className={styles.expText}>
                  {expStatus.isExpired
                    ? 'TOKEN EXPIRED'
                    : expStatus.timeLeft
                      ? `TOKEN VALID — Expires in ${expStatus.timeLeft}`
                      : 'TOKEN VALID — No expiration set'}
                </span>
              </div>
              <div className={styles.expBadge}>
                {expStatus.isExpired ? 'EXPIRED' : 'VALID'}
              </div>
            </div>
          )}
        </>
      )}

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>
            {decoded
              ? 'READY — Token decoded successfully'
              : 'READY — Waiting for token'}
          </span>
        </div>
        <span className={styles.statusRight}>JWT_HS256</span>
      </div>
    </>
  );
}
