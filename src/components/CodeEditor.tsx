import React, { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { KeyCode, KeyMod, MarkerSeverity, type editor as MonacoEditor, type IDisposable } from 'monaco-editor';
import { useTheme } from '../hooks/useTheme';
import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languages';
import { Loader2 } from 'lucide-react';


type SyntaxIssue = { line: number; column: number; message: string };

function findSyntaxIssues(code: string, language: SupportedLanguage): SyntaxIssue[] {
  const issues: SyntaxIssue[] = [];
  const lines = code.split(/\r?\n/);
  const stack: Array<{ char: string; line: number; column: number }> = [];
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  let inBlockComment = false;

  lines.forEach((rawLine, lineIndex) => {
    let quote: string | null = null;
    let escaped = false;
    for (let i = 0; i < rawLine.length; i++) {
      const ch = rawLine[i];
      const next = rawLine[i + 1];
      if (language !== 'python' && inBlockComment) {
        if (ch === '*' && next === '/') { inBlockComment = false; i++; }
        continue;
      }
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || (language !== 'python' && ch === '`')) { quote = ch; continue; }
      if (language !== 'python' && ch === '/' && next === '/') break;
      if (language === 'python' && ch === '#') break;
      if (language !== 'python' && ch === '/' && next === '*') { inBlockComment = true; i++; continue; }
      if (ch === '(' || ch === '[' || ch === '{') stack.push({ char: ch, line: lineIndex + 1, column: i + 1 });
      else if (ch === ')' || ch === ']' || ch === '}') {
        const last = stack[stack.length - 1];
        if (!last || last.char !== pairs[ch]) {
          issues.push({ line: lineIndex + 1, column: i + 1, message: `Unexpected '${ch}' — check the matching opening bracket.` });
        } else stack.pop();
      }
    }

    if (language === 'python') {
      const trimmed = rawLine.trim();
      if (/^(if|elif|else|for|while|def|class|try|except|finally|with)\b/.test(trimmed) && !trimmed.endsWith(':') && !trimmed.endsWith('\')) {
        issues.push({ line: lineIndex + 1, column: Math.max(1, rawLine.length), message: 'Expected a colon (:) at the end of this statement.' });
      }
    }
  });

  stack.forEach(open => issues.push({
    line: open.line,
    column: open.column,
    message: `'${open.char}' is not closed.`,
  }));
  return issues;
}

function updateSyntaxMarkers(
  editor: MonacoEditor.IStandaloneCodeEditor,
  monaco: typeof import('monaco-editor'),
  language: SupportedLanguage,
) {
  const model = editor.getModel();
  if (!model) return;
  const issues = findSyntaxIssues(model.getValue(), language);
  monaco.editor.setModelMarkers(model, 'code-syntax-check', issues.map(issue => ({
    startLineNumber: issue.line,
    endLineNumber: issue.line,
    startColumn: issue.column,
    endColumn: issue.column + 1,
    message: `Syntax error on line ${issue.line}: ${issue.message}`,
    severity: MarkerSeverity.Error,
  })));
}
\n
interface CodeEditorProps {
  code: string;
  language: SupportedLanguage;
  onChange: (value: string | undefined) => void;
  onAnalyze?: () => void;
  fontSize?: number;
  tabSize?: number;
  height?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
  onAnalyze,
  fontSize = 13.5,
  tabSize = 4,
  height = '500px',
}) => {
  const { theme } = useTheme();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const previousTabSizeRef = useRef(tabSize);
  const syntaxDiagnosticsRef = useRef<IDisposable | null>(null);
  const langConfig = SUPPORTED_LANGUAGES[language];
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light';

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    syntaxDiagnosticsRef.current?.dispose();
    syntaxDiagnosticsRef.current = editor.onDidChangeModelContent(() => {
      updateSyntaxMarkers(editor, monaco, language);
    });
    updateSyntaxMarkers(editor, monaco, language);
    // Focus editor on initial mount if desired
    if (onAnalyze) {
      editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, onAnalyze);
    }
    editor.updateOptions({
      tabSize,
      insertSpaces: true,
    });
  };

  useEffect(() => {
    const editor = editorRef.current;
    editor?.updateOptions({ fontSize, tabSize, insertSpaces: true });
    if (editor && previousTabSizeRef.current !== tabSize) {
      void editor.getAction('editor.action.reindentlines')?.run();
    }
    previousTabSizeRef.current = tabSize;
  }, [fontSize, tabSize, language]);

  return (
    <div
      id="monaco-editor-container"
      className="w-full rounded-b-lg overflow-hidden border-x border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-inner"
    >
      <Editor
        height={height}
        language={langConfig.monacoLanguage}
        value={code}
        theme={monacoTheme}
        onChange={onChange}
        onMount={handleEditorDidMount}
        loading={
          <div className="h-[400px] flex flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-sm font-medium">Initializing Monaco Editor...</span>
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize,
          tabSize,
          insertSpaces: true,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: 'all',
          renderWhitespace: 'selection',
          wordWrap: 'on',
          bracketPairColorization: { enabled: true },
          formatOnPaste: true,
          formatOnType: true,
          accessibilitySupport: 'on',
        }}
      />
    </div>
  );
};
