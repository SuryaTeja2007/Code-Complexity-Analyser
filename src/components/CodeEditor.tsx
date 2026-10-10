import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { KeyCode, KeyMod } from 'monaco-editor';
import { useTheme } from '../hooks/useTheme';
import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languages';
import { Loader2 } from 'lucide-react';

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
  const langConfig = SUPPORTED_LANGUAGES[language];
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light';

  const handleEditorDidMount: OnMount = (editor) => {
    // Focus editor on initial mount if desired
    if (onAnalyze) {
      editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, onAnalyze);
    }
    editor.updateOptions({
      tabSize,
      insertSpaces: true,
    });
  };

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
