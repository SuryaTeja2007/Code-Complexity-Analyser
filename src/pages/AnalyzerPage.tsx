import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trash2, RotateCcw, FileText, Info, AlertCircle, Copy, Check, Minus, Plus, RotateCcw } from 'lucide-react';
import { useCodeContext } from '../hooks/useCodeContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { FileUpload } from '../components/FileUpload';
import { CodeEditor } from '../components/CodeEditor';
import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languages';
import { analyzerService } from '../services/analyzerService';

export const AnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(() => Number(localStorage.getItem('cca-editor-font-size')) || 13.5);
  const { language, code, activeFilename, setLanguage, setCode, setActiveFilename, setValidationError, setInfoNotification, loadSampleCode, clearCode, discardSavedDraft, hasRestoredDraft, recordSubmission } = useCodeContext();
  const lineCount = useMemo(() => (code ? code.split('\n').length : 0), [code]);
  const charCount = useMemo(() => code.length, [code]);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setInfoNotification(`Loaded editable ${SUPPORTED_LANGUAGES[newLang].name} code sample.`);
  };

  const handleFileLoaded = (content: string, fileLanguage: SupportedLanguage, filename: string) => {
    setLanguage(fileLanguage);
    setCode(content);
    setActiveFilename(filename);
    setValidationError(null);
    const isGenericFile = /\.(txt|pdf)$/i.test(filename);
    setInfoNotification(isGenericFile ? `Successfully loaded "${filename}" using ${SUPPORTED_LANGUAGES[fileLanguage].name} for analysis.` : `Successfully loaded "${filename}" (${SUPPORTED_LANGUAGES[fileLanguage].name}).`);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setInfoNotification('Editor contents copied to clipboard.');
      window.setTimeout(() => setCodeCopied(false), 1800);
    } catch {
      setValidationError('Could not access the clipboard. Check browser permissions and try again.');
    }
  };

  const handleAnalyzeClick = async () => {
    if (!code || code.trim().length === 0) {
      setValidationError('Code editor is empty. Please enter code or upload a source file before analyzing.');
      return;
    }
    if (!recordSubmission()) return;
    setIsAnalyzing(true);
    setValidationError(null);
    try {
      const result = await analyzerService.submitForAnalysis({ code, language, filename: activeFilename || undefined, options: { includeAst: true, includeOptimizations: true, includeCodeSmells: true } });
      setInfoNotification(result.message);
      navigate('/results', { state: { analysis: result } });
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Unable to reach the analysis server.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800"><h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Analyzer Workspace</h1><p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Analyze Java, C, C++, and Python source code without executing it.</p></div>
      {hasRestoredDraft && <div role="status" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"><div><p className="font-medium">Draft restored</p><p className="mt-0.5 text-xs opacity-80">Your previous editor contents were restored from this browser.</p></div><button type="button" onClick={discardSavedDraft} disabled={isAnalyzing} className="inline-flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-medium hover:bg-emerald-100 dark:border-emerald-800 dark:hover:bg-emerald-900/50 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />Discard saved draft</button></div>}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"><div className="lg:col-span-6"><FileUpload onFileLoaded={handleFileLoaded} onError={(msg) => setValidationError(msg || null)} activeFilename={activeFilename} currentLanguage={language} /></div><div className="lg:col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"><LanguageSelector currentLanguage={language} onSelectLanguage={handleLanguageChange} /><button type="button" id="load-sample-btn" onClick={() => loadSampleCode(language)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"><RotateCcw className="w-3.5 h-3.5" /><span>Load Sample</span></button></div></div>
      <div className="flex-1 flex flex-col"><div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-t-lg border-t border-x border-zinc-200 dark:border-zinc-800 text-xs"><div className="flex items-center gap-3"><div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300"><FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /><span>{activeFilename || `Editor (${SUPPORTED_LANGUAGES[language].name})`}</span></div><span className="text-zinc-300 dark:text-zinc-700">|</span><span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Editable snippet, method, or program</span></div><div className="flex flex-wrap items-center gap-4"><div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]"><span>{lineCount} lines</span><span>•</span><span>{charCount} chars</span></div><div className="flex flex-wrap items-center gap-2 text-zinc-600 dark:text-zinc-300"><span className="font-sans">Font</span><button type="button" aria-label="Decrease editor font size" title="Decrease font size" disabled={editorFontSize <= 10} onClick={() => setEditorFontSize(size => { const next = Math.max(10, size - 1); localStorage.setItem('cca-editor-font-size', String(next)); return next; })} className="rounded border border-zinc-300 dark:border-zinc-700 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40"><Minus className="h-3 w-3" /></button><input type="number" aria-label="Editor font size in pixels" title="Type font size (10–24 px)" min={10} max={24} step={0.5} value={editorFontSize} onChange={event => { const value = Number(event.target.value); if (event.target.value !== "" && Number.isFinite(value)) { const next = Math.min(24, Math.max(10, value)); setEditorFontSize(next); localStorage.setItem("cca-editor-font-size", String(next)); } }} className="w-14 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-1 py-1 text-center font-mono" /><button type="button" aria-label="Increase editor font size" title="Increase font size" disabled={editorFontSize >= 24} onClick={() => setEditorFontSize(size => { const next = Math.min(24, size + 1); localStorage.setItem('cca-editor-font-size', String(next)); return next; })} className="rounded border border-zinc-300 dark:border-zinc-700 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40"><Plus className="h-3 w-3" /></button><button type="button" aria-label="Reset editor settings" title="Reset editor settings" onClick={() => { setEditorFontSize(13.5); localStorage.removeItem('cca-editor-font-size'); localStorage.removeItem('cca-editor-tab-size'); setInfoNotification('Editor settings reset to defaults. Your code was not changed.'); }} className="rounded border border-zinc-300 dark:border-zinc-700 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800" ><RotateCcw className="h-3 w-3" /></button></div></div></div><CodeEditor code={code} language={language} onChange={(newVal) => setCode(newVal || '')} onAnalyze={() => { if (!isAnalyzing) void handleAnalyzeClick(); }} fontSize={editorFontSize} height="520px" /></div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs"><div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">{isAnalyzing ? <Info className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />}<span>{isAnalyzing ? 'Analyzing source code…' : 'Analysis uses static inspection and local ML optimization recommendations.'}</span></div><div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end"><button type="button" id="copy-code-btn" title="Copy code" onClick={() => void handleCopyCode()} disabled={!code} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium disabled:opacity-50"><span>{codeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</span><span>{codeCopied ? "Copied!" : "Copy Code"}</span></button><button type="button" id="clear-code-btn" onClick={clearCode} disabled={isAnalyzing} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium disabled:opacity-50"><Trash2 className="w-4 h-4" /><span>Clear</span></button><div className="group relative w-full sm:w-auto"><button type="button" id="analyze-code-btn" title="Analyze code" aria-keyshortcuts="Control+Enter Meta+Enter" onClick={handleAnalyzeClick} disabled={isAnalyzing} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-wait"><Play className="w-4 h-4 fill-current" /><span>{isAnalyzing ? 'Analyzing…' : 'Analyze Code'}</span></button><span role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">Ctrl + ↵</span></div></div></div>
    </div>
  );
};
