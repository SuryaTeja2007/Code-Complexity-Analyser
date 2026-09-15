import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useCodeContext } from '../hooks/useCodeContext';

export const NotificationBanner: React.FC = () => {
  const { validationError, infoNotification, setValidationError, setInfoNotification } =
    useCodeContext();

  if (!validationError && !infoNotification) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {validationError && (
        <div
          id="validation-error-banner"
          role="alert"
          className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-sm shadow-sm transition-all"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="font-medium">{validationError}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            aria-label="Dismiss error"
            className="text-red-500 hover:text-red-700 dark:hover:text-red-200 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {infoNotification && (
        <div
          id="info-notification-banner"
          role="status"
          className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 text-sm shadow-sm transition-all"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{infoNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setInfoNotification(null)}
            aria-label="Dismiss notification"
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
