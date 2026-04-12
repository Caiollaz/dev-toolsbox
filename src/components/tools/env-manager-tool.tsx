import { useState } from 'react';
import { ActionButton } from '../shared/action-button';
import { useClipboard } from '../../hooks/use-clipboard';
import { compareEnvFiles, generateEnvTemplate, mergeEnvFiles } from '../../services/env-manager.service';
import type { EnvDiff } from '../../services/env-manager.service';
import styles from './env-manager-tool.module.css';

export function EnvManagerTool() {
  const [envA, setEnvA] = useState('');
  const [envB, setEnvB] = useState('');
  const [diffs, setDiffs] = useState<EnvDiff[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasCompared, setHasCompared] = useState(false);
  const { copy, copied } = useClipboard();

  const handleCompare = () => {
    try {
      setError(null);
      const result = compareEnvFiles(envA, envB);
      setDiffs(result);
      setHasCompared(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compare failed');
      setDiffs([]);
    }
  };

  const handleGenerateTemplate = () => {
    const combined = envA || envB;
    if (!combined.trim()) {
      setError('Enter at least one .env file to generate a template');
      return;
    }
    const template = generateEnvTemplate(combined);
    copy(template);
  };

  const handleMerge = () => {
    if (!envA.trim() || !envB.trim()) {
      setError('Both .env files are required to merge');
      return;
    }
    const merged = mergeEnvFiles(envA, envB);
    copy(merged);
  };

  const stats = {
    added: diffs.filter((d) => d.type === 'added').length,
    removed: diffs.filter((d) => d.type === 'removed').length,
    changed: diffs.filter((d) => d.type === 'changed').length,
    equal: diffs.filter((d) => d.type === 'equal').length,
  };

  return (
    <>
      <div className={styles.inputRow}>
        <div className={styles.inputCol}>
          <span className={styles.label}>// ENV_BASE</span>
          <div className={styles.inputBox}>
            <textarea
              className={styles.textarea}
              value={envA}
              onChange={(e) => setEnvA(e.target.value)}
              placeholder={'DATABASE_URL=postgres://...\nAPI_KEY=sk_live_...\nNODE_ENV=development'}
              spellCheck={false}
              rows={10}
            />
          </div>
        </div>
        <div className={styles.inputCol}>
          <span className={styles.label}>// ENV_COMPARE</span>
          <div className={styles.inputBox}>
            <textarea
              className={styles.textarea}
              value={envB}
              onChange={(e) => setEnvB(e.target.value)}
              placeholder={'DATABASE_URL=postgres://...\nAPI_KEY=sk_live_...\nNODE_ENV=production'}
              spellCheck={false}
              rows={10}
            />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <ActionButton onClick={handleCompare}>COMPARE</ActionButton>
        <ActionButton onClick={handleGenerateTemplate} variant="secondary">
          {copied ? 'COPIED!' : 'GENERATE TEMPLATE'}
        </ActionButton>
        <ActionButton onClick={handleMerge} variant="secondary">
          MERGE
        </ActionButton>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorDot} />
          <span>{error}</span>
        </div>
      )}

      {hasCompared && diffs.length > 0 && (
        <div className={styles.diffSection}>
          <span className={styles.label}>// DIFF_RESULT</span>
          <div className={styles.diffTable}>
            {diffs.map((diff) => (
              <div key={diff.key} className={`${styles.diffRow} ${styles[diff.type]}`}>
                <span className={styles.diffSymbol}>
                  {diff.type === 'added' && '+'}
                  {diff.type === 'removed' && '−'}
                  {diff.type === 'changed' && '~'}
                  {diff.type === 'equal' && '='}
                </span>
                <span className={styles.diffKey}>{diff.key}</span>
                <span className={styles.diffValue}>
                  {diff.type === 'added' && diff.newValue}
                  {diff.type === 'removed' && diff.oldValue}
                  {diff.type === 'changed' && (
                    <>
                      <span className={styles.oldVal}>{diff.oldValue}</span>
                      <span className={styles.arrow}>→</span>
                      <span className={styles.newVal}>{diff.newValue}</span>
                    </>
                  )}
                  {diff.type === 'equal' && diff.oldValue}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>
            {hasCompared
              ? `READY — ${stats.added} added, ${stats.changed} changed, ${stats.removed} removed`
              : 'READY — Paste .env files to compare'}
          </span>
        </div>
        <span className={styles.statusRight}>ENV_MANAGER</span>
      </div>
    </>
  );
}
