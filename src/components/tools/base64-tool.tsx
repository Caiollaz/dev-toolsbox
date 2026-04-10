import { useState } from 'react';
import { InputArea } from '../shared/input-area';
import { OutputArea } from '../shared/output-area';
import { ActionButton } from '../shared/action-button';
import { encodeBase64, decodeBase64 } from '../../services/base64.service';
import { useHistory } from '../../hooks/use-history';
import styles from './base64-tool.module.css';

export function Base64Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { addEntry } = useHistory('base64');

  const handleEncode = () => {
    try {
      setError(null);
      const result = encodeBase64(input);
      setOutput(result);
      addEntry(input, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encode failed');
      setOutput('');
    }
  };

  const handleDecode = () => {
    try {
      setError(null);
      const result = decodeBase64(input);
      setOutput(result);
      addEntry(input, result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decode failed');
      setOutput('');
    }
  };

  return (
    <>
      <InputArea
        label="INPUT"
        value={input}
        onChange={setInput}
        placeholder="Enter text to encode or Base64 string to decode..."
      />

      <div className={styles.actions}>
        <ActionButton onClick={handleEncode}>ENCODE</ActionButton>
        <ActionButton onClick={handleDecode} variant="secondary">
          DECODE
        </ActionButton>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorDot} />
          <span>{error}</span>
        </div>
      )}

      <OutputArea label="OUTPUT" value={output} />

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>
            {output
              ? `READY — ${output.length} bytes`
              : 'READY — Waiting for input'}
          </span>
        </div>
        <span className={styles.statusRight}>BASE64_UTF8</span>
      </div>
    </>
  );
}
