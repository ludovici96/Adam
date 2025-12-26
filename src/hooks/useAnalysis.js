import { useCallback, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAnalysis as useAnalysisContext } from '../context/AnalysisContext';
import { useUI } from '../context/UIContext';

import { ParserFactory, FILE_FORMATS } from '../parsers/index.js';
import { Matcher } from '../analysis/matcher';
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

  const [useAPI, setUseAPI] = useState(null);
  const [apiStats, setApiStats] = useState(null);

  useEffect(() => {
    apiClient.checkAvailability().then(available => {
      setUseAPI(available);
      if (available) {
        apiClient.getStats().then(setApiStats).catch(() => { });
      }
    });
  }, []);

  const runAnalysisWithAPI = useCallback(async (file) => {
    try {
      setAppState(APP_STATES.PARSING);
      setProgress({ stage: 'parsing', percent: 10, message: 'Uploading file to server...' });

      setProgress({ stage: 'analyzing', percent: 30, message: 'Analyzing with server (2.4M SNPs)...' });

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
      console.error('API analysis failed:', error);
      setError(error.message || 'Server analysis failed');
    }
  }, [
    setAppState, setProgress, setError, setVariants, setMatches, setStats,
    categorizeMatches, setDatabaseInfo, setRiskScores, setPharmaResults,
    setActiveView, APP_STATES, apiStats
  ]);

  const runAnalysisLocal = useCallback(async (file, fileType) => {
    try {
      setAppState(APP_STATES.PARSING);
      setProgress({ stage: 'parsing', percent: 0, message: 'Detecting file format...' });

      const parseResult = await ParserFactory.parse(file);
      const { variants, format, stats: parseStats } = parseResult;

      const formatNames = {
        [FILE_FORMATS.VCF]: 'VCF',
        [FILE_FORMATS.TWENTYTHREE]: '23andMe',
        [FILE_FORMATS.ANCESTRY]: 'AncestryDNA',
        [FILE_FORMATS.FTDNA]: 'FTDNA',
        [FILE_FORMATS.MYHERITAGE]: 'MyHeritage'
      };
      const formatName = formatNames[format] || format;

      setVariants(variants);
      setProgress({
        percent: 50,
        message: `Found ${variants.length.toLocaleString()} variants (${formatName} format)`
      });

      setProgress({ stage: 'analyzing', percent: 60, message: 'Loading SNPedia database...' });

      const dbResponse = await fetch('/data/snpedia.json');
      if (!dbResponse.ok) {
        throw new Error('Failed to load SNPedia database. Please ensure the database file exists.');
      }
      const database = await dbResponse.json();

      setDatabaseInfo({ size: Object.keys(database).length, source: 'local' });
      setProgress({ percent: 70, message: 'Matching variants...' });

      setAppState(APP_STATES.ANALYZING);
      const matcher = new Matcher(database);
      const result = matcher.match(variants);

      setProgress({ percent: 80, message: 'Categorizing results...' });

      setMatches(result.matches);
      setStats({
        totalVariants: variants.length,
        totalMatches: result.matches.length,
        ...result.stats
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
      setError(error.message || 'An error occurred during analysis');
    }
  }, [
    setAppState,
    setProgress,
    setError,
    setVariants,
    setMatches,
    setStats,
    categorizeMatches,
    setDatabaseInfo,
    setRiskScores,
    setPharmaResults,
    setActiveView,
    APP_STATES
  ]);

  const runAnalysis = useCallback(async (file, fileType) => {
    if (useAPI) {
      console.log('Using server API for analysis (2.4M SNPs)');
      return runAnalysisWithAPI(file);
    } else {
      console.log('Using local analysis (SNPedia only)');
      return runAnalysisLocal(file, fileType);
    }
  }, [useAPI, runAnalysisWithAPI, runAnalysisLocal]);

  return {
    runAnalysis,
    useAPI,
    apiStats,
    isCheckingAPI: useAPI === null
  };
}

export default useAnalysisFlow;
