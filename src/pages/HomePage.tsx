import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  HardDrive,
  CheckSquare,
  AlertTriangle,
  Zap,
  Bot,
  ArrowRight,
  Code2,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

export const HomePage: React.FC = () => {
  const features = [
    {
      title: 'Time Complexity Analysis',
      description:
        'Derives theoretical execution upper bounds (Big-O, Big-Theta) through loop traversal, nested iteration scanning, and algorithmic pattern recognition.',
      icon: Clock,
      badge: 'Performance',
    },
    {
      title: 'Space Complexity Analysis',
      description:
        'Estimates auxiliary memory allocation, recursive call stack depths, dynamic data structure growth, and buffer footprints.',
      icon: HardDrive,
      badge: 'Memory',
    },
    {
      title: 'Code Quality Analysis',
      description:
        'Evaluates maintainability indices, cyclomatic complexity scores, modularity, and adherence to clean coding standards.',
      icon: CheckSquare,
      badge: 'Diagnostics',
    },
    {
      title: 'Code Smell Detection',
      description:
        'Identifies structural anti-patterns, dead branches, duplicate logic blocks, overly complex conditionals, and deep nesting.',
      icon: AlertTriangle,
      badge: 'Refactoring',
    },
    {
      title: 'Optimization Suggestions',
      description:
        'Recommends concrete algorithmic alternatives, cache-friendly data structures, and vectorized procedures for reduced latency.',
      icon: Zap,
      badge: 'Efficiency',
    },
    {
      title: 'AI-Powered Explanations',
      description:
        'Translates abstract mathematical asymptotic analysis into step-by-step developer explanations grounded in specific line numbers.',
      icon: Bot,
      badge: 'Reasoning',
    },
  ];

  const languagesList = Object.values(SUPPORTED_LANGUAGES);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Phase 1 Frontend Foundation Active
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-3xl mx-auto leading-tight sm:leading-tight">
            AI-Powered Code Complexity Analyzer
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Understand time and space complexity, inspect code quality, spot latent code smells, and uncover concrete optimization opportunities before deployment.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/analyzer"
              id="hero-start-analyzing-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <span>Start Analyzing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/results"
              id="hero-view-results-template-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-sm transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              <span>View Results Dashboard Layout</span>
            </Link>
          </div>

          {/* Quick Technical Summary Bar */}
          <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Analysis Engine</div>
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">AST & Static Model</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">AI Reasoning</div>
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">Gemini Integration</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Editor Workspace</div>
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">Monaco Editor</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Input Mode</div>
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">Snippet or File</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Comprehensive Code Intelligence
            </h2>
            <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Architected to combine deterministic syntax-tree inspection with machine learning-driven contextual code heuristics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  id={`feature-card-${idx}`}
                  className="p-6 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {feature.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Supported Languages Section */}
      <section className="py-16 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Supported Languages
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Phase 1 provides editor syntax highlighting and file ingestion for mainstream enterprise and systems languages.
              </p>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 self-start md:self-auto">
              Additional language grammars will be added in future revisions.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {languagesList.map((lang) => (
              <div
                key={lang.id}
                id={`lang-card-${lang.id}`}
                className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                    {lang.name}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {lang.extensions.join(', ')}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {lang.description}
                </p>
              </div>
            ))}
          </div>

          {/* Quick CTA banner */}
          <div className="mt-12 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
                Ready to inspect source code?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                Open the interactive Monaco workspace to load sample snippets or upload your own files.
              </p>
            </div>
            <Link
              to="/analyzer"
              id="cta-launch-analyzer-btn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium transition-colors shrink-0"
            >
              <Code2 className="w-4 h-4" />
              <span>Open Analyzer Workspace</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
