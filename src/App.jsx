import React, { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { AppProvider, useApp } from './context/AppContext';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';
import { UIProvider, useUI } from './context/UIContext';

import { AppShell } from './components/layout/AppShell';

import { UploadView } from './components/upload/UploadView';
import { Dashboard } from './components/dashboard/Dashboard';
import { ReportView } from './components/report/ReportView';
import { CompareView } from './components/compare/CompareView';

import { OnboardingFlow, useOnboarding } from './components/onboarding/OnboardingFlow';

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
  const { runAnalysis, useAPI, apiStats } = useAnalysisFlow();
  const { exportCSV, exportJSON, exportPDF } = useExport();
  const { showOnboarding, completeOnboarding } = useOnboarding();

  const handleFileSelect = useCallback((file, fileType) => {
    setFile(file, fileType);
    runAnalysis(file, fileType);
  }, [setFile, runAnalysis]);

  const handleReset = useCallback(() => {
    reset();
    resetAnalysis();
    setActiveView('upload');
  }, [reset, resetAnalysis, setActiveView]);

  const handleExport = useCallback((format = 'csv') => {
    if (format === 'json') {
      exportJSON();
    } else if (format === 'pdf') {
      exportPDF();
    } else {
      exportCSV();
    }
  }, [exportCSV, exportJSON, exportPDF]);

  const getView = () => {
    if (activeView === 'compare') {
      return 'compare';
    }

    if ([APP_STATES.IDLE, APP_STATES.UPLOADING, APP_STATES.PARSING, APP_STATES.ANALYZING].includes(appState)) {
      return 'upload';
    }

    if (appState === APP_STATES.COMPLETE) {
      return activeView;
    }

    return 'upload';
  };

  const currentView = getView();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  return (
    <>
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
              <UploadView onFileSelect={handleFileSelect} useAPI={useAPI} apiStats={apiStats} />
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

          {currentView === 'compare' && (
            <motion.div
              key="compare"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
            >
              <CompareView />
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
