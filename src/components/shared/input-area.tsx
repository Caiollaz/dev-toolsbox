import styles from './input-area.module.css';

interface InputAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function InputArea({
  label,
  value,
  onChange,
  placeholder = 'Enter your text here...',
  rows = 6,
}: InputAreaProps) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>// {label}</span>
      <div className={styles.box}>
        <textarea
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
