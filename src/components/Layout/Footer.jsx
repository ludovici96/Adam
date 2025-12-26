import React from 'react';
import { Shield, Github, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto px-4 sm:px-0 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="px-6 py-4 rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/50 dark:border-stone-700/50 shadow-lg shadow-stone-200/10 dark:shadow-black/20 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300">
          {/* Privacy Notice */}
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
            <Shield className="w-3.5 h-3.5" />
            <span>
              100% Local Processing. Your data never leaves this device.
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs font-medium">
            <a
              href="https://snpedia.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors duration-200"
            >
              SNPedia
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors duration-200"
            >
              <Github className="w-3.5 h-3.5 opacity-50" />
              Source
            </a>
            <div className="hidden md:block w-px h-3 bg-stone-300 dark:bg-stone-700" />
            <span className="text-stone-400 dark:text-stone-500">
              © 2025 DNA Genesis
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
