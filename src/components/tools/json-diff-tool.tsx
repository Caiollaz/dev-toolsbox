import { useState } from 'react';
import { ActionButton } from '../shared/action-button';
import { compareJson } from '../../services/json-diff.service';
import type { DiffEntry } from '../../services/json-diff.service';
import { useHistory } from '../../hooks/use-history';
import styles from './json-diff-tool.module.css';

export function JsonDiffTool() {
  const [jsonA, setJsonA] = useState('');
  const [jsonB, setJsonB] = useState('');
  const [diffs, setDiffs] = useState<DiffEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasCompared, setHasCompared] = useState(false);
  const { addEntry } = useHistory('json-diff');

  const handleCompare = () => {
    try {
      setError(null);
      const result = compareJson(jsonA, jsonB);
      setDiffs(result);
      setHasCompared(true);
      addEntry(`${jsonA}\n---\n${jsonB}`, JSON.stringify(result, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setDiffs([]);
      setHasCompared(false);
    }
  };

  const handleClear = () => {
    setJsonA('');
    setJsonB('');
    setDiffs([]);
    setError(null);
    setHasCompared(false);
  };

  const added = diffs.filter((d) => d.type === 'added');
  const removed = diffs.filter((d) => d.type === 'removed');
  const changed = diffs.filter((d) => d.type === 'changed');

  const symbolMap = { added: '+', removed: '-', changed: '~' };
  const colorMap = { added: 'green', removed: 'red', changed: 'orange' };

  const formatValue = (val: unknown) =>
    typeof val === 'string' ? `"${val}"` : String(val);

  return (
    <>
      <div className={styles.inputRow}>
        <div className={styles.inputPanel}>
          <span className={styles.label}>// JSON_A</span>
          <textarea
            className={styles.textarea}
            value={jsonA}
            onChange={(e) => setJsonA(e.target.value)}
            placeholder='{\n  "key": "value"\n}'
            spellCheck={false}
          />
        </div>
        <div className={styles.inputPanel}>
          <span className={styles.label}>// JSON_B</span>
          <textarea
            className={styles.textarea}
            value={jsonB}
            onChange={(e) => setJsonB(e.target.value)}
            placeholder='{\n  "key": "value"\n}'
            spellCheck={false}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <ActionButton onClick={handleCompare}>COMPARE</ActionButton>
        <ActionButton onClick={handleClear} variant="secondary">
          CLEAR
        </ActionButton>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorDot} />
          <span>{error}</span>
        </div>
      )}

      {hasCompared && (
        <div className={styles.diffSection}>
          <span className={styles.label}>// DIFF_RESULT</span>
          <div className={styles.diffBox}>
            <div className={styles.diffHead}>
              <span className={styles.diffTitle}>
                {diffs.length} DIFFERENCE{diffs.length !== 1 ? 'S' : ''} FOUND
              </span>
              <div className={styles.badges}>
                {added.length > 0 && (
                  <span className={`${styles.badge} ${styles.badgeGreen}`}>
                    +{added.length} ADDED
                  </span>
                )}
                {removed.length > 0 && (
                  <span className={`${styles.badge} ${styles.badgeRed}`}>
                    -{removed.length} REMOVED
                  </span>
                )}
                {changed.length > 0 && (
                  <span className={`${styles.badge} ${styles.badgeOrange}`}>
                    ~{changed.length} CHANGED
                  </span>
                )}
              </div>
            </div>

            {diffs.map((diff, i) => (
              <div key={i} className={styles.diffRow}>
                <span
                  className={styles.diffSymbol}
                  data-color={colorMap[diff.type]}
                >
                  {symbolMap[diff.type]}
                </span>
                <span className={styles.diffKey}>{diff.key}</span>
                {diff.type === 'changed' && (
                  <>
                    <span className={styles.diffOld}>
                      {formatValue(diff.oldValue)}
                    </span>
                    <span className={styles.diffArrow}>→</span>
                    <span className={styles.diffNew}>
                      {formatValue(diff.newValue)}
                    </span>
                  </>
                )}
                {diff.type === 'removed' && (
                  <span className={styles.diffOld}>
                    {formatValue(diff.oldValue)}
                  </span>
                )}
                {diff.type === 'added' && (
                  <span className={styles.diffNew}>
                    {formatValue(diff.newValue)}
                  </span>
                )}
              </div>
            ))}

            {diffs.length === 0 && (
              <div className={styles.noDiff}>
                Objects are identical — no differences found.
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>
            {hasCompared
              ? `READY — ${diffs.length} difference${diffs.length !== 1 ? 's' : ''} found`
              : 'READY — Waiting for input'}
          </span>
        </div>
        <span className={styles.statusRight}>JSON_DIFF</span>
      </div>
    </>
  );
}
