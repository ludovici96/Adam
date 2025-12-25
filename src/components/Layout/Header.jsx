import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Dna, Shield, Download } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useApp } from '../../context/AppContext';

export function Header({ onExport }) {
  const { resolvedTheme, toggleTheme } = useUI();
  const { appState, APP_STATES } = useApp();

  const showExport = appState === APP_STATES.COMPLETE;

  return (
    <header className="sticky top-0 z-40 px-4 sm:px-6 py-4 bg-[var(--surface-glass)] backdrop-blur-xl border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Dna className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">
              DNA Genesis
            </h1>
            <p className="text-xs text-[var(--text-secondary)] hidden sm:block">
              Personal Genetic Analysis
            </p>
          </div>
        </motion.div>

        {/* Center - Privacy Badge */}
        <motion.div
          className="hidden md:flex items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-500 dark:text-emerald-400 text-sm font-medium">
            <Shield className="w-4 h-4" />
            <span>100% Private</span>
          </div>
        </motion.div>

        {/* Right - Actions */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Export Button */}
          {showExport && (
            <button
              onClick={onExport}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10 rounded-full text-sm font-medium text-[var(--text-primary)] transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-[var(--text-primary)] transition-all duration-200"
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </motion.div>
      </div>
    </header>
  );
}

export default Header;
