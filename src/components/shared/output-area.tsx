import { useClipboard } from '../../hooks/use-clipboard';
import { CopyButton } from './copy-button';
import styles from './output-area.module.css';

interface OutputAreaProps {
  label: string;
  value: string;
  accent?: boolean;
}

export function OutputArea({ label, value, accent = true }: OutputAreaProps) {
  const { copy, copied } = useClipboard();

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>// {label}</span>
        <CopyButton onClick={() => copy(value)} copied={copied} />
      </div>
      <div className={styles.box}>
        <pre className={`${styles.content} ${accent ? styles.accent : ''}`}>
          {value || 'Output will appear here...'}
        </pre>
      </div>
    </div>
  );
}
