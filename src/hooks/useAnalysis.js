import { useCallback, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAnalysis as useAnalysisContext } from '../context/AnalysisContext';
import { useUI } from '../context/UIContext';

import { RiskCalculator } from '../analysis/RiskCalculator';
import { PharmaAnalyzer } from '../analysis/PharmaAnalyzer';
import { EmotionalAnalyzer } from '../analysis/EmotionalAnalyzer';
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
    setPharmaResults,
    setEmotionalProfile
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

      // Filter out experimental matches for derived analysis to ensure high confidence
      const cleanMatches = result.matches.filter(m => m.matchMethod !== 'coordinate');

      setProgress({ percent: 85, message: 'Calculating health risk scores...' });
      const riskCalculator = new RiskCalculator();
      const riskScores = riskCalculator.calculateAllRiskScores(cleanMatches);
      setRiskScores(riskScores);

      setProgress({ percent: 88, message: 'Analyzing drug interactions...' });
      const pharmaAnalyzer = new PharmaAnalyzer();
      const pharmaResults = pharmaAnalyzer.analyze(cleanMatches);
      setPharmaResults(pharmaResults);

      setProgress({ percent: 95, message: 'Analyzing personality traits...' });
      const emotionalAnalyzer = new EmotionalAnalyzer();
      const emotionalProfile = emotionalAnalyzer.analyze(cleanMatches);
      setEmotionalProfile(emotionalProfile);

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
    setEmotionalProfile, setActiveView, APP_STATES, apiStats
  ]);

  return {
    runAnalysis,
    apiStats
  };
}

export default useAnalysisFlow;
