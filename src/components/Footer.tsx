import React from 'react';
import { Terminal, ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            AI-Powered Code Complexity Analyzer
          </span>
          <span className="text-zinc-400 dark:text-zinc-600">•</span>
          <span>Phase 1 — Frontend Foundation</span>
        </div>

        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500/80" />
          <span className="text-zinc-500 dark:text-zinc-400">
            No backend or mock analysis active. Analysis engine connects in Phase 2.
          </span>
        </div>
      </div>
    </footer>
  );
};
