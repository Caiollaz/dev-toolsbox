import { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Eye, Square } from 'lucide-react';
import {
  logReadFile,
  logWatchStart,
  logWatchStop,
  isTauriEnvironment,
  getTauriEventApi,
  filterLogLines,
  LOG_LEVELS,
} from '../../services/log-tail-viewer.service';
import type { LogLine, LogLevel } from '../../services/log-tail-viewer.service';
import styles from './log-tail-viewer-tool.module.css';

export function LogTailViewerTool() {
  const [filePath, setFilePath] = useState('');
  const [lines, setLines] = useState<LogLine[]>([]);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel>('all');
  const [watching, setWatching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTauri, setIsTauri] = useState<boolean | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsTauri(isTauriEnvironment());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unlistenRef.current?.();
      logWatchStop().catch(() => {});
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [lines, scrollToBottom]);

  const handleLoadFile = async () => {
    if (!filePath.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const data = await logReadFile(filePath.trim(), 200);
      setLines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setLoading(false);
    }
  };

  const handleWatch = async () => {
    if (watching) {
      // Stop watching
      try {
        await logWatchStop();
        unlistenRef.current?.();
        unlistenRef.current = null;
        setWatching(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to stop watching');
      }
      return;
    }

    if (!filePath.trim()) return;
    setError(null);

    try {
      // First load existing content
      const data = await logReadFile(filePath.trim(), 200);
      setLines(data);

      // Listen for new lines
      const eventApi = await getTauriEventApi();
      if (eventApi) {
        const unlisten = await eventApi.listen<LogLine[]>('log-new-lines', (event) => {
          setLines((prev) => [...prev, ...event.payload]);
        });
        unlistenRef.current = unlisten;
      }

      // Start file watcher
      await logWatchStart(filePath.trim());
      setWatching(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start watching');
    }
  };

  const getLevelBtnClass = (level: LogLevel): string => {
    if (levelFilter !== level) return styles.levelBtn;
    switch (level) {
      case 'error': return `${styles.levelBtn} ${styles.levelBtnError}`;
      case 'warn': return `${styles.levelBtn} ${styles.levelBtnWarn}`;
      case 'info': return `${styles.levelBtn} ${styles.levelBtnInfo}`;
      case 'debug': return `${styles.levelBtn} ${styles.levelBtnDebug}`;
      default: return `${styles.levelBtn} ${styles.levelBtnActive}`;
    }
  };

  const getLogLevelClass = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'error': return styles.logLevelError;
      case 'warn': return styles.logLevelWarn;
      case 'info': return styles.logLevelInfo;
      case 'debug': return styles.logLevelDebug;
      case 'trace': return styles.logLevelTrace;
      default: return '';
    }
  };

  const filteredLines = filterLogLines(lines, levelFilter, filter);
  const errorCount = lines.filter((l) => l.level === 'error').length;
  const warnCount = lines.filter((l) => l.level === 'warn').length;

  // ── Desktop-only guard ─────────────────────────────

  if (isTauri === false) {
    return (
      <div className={styles.desktopOnly}>
        <div className={styles.desktopOnlyIcon}>
          <FileText size={32} />
        </div>
        <h3 className={styles.desktopOnlyTitle}>DESKTOP ONLY FEATURE</h3>
        <p className={styles.desktopOnlyDesc}>
          Log Tail Viewer requires the DEXT desktop app to read and watch log files.
          Download the app to use this tool.
        </p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────

  return (
    <>
      {/* File Path Bar */}
      <div className={styles.fileBar}>
        <input
          type="text"
          className={styles.fileInput}
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="/var/log/app/server.log"
          onKeyDown={(e) => { if (e.key === 'Enter') handleLoadFile(); }}
        />
        <button
          className={`${styles.watchBtn} ${watching ? styles.watchBtnActive : ''}`}
          onClick={handleWatch}
        >
          {watching ? (
            <>
              <Square size={14} />
              <span>STOP</span>
            </>
          ) : (
            <>
              <Eye size={14} />
              <span>WATCH</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <input
          type="text"
          className={styles.filterInput}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter logs..."
        />
        <div className={styles.levelBtns}>
          {LOG_LEVELS.map((level) => (
            <button
              key={level}
              className={getLevelBtnClass(level)}
              onClick={() => setLevelFilter(level)}
            >
              {level.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <span className={styles.errorDot} />
          <span>{error}</span>
        </div>
      )}

      {/* Log Output */}
      <div className={styles.logOutput}>
        {filteredLines.length === 0 ? (
          <div className={styles.emptyLog}>
            {loading ? 'Loading...' : lines.length === 0 ? 'Enter a file path and start watching...' : 'No lines match current filters'}
          </div>
        ) : (
          filteredLines.map((line, i) => (
            <div key={`${line.line_number}-${i}`} className={styles.logLine}>
              {line.timestamp && (
                <span className={styles.logTimestamp}>{line.timestamp}</span>
              )}
              <span className={`${styles.logLevel} ${getLogLevelClass(line.level)}`}>
                {line.level.toUpperCase()}
              </span>
              <span className={styles.logContent}>{line.content}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span
            className={`${styles.statusDot} ${
              watching ? styles.statusDotWatching : !lines.length ? styles.statusDotIdle : ''
            }`}
          />
          <span className={styles.statusText}>
            {watching
              ? `WATCHING — ${filteredLines.length} lines (${errorCount} errors, ${warnCount} warnings)`
              : lines.length > 0
                ? `READY — ${filteredLines.length} lines (${errorCount} errors, ${warnCount} warnings)`
                : 'READY — Enter a file path to start'}
          </span>
        </div>
        <span className={styles.statusRight}>LOG_TAIL</span>
      </div>
    </>
  );
}
