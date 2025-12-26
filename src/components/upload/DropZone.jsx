import React, { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';

const ACCEPTED_EXTENSIONS = ['.vcf', '.csv', '.txt', '.zip'];

const SUPPORTED_PROVIDERS = [
  { name: '23andMe', color: 'text-[#92C746]' },       // Sushi Green
  { name: 'AncestryDNA', color: 'text-[#88A431]' },  // Leaf Green
  { name: 'FTDNA', color: 'text-[#273757] dark:text-[#6B8BB8]' },        // Dark Blue/Navy (lighter in dark mode)
  { name: 'MyHeritage', color: 'text-[#FC702D]' },   // Crusta Orange
  { name: 'VCF', color: 'text-stone-600 dark:text-stone-400' }  // Generic format
];

export function DropZone({ onFileSelect, disabled = false }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = useCallback((file) => {
    const extension = '.' + file.name.split('.').pop().toLowerCase();

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file type. Please upload a VCF, CSV, or TXT file.`
      };
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is 500MB.`
      };
    }

    return { valid: true };
  }, []);

  const handleFile = useCallback((file) => {
    setError(null);

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      setSelectedFile(null);
      return;
    }

    const extension = file.name.split('.').pop().toLowerCase();

    setSelectedFile({
      name: file.name,
      size: file.size,
      type: extension.toUpperCase()
    });

    // Pass file only - ParserFactory will auto-detect format
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all duration-300 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${isDragOver
            ? 'border-stone-500 dark:border-stone-400 bg-stone-500/10 scale-[1.02]'
            : 'border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 hover:border-stone-400 dark:hover:border-white/30 hover:bg-gray-100 dark:hover:bg-white/10'
          }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        whileHover={!disabled ? { scale: 1.01 } : undefined}
        whileTap={!disabled ? { scale: 0.99 } : undefined}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload DNA file"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".vcf,.csv,.txt"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          aria-hidden="true"
        />

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <motion.div
            className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center transition-colors duration-300 ${isDragOver
              ? 'bg-stone-500/20'
              : 'bg-stone-200 dark:bg-stone-700/30 group-hover:bg-stone-300 dark:group-hover:bg-stone-600/40'
              }`}
            animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
          >
            <Upload className={`w-8 h-8 transition-colors duration-300 ${isDragOver ? 'text-stone-600 dark:text-stone-300' : 'text-stone-700 dark:text-stone-400'}`} />
          </motion.div>

          {/* Text */}
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            {isDragOver ? 'Drop your file here' : 'Upload your DNA file'}
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Drag and drop your file, or click to browse
          </p>

          {/* Supported providers */}
          <div className="flex flex-wrap justify-center gap-2">
            {SUPPORTED_PROVIDERS.map((provider) => (
              <span
                key={provider.name}
                className={`px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 ${provider.color}`}
              >
                {provider.name}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Selected file info */}
      <AnimatePresence>
        {selectedFile && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-xl bg-stone-100 dark:bg-stone-800/50 border border-stone-300 dark:border-stone-600 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {formatFileSize(selectedFile.size)} - {selectedFile.type.toUpperCase()}
              </p>
            </div>
            <Check className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DropZone;
