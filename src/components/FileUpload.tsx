import React, { useRef, useState } from 'react';
import { Upload, FileCode, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { detectLanguageFromFilename, ACCEPTED_EXTENSIONS, isGenericTextFile, SUPPORTED_LANGUAGES } from '../utils/languages';
import { SupportedLanguage } from '../types';

interface FileUploadProps {
  onFileLoaded: (content: string, detectedLanguage: SupportedLanguage, filename: string) => void;
  onError: (errorMessage: string) => void;
  activeFilename: string | null;
  currentLanguage: SupportedLanguage;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileLoaded,
  onError,
  activeFilename,
  currentLanguage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const extractPdfText = async (file: File): Promise<string> => {
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocument({ data, disableWorker: true }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();
      if (text) pages.push(text);
    }

    return pages.join('\n\n');
  };

  const processFile = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    const isGeneric = isGenericTextFile(file.name);

    if (!ACCEPTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
      onError(`Unsupported file type "${file.name}". Supported formats are: ${ACCEPTED_EXTENSIONS.join(', ')}.`);
      resetInput();
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      onError('File is too large. Please upload a file smaller than 5 MB.');
      resetInput();
      return;
    }

    setIsProcessing(true);
    try {
      const detected = detectLanguageFromFilename(file.name) || currentLanguage;
      let text: string;

      if (lowerName.endsWith('.pdf')) {
        text = await extractPdfText(file);
        if (!text.trim()) {
          throw new Error('No selectable text was found in this PDF. Scanned/image-only PDFs are not supported yet.');
        }
      } else {
        text = await file.text();
      }

      onFileLoaded(text, detected, file.name);
      onError('');
    } catch (error) {
      onError(error instanceof Error ? error.message : `Unable to read "${file.name}".`);
    } finally {
      setIsProcessing(false);
      resetInput();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) void processFile(files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length) void processFile(files[0]);
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        id="file-upload-input"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload source code, text, or PDF file"
        disabled={isProcessing}
      />

      <div
        id="file-drop-zone"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
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
        } ${isProcessing ? 'opacity-70 cursor-wait' : ''}`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          {isProcessing ? (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Reading file…</span>
            </div>
          ) : activeFilename ? (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <FileCode className="w-4 h-4" />
              <span>Loaded File:</span>
              <span className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-zinc-900 dark:text-zinc-100">
                {activeFilename}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-1">(Click or drop to replace)</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <Upload className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span><strong className="font-semibold text-zinc-800 dark:text-zinc-200">Upload file</strong> or drag & drop</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                <FileCode className="w-3.5 h-3.5" />
                <span>.java, .c, .cpp, .py</span>
                <span>•</span>
                <FileText className="w-3.5 h-3.5" />
                <span>.txt, .pdf</span>
              </div>
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
                For .txt/.pdf, the selected language ({SUPPORTED_LANGUAGES[currentLanguage].name}) is used for analysis.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
