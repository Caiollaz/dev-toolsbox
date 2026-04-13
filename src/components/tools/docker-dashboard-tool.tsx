import { useState, useEffect, useCallback } from 'react';
import { Container, RefreshCw, Loader2 } from 'lucide-react';
import {
  dockerList,
  dockerStart,
  dockerStop,
  dockerRestart,
  dockerLogs,
  isTauriEnvironment,
  getStateColor,
} from '../../services/docker-dashboard.service';
import type { ContainerInfo, DockerStats } from '../../services/docker-dashboard.service';
import styles from './docker-dashboard-tool.module.css';

export function DockerDashboardTool() {
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [stats, setStats] = useState<DockerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logsContainer, setLogsContainer] = useState<string | null>(null);
  const [logsContent, setLogsContent] = useState<string[]>([]);
  const [isTauri, setIsTauri] = useState<boolean | null>(null);

  useEffect(() => {
    setIsTauri(isTauriEnvironment());
  }, []);

  const fetchContainers = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const [containerList, dockerStats] = await dockerList();
      setContainers(containerList);
      setStats(dockerStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list containers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount (only in Tauri)
  useEffect(() => {
    if (isTauri === true) {
      fetchContainers();
    }
  }, [isTauri, fetchContainers]);

  const handleAction = async (containerId: string, action: 'start' | 'stop' | 'restart') => {
    setActionLoading(containerId);
    try {
      if (action === 'start') await dockerStart(containerId);
      else if (action === 'stop') await dockerStop(containerId);
      else if (action === 'restart') await dockerRestart(containerId);

      // Refresh list after action
      await fetchContainers();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} container`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewLogs = async (containerId: string) => {
    if (logsContainer === containerId) {
      setLogsContainer(null);
      setLogsContent([]);
      return;
    }

    try {
      const logs = await dockerLogs(containerId, 100);
      setLogsContainer(containerId);
      setLogsContent(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    }
  };

  const getStateBadgeClass = (state: string): string => {
    const color = getStateColor(state);
    switch (color) {
      case 'running': return styles.stateRunning;
      case 'exited': return styles.stateExited;
      case 'paused': return styles.statePaused;
      case 'restarting': return styles.stateRestarting;
      default: return styles.stateUnknown;
    }
  };

  // ── Desktop-only guard ─────────────────────────────

  if (isTauri === false) {
    return (
      <div className={styles.desktopOnly}>
        <div className={styles.desktopOnlyIcon}>
          <Container size={32} />
        </div>
        <h3 className={styles.desktopOnlyTitle}>DESKTOP ONLY FEATURE</h3>
        <p className={styles.desktopOnlyDesc}>
          Docker Dashboard requires the DEXT desktop app to manage Docker containers.
          Download the app to use this tool.
        </p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────

  return (
    <>
      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>RUNNING</span>
            <span className={styles.statValue}>{stats.running}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>STOPPED</span>
            <span className={styles.statValue}>{stats.stopped}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>IMAGES</span>
            <span className={styles.statValue}>—</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>VOLUMES</span>
            <span className={styles.statValue}>—</span>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className={styles.actions}>
        <button
          className={styles.refreshBtn}
          onClick={fetchContainers}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={14} className={styles.spinner} />
          ) : (
            <RefreshCw size={14} />
          )}
          <span>{loading ? 'LOADING...' : 'REFRESH'}</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <span className={styles.errorDot} />
          <span>{error}</span>
        </div>
      )}

      {/* Containers Table */}
      <div className={styles.containersTable}>
        <div className={styles.tableHeader}>
          <span className={styles.tableHeaderCell}>NAME</span>
          <span className={styles.tableHeaderCell}>IMAGE</span>
          <span className={styles.tableHeaderCell}>STATE</span>
          <span className={styles.tableHeaderCell}>PORTS</span>
          <span className={styles.tableHeaderCell}>ACTIONS</span>
        </div>
        {containers.length === 0 ? (
          <div className={styles.emptyTable}>
            {loading ? 'Loading containers...' : 'No containers found'}
          </div>
        ) : (
          containers.map((c) => (
            <div key={c.id} className={styles.tableRow}>
              <span className={styles.nameCell} title={c.id}>{c.name}</span>
              <span className={styles.imageCell} title={c.image}>{c.image}</span>
              <span className={styles.stateCell}>
                <span className={`${styles.stateBadge} ${getStateBadgeClass(c.state)}`}>
                  {c.state.toUpperCase()}
                </span>
              </span>
              <span className={styles.portsCell} title={c.ports}>{c.ports}</span>
              <span className={styles.actionsCell}>
                {c.state === 'running' ? (
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnStop}`}
                    onClick={() => handleAction(c.id, 'stop')}
                    disabled={actionLoading === c.id}
                  >
                    STOP
                  </button>
                ) : (
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnStart}`}
                    onClick={() => handleAction(c.id, 'start')}
                    disabled={actionLoading === c.id}
                  >
                    START
                  </button>
                )}
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnLogs}`}
                  onClick={() => handleViewLogs(c.id)}
                >
                  LOGS
                </button>
              </span>
            </div>
          ))
        )}
      </div>

      {/* Logs Panel */}
      {logsContainer && (
        <div className={styles.logsPanel}>
          <div className={styles.logsPanelHeader}>
            <span className={styles.logsPanelLabel}>
              // LOGS — {containers.find((c) => c.id === logsContainer)?.name || logsContainer}
            </span>
            <button
              className={styles.logsPanelClose}
              onClick={() => { setLogsContainer(null); setLogsContent([]); }}
            >
              CLOSE
            </button>
          </div>
          <div className={styles.logsPanelContent}>
            {logsContent.length === 0 ? (
              <span className={styles.logLine} style={{ color: 'var(--text-muted)' }}>No logs available</span>
            ) : (
              logsContent.map((line, i) => (
                <div key={i} className={styles.logLine}>{line}</div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={`${styles.statusDot} ${loading ? styles.statusDotLoading : ''}`} />
          <span className={styles.statusText}>
            {loading
              ? 'LOADING...'
              : stats
                ? `READY — ${stats.total} containers (${stats.running} running, ${stats.stopped} stopped)`
                : error
                  ? 'ERROR — Failed to connect to Docker'
                  : 'READY — Connecting to Docker...'}
          </span>
        </div>
        <span className={styles.statusRight}>DOCKER</span>
      </div>
    </>
  );
}
