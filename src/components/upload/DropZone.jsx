import React, { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';

const ACCEPTED_EXTENSIONS = ['.vcf', '.csv', '.txt'];

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
    const fileType = extension === 'csv' ? 'csv' : 'vcf';

    setSelectedFile({
      name: file.name,
      size: file.size,
      type: fileType
    });

    onFileSelect(file, fileType);
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
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 transition-all duration-300 cursor-pointer group ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          isDragOver
            ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-500/10 scale-[1.02]'
            : 'border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 hover:border-gray-400 dark:hover:border-white/30 hover:bg-gray-100 dark:hover:bg-white/10'
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
            className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center transition-colors duration-300 ${
              isDragOver
                ? 'bg-cyan-500/20'
                : 'bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 group-hover:from-cyan-500/30 group-hover:to-indigo-500/30'
            }`}
            animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
          >
            <Upload className={`w-8 h-8 transition-colors duration-300 ${isDragOver ? 'text-cyan-400' : 'text-cyan-500'}`} />
          </motion.div>

          {/* Text */}
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            {isDragOver ? 'Drop your file here' : 'Upload your DNA file'}
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Drag and drop your file, or click to browse
          </p>

          {/* Supported formats */}
          <div className="flex flex-wrap justify-center gap-2">
            {['VCF', 'CSV', 'TXT'].map((format) => (
              <span
                key={format}
                className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[var(--text-secondary)]"
              >
                .{format.toLowerCase()}
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
            className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {formatFileSize(selectedFile.size)} - {selectedFile.type.toUpperCase()}
              </p>
            </div>
            <Check className="w-5 h-5 text-emerald-400" />
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
