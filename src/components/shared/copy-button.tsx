import styles from './copy-button.module.css';

interface CopyButtonProps {
  onClick: () => void;
  copied: boolean;
}

export function CopyButton({ onClick, copied }: CopyButtonProps) {
  return (
    <button className={styles.button} onClick={onClick}>
      <span className={styles.icon}>{copied ? 'check' : 'copy'}</span>
      <span className={styles.text}>{copied ? 'COPIED' : 'COPY'}</span>
    </button>
  );
}
