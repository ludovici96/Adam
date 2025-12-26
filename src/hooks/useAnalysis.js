import { useCallback, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAnalysis as useAnalysisContext } from '../context/AnalysisContext';
import { useUI } from '../context/UIContext';

import { RiskCalculator } from '../analysis/RiskCalculator';
import { PharmaAnalyzer } from '../analysis/PharmaAnalyzer';
import { apiClient } from '../services/api';

export function useAnalysisFlow() {
  const {
    setAppState,
    setProgress,
    setError,
    APP_STATES
  } = useApp();

  const {
    setVariants,
    setMatches,
    setStats,
    categorizeMatches,
    setDatabaseInfo,
    setRiskScores,
    setPharmaResults
  } = useAnalysisContext();

  const { setActiveView } = useUI();

  const [apiStats, setApiStats] = useState(null);

  useEffect(() => {
    apiClient.getStats().then(setApiStats).catch(() => { });
  }, []);

  const runAnalysis = useCallback(async (file) => {
    try {
      setAppState(APP_STATES.PARSING);
      setProgress({ stage: 'parsing', percent: 10, message: 'Uploading file to server...' });

      setProgress({ stage: 'analyzing', percent: 30, message: 'Analyzing with server (3M+ SNPs)...' });

      const result = await apiClient.analyzeFile(file);

      setProgress({ percent: 70, message: 'Processing results...' });

      setVariants([]);
      setMatches(result.matches);
      setStats({
        totalVariants: result.stats.totalVariants,
        totalMatches: result.matches.length,
        ...result.stats
      });

      setDatabaseInfo({
        size: apiStats?.totalCount || result.stats.totalMatches,
        source: 'server'
      });

      categorizeMatches(result.matches);

      setProgress({ percent: 85, message: 'Calculating health risk scores...' });
      const riskCalculator = new RiskCalculator();
      const riskScores = riskCalculator.calculateAllRiskScores(result.matches);
      setRiskScores(riskScores);

      setProgress({ percent: 92, message: 'Analyzing drug interactions...' });
      const pharmaAnalyzer = new PharmaAnalyzer();
      const pharmaResults = pharmaAnalyzer.analyze(result.matches);
      setPharmaResults(pharmaResults);

      setProgress({ percent: 100, message: 'Analysis complete!' });
      setAppState(APP_STATES.COMPLETE);
      setActiveView('dashboard');

    } catch (error) {
      console.error('Analysis failed:', error);
      setError(error.message || 'Server analysis failed');
    }
  }, [
    setAppState, setProgress, setError, setVariants, setMatches, setStats,
    categorizeMatches, setDatabaseInfo, setRiskScores, setPharmaResults,
    setActiveView, APP_STATES, apiStats
  ]);

  return {
    runAnalysis,
    apiStats
  };
}

export default useAnalysisFlow;
