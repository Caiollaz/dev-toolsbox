import { useState } from 'react';
import { ActionButton } from '../shared/action-button';
import { useClipboard } from '../../hooks/use-clipboard';
import { parseInterface, generateMockData, formatAsJson, formatAsCsv } from '../../services/mock-generator.service';
import styles from './mock-generator-tool.module.css';

type OutputFormat = 'json' | 'csv';

export function MockGeneratorTool() {
  const [input, setInput] = useState('');
  const [count, setCount] = useState(5);
  const [format, setFormat] = useState<OutputFormat>('json');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { copy, copied } = useClipboard();

  const handleGenerate = () => {
    try {
      setError(null);
      const fields = parseInterface(input);
      if (fields.length === 0) {
        setError('No fields found. Use the format: name: type (one per line)');
        return;
      }
      const data = generateMockData(fields, count);
      setOutput(format === 'json' ? formatAsJson(data) : formatAsCsv(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setOutput('');
    }
  };

  return (
    <>
      <div className={styles.inputSection}>
        <span className={styles.label}>// INTERFACE_DEFINITION</span>
        <div className={styles.inputBox}>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'id: string\nname: string\nemail: string\nage: number\nactive: boolean\ncreatedAt: date'}
            spellCheck={false}
            rows={8}
          />
        </div>
      </div>

      <div className={styles.optionsRow}>
        <div className={styles.optionGroup}>
          <span className={styles.optionLabel}>COUNT</span>
          <input
            type="number"
            className={styles.countInput}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
            min={1}
            max={100}
          />
        </div>
        <div className={styles.optionGroup}>
          <span className={styles.optionLabel}>FORMAT</span>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${format === 'json' ? styles.tabActive : ''}`}
              onClick={() => setFormat('json')}
            >
              JSON
            </button>
            <button
              className={`${styles.tab} ${format === 'csv' ? styles.tabActive : ''}`}
              onClick={() => setFormat('csv')}
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <ActionButton onClick={handleGenerate} disabled={!input.trim()}>
          GENERATE
        </ActionButton>
        <ActionButton onClick={() => copy(output)} variant="secondary" disabled={!output}>
          {copied ? 'COPIED!' : 'COPY'}
        </ActionButton>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorDot} />
          <span>{error}</span>
        </div>
      )}

      {output && (
        <div className={styles.outputSection}>
          <span className={styles.label}>// GENERATED_DATA</span>
          <div className={styles.outputBox}>
            <pre className={styles.outputCode}>{output}</pre>
          </div>
        </div>
      )}

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>
            {output
              ? `READY — ${count} records generated (${format.toUpperCase()})`
              : 'READY — Define fields to generate mock data'}
          </span>
        </div>
        <span className={styles.statusRight}>MOCK_GEN</span>
      </div>
    </>
  );
}
