import { useRef, useEffect, useMemo } from 'react';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { sql, PostgreSQL, MySQL, SQLite } from '@codemirror/lang-sql';
import type { SQLDialect } from '@codemirror/lang-sql';
import { autocompletion } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, bracketMatching } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import styles from './sql-editor.module.css';

const DIALECT_MAP: Record<string, SQLDialect> = {
  postgresql: PostgreSQL,
  mysql: MySQL,
  sqlite: SQLite,
};

// DEXT industrial dark theme
const dextHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#00FF88', fontWeight: '600' },
  { tag: tags.operatorKeyword, color: '#00FF88' },
  { tag: tags.string, color: '#FF8800' },
  { tag: tags.number, color: '#4488FF' },
  { tag: tags.bool, color: '#4488FF' },
  { tag: tags.null, color: '#8A8A8A', fontStyle: 'italic' },
  { tag: tags.comment, color: '#6A6A6A', fontStyle: 'italic' },
  { tag: tags.punctuation, color: '#8A8A8A' },
  { tag: tags.bracket, color: '#8A8A8A' },
  { tag: tags.operator, color: '#FFFFFF' },
  { tag: tags.typeName, color: '#4488FF' },
  { tag: tags.propertyName, color: '#FFFFFF' },
  { tag: tags.variableName, color: '#FFFFFF' },
  { tag: tags.special(tags.string), color: '#FF8800' },
]);

const dextTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'transparent',
      color: '#FFFFFF',
      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
      fontSize: '12px',
      lineHeight: '1.8',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-content': {
      caretColor: '#00FF88',
      padding: '16px',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#00FF88',
      borderLeftWidth: '2px',
    },
    '.cm-selectionBackground': {
      backgroundColor: '#00FF8820 !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: '#00FF8830 !important',
    },
    '.cm-activeLine': {
      backgroundColor: '#FFFFFF05',
    },
    '.cm-gutters': {
      display: 'none',
    },
    '.cm-line': {
      padding: '0',
    },
    // Matching brackets
    '.cm-matchingBracket': {
      backgroundColor: '#00FF8820',
      color: '#00FF88 !important',
      outline: '1px solid #00FF8840',
    },
    // Autocomplete tooltip
    '.cm-tooltip': {
      backgroundColor: '#0A0A0A',
      border: '1px solid #2F2F2F',
      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
      fontSize: '11px',
    },
    '.cm-tooltip.cm-tooltip-autocomplete': {
      '& > ul': {
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        maxHeight: '200px',
      },
      '& > ul > li': {
        padding: '4px 10px',
        color: '#FFFFFF',
      },
      '& > ul > li[aria-selected]': {
        backgroundColor: '#00FF8815',
        color: '#FFFFFF',
      },
    },
    '.cm-completionLabel': {
      color: '#FFFFFF',
    },
    '.cm-completionMatchedText': {
      color: '#00FF88',
      textDecoration: 'none',
      fontWeight: '600',
    },
    '.cm-completionDetail': {
      color: '#6A6A6A',
      fontStyle: 'italic',
      marginLeft: '8px',
    },
    // Completion icons
    '.cm-completionIcon': {
      opacity: '0.6',
    },
    // Placeholder
    '.cm-placeholder': {
      color: '#6A6A6A',
      fontStyle: 'normal',
    },
  },
  { dark: true },
);

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute?: () => void;
  schema?: Record<string, string[]>;
  dialect?: 'postgresql' | 'mysql' | 'sqlite';
  placeholder?: string;
}

export function SqlEditor({
  value,
  onChange,
  onExecute,
  schema,
  dialect = 'postgresql',
  placeholder = 'SELECT * FROM users LIMIT 100;',
}: SqlEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const sqlCompartment = useMemo(() => new Compartment(), []);
  const onChangeRef = useRef(onChange);
  const onExecuteRef = useRef(onExecute);

  // Keep refs up to date
  onChangeRef.current = onChange;
  onExecuteRef.current = onExecute;

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const sqlDialect = DIALECT_MAP[dialect] || PostgreSQL;
    const sqlExtension = sql({
      dialect: sqlDialect,
      schema: schema || {},
      upperCaseKeywords: true,
    });

    const executeKeymap = keymap.of([
      {
        key: 'Ctrl-Enter',
        mac: 'Cmd-Enter',
        run: () => {
          onExecuteRef.current?.();
          return true;
        },
      },
    ]);

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        executeKeymap,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        bracketMatching(),
        sqlCompartment.of(sqlExtension),
        autocompletion({
          activateOnTyping: true,
          maxRenderedOptions: 12,
        }),
        syntaxHighlighting(dextHighlight),
        dextTheme,
        cmPlaceholder(placeholder),
        updateListener,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only run on mount - schema/dialect changes handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update schema/dialect dynamically via Compartment
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const sqlDialect = DIALECT_MAP[dialect] || PostgreSQL;
    const sqlExtension = sql({
      dialect: sqlDialect,
      schema: schema || {},
      upperCaseKeywords: true,
    });

    view.dispatch({
      effects: sqlCompartment.reconfigure(sqlExtension),
    });
  }, [schema, dialect, sqlCompartment]);

  // Sync external value changes (e.g. when user clicks a table to generate SELECT)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={containerRef} className={styles.sqlEditor} />;
}
