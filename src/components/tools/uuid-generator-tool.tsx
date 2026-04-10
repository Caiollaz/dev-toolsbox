import { useState } from 'react';
import { ActionButton } from '../shared/action-button';
import { CopyButton } from '../shared/copy-button';
import { generateUuidV4 } from '../../services/uuid.service';
import { useHistory } from '../../hooks/use-history';
import { useClipboard } from '../../hooks/use-clipboard';
import styles from './uuid-generator-tool.module.css';

interface UuidEntry {
  uuid: string;
  createdAt: Date;
}

export function UuidGeneratorTool() {
  const [currentUuid, setCurrentUuid] = useState(() => generateUuidV4());
  const [history, setHistory] = useState<UuidEntry[]>([]);
  const { copy, copied } = useClipboard();
  const { addEntry } = useHistory('uuid-generator');

  const handleGenerate = () => {
    const uuid = generateUuidV4();
    setHistory((prev) => [{ uuid: currentUuid, createdAt: new Date() }, ...prev].slice(0, 20));
    setCurrentUuid(uuid);
    addEntry('generate', uuid);
  };

  const handleBulkGenerate = () => {
    const uuids: UuidEntry[] = Array.from({ length: 5 }, () => ({
      uuid: generateUuidV4(),
      createdAt: new Date(),
    }));
    setHistory((prev) => [...uuids, ...prev].slice(0, 20));
    setCurrentUuid(uuids[0].uuid);
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <>
      <div className={styles.uuidSection}>
        <span className={styles.label}>// GENERATED_UUID</span>
        <div className={styles.uuidBox}>
          <span className={styles.uuidValue}>{currentUuid}</span>
          <CopyButton onClick={() => copy(currentUuid)} copied={copied} />
        </div>
      </div>

      <div className={styles.actions}>
        <ActionButton onClick={handleGenerate}>GENERATE</ActionButton>
        <ActionButton onClick={handleBulkGenerate} variant="secondary">
          BULK GENERATE
        </ActionButton>
      </div>

      {history.length > 0 && (
        <div className={styles.historySection}>
          <span className={styles.label}>// HISTORY</span>
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>UUID</span>
              <span>GENERATED_AT</span>
            </div>
            {history.map((entry, i) => (
              <div
                key={`${entry.uuid}-${i}`}
                className={styles.tableRow}
                onClick={() => copy(entry.uuid)}
                title="Click to copy"
              >
                <span className={styles.rowUuid}>{entry.uuid}</span>
                <span className={styles.rowTime}>{getTimeAgo(entry.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>
            READY — UUID generated successfully
          </span>
        </div>
        <span className={styles.statusRight}>UUID_V4</span>
      </div>
    </>
  );
}
