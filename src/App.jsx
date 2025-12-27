import React, { useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, BrowserRouter } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { AppProvider, useApp } from './context/AppContext';
import { AnalysisProvider, useAnalysis } from './context/AnalysisContext';
import { UIProvider, useUI } from './context/UIContext';

import { AppShell } from './components/Layout/AppShell';

import { UploadView } from './components/upload/UploadView';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ReportView } from './components/Report/ReportView';
import { CompareView } from './components/compare/CompareView';
import { SimulationLab } from './components/Simulation/SimulationLab'; // NEW

import { OnboardingFlow, useOnboarding } from './components/onboarding/OnboardingFlow';

import { useAnalysisFlow } from './hooks/useAnalysis';
import { useExport } from './hooks/useExport';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const pageTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1]
};

function AppContent() {
  const { appState, reset, setFile, APP_STATES, isRestoring } = useApp();

  const { reset: resetAnalysis } = useAnalysis();
  const { selectSNP } = useUI();
  const { runAnalysis, useAPI, apiStats } = useAnalysisFlow();
  const { exportCSV, exportJSON, exportPDF } = useExport();
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect Logic based on App State
  useEffect(() => {
    if (!isRestoring && appState === APP_STATES.COMPLETE && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [appState, isRestoring, location.pathname, navigate, APP_STATES]);

  const handleFileSelect = useCallback((file, fileType) => {
    setFile(file, fileType);
    runAnalysis(file, fileType);
  }, [setFile, runAnalysis]);

  const handleReset = useCallback(() => {
    reset();
    resetAnalysis();
    navigate('/');
  }, [reset, resetAnalysis, navigate]);

  const handleExport = useCallback((format = 'csv') => {
    if (format === 'json') {
      exportJSON();
    } else if (format === 'pdf') {
      exportPDF();
    } else {
      exportCSV();
    }
  }, [exportCSV, exportJSON, exportPDF]);

  // Loading Screen while restoring session
  if (isRestoring) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 dark:bg-[#0c0a09]">
        <div className="relative w-16 h-16 mb-4">
          <motion.div
            className="absolute inset-0 border-4 border-stone-200 dark:border-stone-800 rounded-full"
          />
          <motion.div
            className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <p className="text-stone-500 text-sm font-medium tracking-wide animate-pulse">
          Restoring Session...
        </p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow onComplete={completeOnboarding} />
        )}
      </AnimatePresence>

      <AppShell onExport={handleExport}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>

            {/* 1. Upload / Home */}
            <Route path="/" element={
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
            } />

            {/* 2. Dashboard */}
            <Route path="/dashboard" element={
              appState === APP_STATES.COMPLETE ? (
                <motion.div
                  key="dashboard"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={pageTransition}
                >
                  <Dashboard
                    onViewReport={() => navigate('/report')}
                    onSelectSNP={selectSNP}
                  />
                </motion.div>
              ) : <Navigate to="/" />
            } />

            {/* 3. Report */}
            <Route path="/report" element={
              <motion.div
                key="report"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <ReportView
                  onBack={() => navigate('/dashboard')}
                  onExport={handleExport}
                />
              </motion.div>
            } />

            {/* 4. Compare */}
            <Route path="/compare" element={
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
            } />

            {/* 5. Simulation Lab [NEW] */}
            <Route path="/simulation" element={
              <motion.div
                key="simulation"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <SimulationLab />
              </motion.div>
            } />

          </Routes>
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
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </UIProvider>
      </AnalysisProvider>
    </AppProvider>
  );
}

export default App;
