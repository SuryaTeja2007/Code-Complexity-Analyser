import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trash2, RotateCcw, FileText, Info, AlertCircle } from 'lucide-react';
import { useCodeContext } from '../hooks/useCodeContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { FileUpload } from '../components/FileUpload';
import { CodeEditor } from '../components/CodeEditor';
import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

export const AnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    language,
    code,
    activeFilename,
    setLanguage,
    setCode,
    setActiveFilename,
    setValidationError,
    setInfoNotification,
    loadSampleCode,
    clearCode,
    recordSubmission,
  } = useCodeContext();

  // Metrics for the code editor status bar
  const lineCount = useMemo(() => {
    if (!code) return 0;
    return code.split('\n').length;
  }, [code]);

  const charCount = useMemo(() => {
    return code.length;
  }, [code]);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setInfoNotification(`Switched syntax highlighting to ${SUPPORTED_LANGUAGES[newLang].name}.`);
  };

  const handleFileLoaded = (
    content: string,
    detectedLang: SupportedLanguage,
    filename: string
  ) => {
    setCode(content);
    setLanguage(detectedLang);
    setActiveFilename(filename);
    setValidationError(null);
    setInfoNotification(
      `Successfully loaded "${filename}" (${SUPPORTED_LANGUAGES[detectedLang].name}).`
    );
  };

  const handleAnalyzeClick = () => {
    if (!code || code.trim().length === 0) {
      setValidationError(
        'Code editor is empty. Please enter a code snippet, function, or upload a source file before analyzing.'
      );
      return;
    }

    // Record submission into context so Results page has the context
    const isValid = recordSubmission();
    if (isValid) {
      // In Phase 1: Navigate to /results which renders the future dashboard structure with clean empty states
      navigate('/results');
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Workspace Header / Purpose notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Analyzer Workspace
            <span className="text-xs font-normal font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              Frontend Mode
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Write or paste a complete program, method, or code snippet. You can also upload a source file.
          </p>
        </div>

        {/* Phase 1 Advisory */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-600 dark:text-zinc-300 shrink-0">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Phase 1: Editor & Layout Verification</span>
        </div>
      </div>

      {/* Top Controls: File Upload & Language Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* File Upload Zone */}
        <div className="lg:col-span-6">
          <FileUpload
            onFileLoaded={handleFileLoaded}
            onError={(msg) => setValidationError(msg)}
            activeFilename={activeFilename}
          />
        </div>

        {/* Language Selection & Preset Sample */}
        <div className="lg:col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <LanguageSelector
            currentLanguage={language}
            onSelectLanguage={handleLanguageChange}
          />

          <button
            type="button"
            id="load-sample-btn"
            onClick={() => loadSampleCode(language)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 self-start sm:self-auto"
            title="Load editable sample snippet for this language"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Load Sample</span>
          </button>
        </div>
      </div>

      {/* Code Editor Section */}
      <div className="flex-1 flex flex-col">
        {/* Editor Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-t-lg border-t border-x border-zinc-200 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                {activeFilename ? activeFilename : `Editor (${SUPPORTED_LANGUAGES[language].name})`}
              </span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
              Editable snippet, method, or program
            </span>
          </div>

          <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
            <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
            <span>•</span>
            <span>{charCount} chars</span>
          </div>
        </div>

        {/* Monaco Editor */}
        <CodeEditor
          code={code}
          language={language}
          onChange={(newVal) => setCode(newVal || '')}
          height="520px"
        />
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Info className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>
            Clicking <strong>Analyze Code</strong> validates code and opens the Results view. Analysis engine will be connected in Phase 2.
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            id="clear-code-btn"
            onClick={clearCode}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <Trash2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            id="analyze-code-btn"
            onClick={handleAnalyzeClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Analyze Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};
