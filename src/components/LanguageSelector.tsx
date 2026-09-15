import React from 'react';
import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onSelectLanguage,
  disabled = false,
}) => {
  const languages = Object.values(SUPPORTED_LANGUAGES);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <label
        htmlFor="language-select-dropdown"
        className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider"
      >
        Language:
      </label>
      
      {/* Visual pill selector for quick switching */}
      <div
        id="language-selector-group"
        role="radiogroup"
        aria-label="Select programming language"
        className="inline-flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60"
      >
        {languages.map((lang) => {
          const isSelected = currentLanguage === lang.id;
          return (
            <button
              key={lang.id}
              type="button"
              id={`lang-btn-${lang.id}`}
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelectLanguage(lang.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isSelected
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40'
              }`}
            >
              <span>{lang.name}</span>
              <span className="text-[10px] font-mono opacity-60">
                {lang.extensions[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
