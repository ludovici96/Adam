import React, { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Context Providers
import { AppProvider, useApp } from './context/AppContext';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';
import { UIProvider, useUI } from './context/UIContext';

// Layout
import { AppShell } from './components/layout/AppShell';

// Views
import { UploadView } from './components/upload/UploadView';
import { Dashboard } from './components/dashboard/Dashboard';
import { ReportView } from './components/report/ReportView';

// Onboarding
import { OnboardingFlow, useOnboarding } from './components/onboarding/OnboardingFlow';

// Hooks
import { useAnalysisFlow } from './hooks/useAnalysis';
import { useExport } from './hooks/useExport';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1]
};

function AppContent() {
  const { appState, reset, setFile, APP_STATES } = useApp();
  const { reset: resetAnalysis } = useAnalysis();
  const { activeView, setActiveView, selectSNP } = useUI();
  const { runAnalysis } = useAnalysisFlow();
  const { exportCSV, exportJSON } = useExport();
  const { showOnboarding, completeOnboarding } = useOnboarding();

  // Handle file selection
  const handleFileSelect = useCallback((file, fileType) => {
    setFile(file, fileType);
    runAnalysis(file, fileType);
  }, [setFile, runAnalysis]);

  // Handle reset
  const handleReset = useCallback(() => {
    reset();
    resetAnalysis();
    setActiveView('upload');
  }, [reset, resetAnalysis, setActiveView]);

  // Handle export
  const handleExport = useCallback((format = 'csv') => {
    if (format === 'json') {
      exportJSON();
    } else {
      exportCSV();
    }
  }, [exportCSV, exportJSON]);

  // Determine which view to show
  const getView = () => {
    // If still processing, show upload view with processing indicator
    if ([APP_STATES.IDLE, APP_STATES.UPLOADING, APP_STATES.PARSING, APP_STATES.ANALYZING].includes(appState)) {
      return 'upload';
    }

    // If complete, use activeView
    if (appState === APP_STATES.COMPLETE) {
      return activeView;
    }

    // Error state - show upload view
    return 'upload';
  };

  const currentView = getView();

  return (
    <>
      {/* Onboarding Flow */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow onComplete={completeOnboarding} />
        )}
      </AnimatePresence>

      <AppShell onExport={handleExport}>
        <AnimatePresence mode="wait">
        {currentView === 'upload' && (
          <motion.div
            key="upload"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <UploadView onFileSelect={handleFileSelect} />
          </motion.div>
        )}

        {currentView === 'dashboard' && (
          <motion.div
            key="dashboard"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <Dashboard
              onViewReport={() => setActiveView('report')}
              onReset={handleReset}
              onSelectSNP={selectSNP}
            />
          </motion.div>
        )}

        {currentView === 'report' && (
          <motion.div
            key="report"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <ReportView
              onBack={() => setActiveView('dashboard')}
              onExport={handleExport}
            />
          </motion.div>
        )}
        </AnimatePresence>
      </AppShell>
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AnalysisProvider>
        <UIProvider>
          <AppContent />
        </UIProvider>
      </AnalysisProvider>
    </AppProvider>
  );
}

export default App;
