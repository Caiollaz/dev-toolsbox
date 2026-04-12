import { useState, useMemo } from 'react';
import { ActionButton } from '../shared/action-button';
import { useClipboard } from '../../hooks/use-clipboard';
import { jsonToTypeScript, validateJson, formatJson } from '../../services/json-to-typescript.service';
import styles from './json-to-typescript-tool.module.css';

export function JsonToTypescriptTool() {
  const [input, setInput] = useState('');
  const [rootName, setRootName] = useState('Root');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { copy, copied } = useClipboard();

  const validation = useMemo(() => {
    if (!input.trim()) return null;
    return validateJson(input);
  }, [input]);

  const handleGenerate = () => {
    try {
      setError(null);
      const result = jsonToTypeScript(input, rootName || 'Root');
      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert');
      setOutput('');
    }
  };

  const handleFormat = () => {
    try {
      setError(null);
      setInput(formatJson(input));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  return (
    <>
      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.label}>// JSON_INPUT</span>
            {validation && (
              <span className={validation.valid ? styles.validBadge : styles.invalidBadge}>
                {validation.valid ? 'VALID' : 'INVALID'}
              </span>
            )}
          </div>
          <div className={`${styles.inputBox} ${validation && !validation.valid ? styles.inputBoxError : ''}`}>
            <textarea
              className={styles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{\n  "name": "John Doe",\n  "age": 30,\n  "email": "john@example.com"\n}'
              spellCheck={false}
              rows={14}
            />
          </div>
          <div className={styles.rootNameRow}>
            <span className={styles.rootLabel}>INTERFACE NAME</span>
            <input
              className={styles.rootInput}
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder="Root"
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <span className={styles.label}>// TYPESCRIPT_OUTPUT</span>
            <button className={styles.copyBtn} onClick={() => copy(output)} disabled={!output}>
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>
          <div className={styles.outputBox}>
            <pre className={styles.outputCode}>
              {output || '// TypeScript interfaces will appear here...'}
            </pre>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <ActionButton onClick={handleGenerate} disabled={!input.trim() || (validation !== null && !validation.valid)}>
          GENERATE
        </ActionButton>
        <ActionButton onClick={handleFormat} variant="secondary" disabled={!input.trim()}>
          FORMAT
        </ActionButton>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorDot} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>
            {output
              ? `READY — ${output.split('\n').length} lines generated`
              : 'READY — Paste JSON to convert'}
          </span>
        </div>
        <span className={styles.statusRight}>JSON_TO_TS</span>
      </div>
    </>
  );
}
