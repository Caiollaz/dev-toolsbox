import { useMemo, useState } from 'react';
import { ActionButton } from '../shared/action-button';
import { useClipboard } from '../../hooks/use-clipboard';
import { markdownToHtml } from '../../services/markdown-preview.service';
import styles from './markdown-preview-tool.module.css';

const EXAMPLE_MD = `# Hello World

This is a **Markdown** preview tool. It supports:

## Features

- **Bold** and *italic* text
- \`Inline code\` blocks
- [Links](https://example.com)
- Lists and blockquotes

> This is a blockquote

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

---

Made with DEXT.`;

export function MarkdownPreviewTool() {
  const [input, setInput] = useState(EXAMPLE_MD);
  const { copy, copied } = useClipboard();

  const html = useMemo(() => {
    if (!input.trim()) return '';
    return markdownToHtml(input);
  }, [input]);

  const handleCopyHtml = () => {
    copy(html);
  };

  const handleCopyMd = () => {
    copy(input);
  };

  return (
    <>
      <div className={styles.splitView}>
        <div className={styles.editorPane}>
          <span className={styles.label}>// MARKDOWN_EDITOR</span>
          <div className={styles.editorBox}>
            <textarea
              className={styles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write your Markdown here..."
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.previewPane}>
          <span className={styles.label}>// PREVIEW</span>
          <div className={styles.previewBox}>
            <div
              className={styles.preview}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <ActionButton onClick={handleCopyHtml} disabled={!html}>
          {copied ? 'COPIED!' : 'COPY HTML'}
        </ActionButton>
        <ActionButton onClick={handleCopyMd} variant="secondary" disabled={!input.trim()}>
          COPY MD
        </ActionButton>
      </div>

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>
            {input.trim()
              ? `READY — ${input.length} chars, ${input.split('\n').length} lines`
              : 'READY — Write Markdown to preview'}
          </span>
        </div>
        <span className={styles.statusRight}>MARKDOWN</span>
      </div>
    </>
  );
}
