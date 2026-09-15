import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Bot, Clock, HardDrive, BarChart2, AlertTriangle, Zap, CheckSquare, Code2, Info } from 'lucide-react';
import { useCodeContext } from '../hooks/useCodeContext';
import { SUPPORTED_LANGUAGES } from '../utils/languages';
import { AnalyzeResponse } from '../types';

export const ResultsPage: React.FC = () => {
  const location = useLocation();
  const { lastSubmittedCode, lastSubmittedLanguage, lastSubmittedFilename } = useCodeContext();
  const [showSource, setShowSource] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const analysis = (location.state as { analysis?: AnalyzeResponse } | null)?.analysis;
  const staticAnalysis = analysis?.staticAnalysis;
  const gemini = analysis?.gemini;
  const language = lastSubmittedLanguage ? SUPPORTED_LANGUAGES[lastSubmittedLanguage] : null;

  if (!analysis || !staticAnalysis) {
    return <div className="max-w-4xl w-full mx-auto px-4 py-12 text-center"><Info className="w-10 h-10 mx-auto mb-3 text-zinc-400" /><h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">No analysis result available</h1><p className="text-sm text-zinc-500 mt-2">Run an analysis from the Analyzer workspace first.</p><Link to="/analyzer" className="inline-flex mt-5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-emerald-600 text-white text-sm">Open Analyzer</Link></div>;
  }

  const cards = [
    { title: 'Time Complexity', value: staticAnalysis.timeComplexity, icon: Clock },
    { title: 'Space Complexity', value: staticAnalysis.spaceComplexity, icon: HardDrive },
    { title: 'Cyclomatic Complexity', value: String(staticAnalysis.metrics.cyclomaticComplexity), icon: BarChart2 },
    { title: 'Quality Signals', value: `${Math.max(0, 100 - staticAnalysis.codeSmells.length * 10)}/100`, icon: CheckSquare },
  ];

  return <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-3"><Link to="/analyzer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium"><ArrowLeft className="w-3.5 h-3.5" />Back</Link><h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">Analysis Results</h1></div>
      <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Static + Gemini</span>
    </div>

    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"><div className="flex items-center gap-3"><Code2 className="w-5 h-5 text-emerald-600" /><div><div className="text-xs text-zinc-500">Source</div><div className="font-semibold text-zinc-900 dark:text-zinc-100">{lastSubmittedFilename || `Untitled ${language?.name || ''}`}</div></div><span className="ml-auto text-xs font-mono text-zinc-500">{analysis.source?.lines} lines • {analysis.source?.characters} chars</span></div><button onClick={() => setShowSource(!showSource)} className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-600">{showSource ? 'Hide Source' : 'View Source'}{showSource ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>{showSource && <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs text-zinc-100"><code>{lastSubmittedCode}</code></pre>}</div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(({ title, value, icon: Icon }) => <div key={title} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"><Icon className="w-5 h-5 text-emerald-600 mb-4" /><div className="text-xs text-zinc-500">{title}</div><div className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100 break-words">{value}</div></div>)}</div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"><h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Static Analysis</h2><p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{staticAnalysis.explanation}</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">{Object.entries(staticAnalysis.metrics).map(([key, value]) => <div key={key} className="rounded-lg bg-zinc-50 dark:bg-zinc-950 p-3"><div className="text-[10px] uppercase text-zinc-400">{key.replace(/([A-Z])/g, ' $1')}</div><div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{value}</div></div>)}</div></section>
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"><div className="flex items-center gap-2 mb-4"><Bot className="w-5 h-5 text-emerald-600" /><h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Gemini Review</h2></div>{gemini?.available ? <><p className="text-sm text-zinc-700 dark:text-zinc-300">{gemini.summary}</p><p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3">{gemini.explanation}</p></> : <p className="text-sm text-zinc-500 dark:text-zinc-400">{gemini?.error || 'Gemini was not configured. Static analysis is still available.'}</p>}</section>
    </div>

    <button onClick={() => setShowDetails(!showDetails)} className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm">{showDetails ? 'Hide' : 'Show'} detailed findings{showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
    {showDetails && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"><h2 className="font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Code Smells</h2>{staticAnalysis.codeSmells.length ? <ul className="space-y-3">{staticAnalysis.codeSmells.map((smell, i) => <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400"><span className="font-medium uppercase text-[10px] mr-2">{smell.severity}</span>{smell.message}</li>)}</ul> : <p className="text-sm text-zinc-500">No structural smells detected.</p>}</section>
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"><h2 className="font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-600" />Suggestions</h2><ul className="space-y-3">{[...staticAnalysis.suggestions, ...(gemini?.suggestions || [])].map((suggestion, i) => <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 list-disc ml-4">{suggestion}</li>)}</ul></section>
      <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"><h2 className="font-semibold mb-4">Confidence</h2><div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 uppercase">{staticAnalysis.confidence}</div><p className="text-xs text-zinc-500 mt-2">Source-only complexity estimation is approximate, especially for recursion and library calls.</p></section>
    </div>}
  </div>;
};
