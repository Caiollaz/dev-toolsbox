import { useState } from 'react';
import { ActionButton } from '../shared/action-button';
import { useClipboard } from '../../hooks/use-clipboard';
import { parseCurl, toFetchCode, toAxiosCode, toPythonCode, toGoCode } from '../../services/curl-converter.service';
import type { Language } from '../../services/curl-converter.service';
import styles from './curl-converter-tool.module.css';

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'fetch', label: 'FETCH' },
  { id: 'axios', label: 'AXIOS' },
  { id: 'python', label: 'PYTHON' },
  { id: 'go', label: 'GO' },
];

const generators: Record<Language, typeof toFetchCode> = {
  fetch: toFetchCode,
  axios: toAxiosCode,
  python: toPythonCode,
  go: toGoCode,
};

export function CurlConverterTool() {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<Language>('fetch');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { copy, copied } = useClipboard();

  const handleConvert = () => {
    try {
      setError(null);
      if (!input.trim()) {
        setError('Enter a cURL command to convert');
        return;
      }
      const parsed = parseCurl(input);
      if (!parsed.url) {
        setError('Could not find a URL in the cURL command');
        return;
      }
      const code = generators[language](parsed);
      setOutput(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
      setOutput('');
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    // Re-convert if there's existing input
    if (input.trim()) {
      try {
        const parsed = parseCurl(input);
        if (parsed.url) {
          setOutput(generators[lang](parsed));
          setError(null);
        }
      } catch {
        // Ignore — will show error on explicit convert
      }
    }
  };

  return (
    <>
      <div className={styles.inputSection}>
        <span className={styles.label}>// CURL_COMMAND</span>
        <div className={styles.inputBox}>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`curl -X POST https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer sk_token_xxx' \\
  -d '{"name": "John", "email": "john@example.com"}'`}
            spellCheck={false}
            rows={6}
          />
        </div>
      </div>

      <div className={styles.langRow}>
        <span className={styles.langLabel}>LANGUAGE</span>
        <div className={styles.tabs}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              className={`${styles.tab} ${language === lang.id ? styles.tabActive : ''}`}
              onClick={() => handleLanguageChange(lang.id)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <ActionButton onClick={handleConvert} disabled={!input.trim()}>
          CONVERT
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
          <span className={styles.label}>// {language.toUpperCase()}_CODE</span>
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
              ? `READY — Converted to ${language.toUpperCase()}`
              : 'READY — Paste a cURL command'}
          </span>
        </div>
        <span className={styles.statusRight}>CURL_CONVERT</span>
      </div>
    </>
  );
}
