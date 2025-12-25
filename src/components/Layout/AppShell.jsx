import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export function AppShell({ children, onExport }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only fixed top-0 left-0 z-50 px-4 py-2 bg-cyan-500 text-white focus:outline-none"
      >
        Skip to main content
      </a>

      <Header onExport={onExport} />

      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8"
      >
        {children}
      </main>

      <Footer />
    </div>
  );
}

export default AppShell;
