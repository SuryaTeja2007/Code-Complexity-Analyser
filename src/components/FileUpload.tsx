import React, { useRef, useState } from 'react';
import { Upload, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { detectLanguageFromFilename, ACCEPTED_EXTENSIONS, SUPPORTED_LANGUAGES } from '../utils/languages';
import { SupportedLanguage } from '../types';

interface FileUploadProps {
  onFileLoaded: (content: string, detectedLanguage: SupportedLanguage, filename: string) => void;
  onError: (errorMessage: string) => void;
  activeFilename: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileLoaded,
  onError,
  activeFilename,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    // 1. Validate file extension
    const detected = detectLanguageFromFilename(file.name);
    if (!detected) {
      onError(
        `Unsupported file type "${file.name}". Supported extensions are: ${ACCEPTED_EXTENSIONS.join(', ')}.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Read file as text
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text === 'string') {
          onFileLoaded(text, detected, file.name);
        } else {
          onError('Failed to read file content. Please try selecting the file again.');
        }
      } catch {
        onError('An unexpected error occurred while reading the file.');
      }
    };

    reader.onerror = () => {
      onError(`Unable to read "${file.name}". Please ensure the file is accessible and try again.`);
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return (
    <div className="w-full">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        id="file-upload-input"
        accept=".java,.c,.cpp,.cc,.cxx,.py"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload source code file"
      />

      <div
        id="file-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-lg p-3 sm:p-4 text-center cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
            : activeFilename
            ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/40 hover:border-zinc-400 dark:hover:border-zinc-600'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-emerald-500/70 dark:hover:border-emerald-500/50 bg-white dark:bg-zinc-900'
        }`}
      >
        <div className="flex items-center justify-center gap-3">
          {activeFilename ? (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <FileCode className="w-4 h-4" />
              <span>Loaded File:</span>
              <span className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-zinc-900 dark:text-zinc-100">
                {activeFilename}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-1">
                (Click or drop to replace)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <Upload className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
              <span>
                <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Upload file
                </strong>{' '}
                or drag & drop
              </span>
              <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                (.java, .c, .cpp, .py)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
