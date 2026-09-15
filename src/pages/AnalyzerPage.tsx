import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trash2, RotateCcw, FileText, Info, AlertCircle } from 'lucide-react';
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
  const lineCount = useMemo(() => (code ? code.split('\n').length : 0), [code]);
  const charCount = useMemo(() => code.length, [code]);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setInfoNotification(`Loaded editable ${SUPPORTED_LANGUAGES[newLang].name} code sample.`);
  };

  const handleFileLoaded = (content: string, fileLanguage: SupportedLanguage, filename: string) => {
    // setLanguage loads that language's default sample, so set it first and
    // then replace the sample with the actual uploaded file contents.
    setLanguage(fileLanguage);
    setCode(content);
    setActiveFilename(filename);
    setValidationError(null);

    const isGenericFile = /\.(txt|pdf)$/i.test(filename);
    setInfoNotification(
      isGenericFile
        ? `Successfully loaded "${filename}" using ${SUPPORTED_LANGUAGES[fileLanguage].name} for analysis.`
        : `Successfully loaded "${filename}" (${SUPPORTED_LANGUAGES[fileLanguage].name}).`
    );
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
      const result = await analyzerService.submitForAnalysis({
        code,
        language,
        filename: activeFilename || undefined,
        options: { includeAst: true, includeOptimizations: true, includeCodeSmells: true },
      });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div><h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">Analyzer Workspace <span className="text-xs font-normal font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Analysis Ready</span></h1><p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">Analyze Java, C, C++, and Python source without executing it.</p></div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300 shrink-0"><Info className="w-4 h-4 shrink-0" /><span>Static Analysis + Gemini</span></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"><div className="lg:col-span-6"><FileUpload onFileLoaded={handleFileLoaded} onError={(msg) => setValidationError(msg || null)} activeFilename={activeFilename} currentLanguage={language} /></div><div className="lg:col-span-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"><LanguageSelector currentLanguage={language} onSelectLanguage={handleLanguageChange} /><button type="button" id="load-sample-btn" onClick={() => loadSampleCode(language)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"><RotateCcw className="w-3.5 h-3.5" /><span>Load Sample</span></button></div></div>
      <div className="flex-1 flex flex-col"><div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-t-lg border-t border-x border-zinc-200 dark:border-zinc-800 text-xs"><div className="flex items-center gap-3"><div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300"><FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /><span>{activeFilename || `Editor (${SUPPORTED_LANGUAGES[language].name})`}</span></div><span className="text-zinc-300 dark:text-zinc-700">|</span><span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Editable snippet, method, or program</span></div><div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]"><span>{lineCount} lines</span><span>•</span><span>{charCount} chars</span></div></div><CodeEditor code={code} language={language} onChange={(newVal) => setCode(newVal || '')} height="520px" /></div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs"><div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">{isAnalyzing ? <Info className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />}<span>{isAnalyzing ? 'Analyzing source…' : 'Source is inspected statically; it is never executed.'}</span></div><div className="flex items-center gap-3 w-full sm:w-auto justify-end"><button type="button" id="clear-code-btn" onClick={clearCode} disabled={isAnalyzing} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium disabled:opacity-50"><Trash2 className="w-4 h-4" /><span>Clear</span></button><button type="button" id="analyze-code-btn" onClick={handleAnalyzeClick} disabled={isAnalyzing} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-wait"><Play className="w-4 h-4 fill-current" /><span>{isAnalyzing ? 'Analyzing…' : 'Analyze Code'}</span></button></div></div>
    </div>
  );
};
