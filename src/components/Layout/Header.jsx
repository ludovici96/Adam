import React from 'react';
import { motion } from 'framer-motion';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Dna, Shield, Download, FileText, Beaker, RotateCcw } from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useApp } from '../../context/AppContext';
import { useAnalysis } from '../../context/AnalysisContext';
import { DestructiveModal } from '../common/DestructiveModal';
import { clsx } from 'clsx';

export function Header({ onExport }) {
  const { resolvedTheme, toggleTheme } = useUI();
  const { appState, APP_STATES, reset } = useApp();
  const { reset: resetAnalysis } = useAnalysis();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = React.useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = React.useState(false);

  const handleReset = async () => {
    await reset();
    resetAnalysis();
    navigate('/');
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAnalysisComplete = appState === APP_STATES.COMPLETE;
  const showExport = isAnalysisComplete && location.pathname !== '/';



  return (
    <header className={`sticky top-4 z-40 px-4 sm:px-0 mb-8 transition-all duration-300 ${scrolled ? 'top-1' : 'top-4'}`}>
      <div className={`mx-auto transition-all duration-300 ${scrolled ? 'max-w-3xl' : 'max-w-5xl'}`}>
        <div className={`px-4 rounded-2xl bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl border border-stone-200/50 dark:border-stone-700/50 shadow-lg shadow-stone-200/10 dark:shadow-black/20 flex items-center justify-between transition-all duration-300 ${scrolled ? 'py-1.5' : 'py-3'}`}>
          {/* Logo - clickable to go home */}
          <Link
            to="/"
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className={`rounded-lg bg-stone-800 dark:bg-stone-200 flex items-center justify-center shadow-md shadow-stone-800/10 group-hover:scale-105 transition-all duration-300 ${scrolled ? 'w-7 h-7' : 'w-9 h-9'}`}>
              <Dna className={`text-stone-100 dark:text-stone-800 transition-all duration-300 ${scrolled ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
            </div>
            <div className="text-left">
              <h1 className={`font-bold font-serif text-[var(--text-primary)] tracking-tight transition-all duration-300 ${scrolled ? 'text-base' : 'text-xl'}`}>
                DNA Genesis
              </h1>
            </div>
          </Link>

          {/* Center - Navigation OR Privacy Badge */}
          {isAnalysisComplete ? (
            /* Navigation Menu */
            <nav className={`hidden md:flex items-center gap-1 overflow-hidden transition-all duration-300 ${scrolled ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
              <NavButton to="/dashboard" icon={Dna} label="Dashboard" active={location.pathname === '/dashboard'} />
              <NavButton to="/report" icon={FileText} label="Report" active={location.pathname === '/report'} />
              <NavButton to="/simulation" icon={Beaker} label="Sim Lab" active={location.pathname === '/simulation'} />
            </nav>
          ) : (
            /* Privacy Badge */
            <div
              className={`hidden md:flex items-center gap-2 overflow-hidden transition-all duration-300 ${scrolled ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}
            >
              <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-500/5 border border-teal-500/10 rounded-full text-teal-700 dark:text-teal-400 text-xs font-medium whitespace-nowrap">
                <Shield className="w-3 h-3" />
                <span>Private & Local</span>
              </div>
            </div>
          )}

          {/* Right - Actions */}
          <motion.div
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Export Dropdown */}
            {showExport && (
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 bg-transparent hover:bg-stone-100 dark:hover:bg-white/5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <div className="absolute right-0 top-full mt-2 w-40 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                  <button
                    onClick={() => onExport('csv')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 dark:hover:bg-white/5 transition-colors first:rounded-t-lg"
                  >
                    CSV File
                  </button>
                  <button
                    onClick={() => onExport('json')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
                  >
                    JSON Data
                  </button>
                  <button
                    onClick={() => onExport('pdf')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 dark:hover:bg-white/5 transition-colors last:rounded-b-lg"
                  >
                    PDF Report
                  </button>
                </div>
              </div>
            )}

            {/* Compare Link */}
            <Link
              to="/compare"
              className="text-sm font-serif font-medium text-stone-600 dark:text-stone-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mr-2 hidden sm:block"
              title="Compare two DNA files to find shared traits"
            >
              Compare DNA
            </Link>

            {/* New Analysis Button (Safe Reset) */}
            {isAnalysisComplete && (
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-200 dark:border-rose-900/30 hover:border-rose-300 dark:hover:border-rose-800 bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 text-sm font-medium text-rose-600 dark:text-rose-400 transition-all shadow-sm hover:shadow"
                title="Start a new analysis (clears current data)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200"
              aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </motion.div>

          <DestructiveModal
            isOpen={isResetModalOpen}
            onClose={() => setIsResetModalOpen(false)}
            onConfirm={handleReset}
            title="End Session?"
            description="This will clear your DNA data from this browser. This action cannot be undone."
            confirmText="End Session"
          />

        </div>
      </div>
    </header>
  );
}

function NavButton({ to, icon: Icon, label, active }) {
  return (
    <Link
      to={to}
      className={clsx(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
        active
          ? "bg-stone-100 dark:bg-white/10 text-stone-900 dark:text-white"
          : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/5"
      )}
    >
      <Icon className={clsx("w-3.5 h-3.5", active ? "text-stone-900 dark:text-white" : "text-stone-400")} />
      {label}
    </Link>
  );
}

export default Header;
