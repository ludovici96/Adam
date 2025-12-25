import React from 'react';
import { Shield, Github, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto py-8 px-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Privacy Notice */}
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Shield className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>
              All processing happens locally in your browser.
              Your DNA data never leaves your device.
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <a
              href="https://snpedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200"
            >
              SNPedia
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-200"
            >
              <Github className="w-4 h-4" />
              Source
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-[var(--border-color)] text-center">
          <p className="text-xs text-[var(--text-secondary)] opacity-70">
            DNA Genesis is for educational purposes only.
            Consult a healthcare professional for medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
