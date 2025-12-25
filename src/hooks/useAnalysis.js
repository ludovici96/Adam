import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAnalysis as useAnalysisContext } from '../context/AnalysisContext';
import { useUI } from '../context/UIContext';

// Import parser factory and matcher
import { ParserFactory, FILE_FORMATS } from '../parsers/index.js';
import { Matcher } from '../analysis/matcher';
import { RiskCalculator } from '../analysis/RiskCalculator';
import { PharmaAnalyzer } from '../analysis/PharmaAnalyzer';

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

  const runAnalysis = useCallback(async (file, fileType) => {
    try {
      // Stage 1: Parsing with auto-detection
      setAppState(APP_STATES.PARSING);
      setProgress({ stage: 'parsing', percent: 0, message: 'Detecting file format...' });

      // Use ParserFactory for auto-detection and parsing
      const parseResult = await ParserFactory.parse(file);
      const { variants, format, stats: parseStats } = parseResult;

      // Show detected format to user
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

      // Stage 2: Loading database
      setProgress({ stage: 'analyzing', percent: 60, message: 'Loading SNPedia database...' });

      // Fetch SNPedia database
      const dbResponse = await fetch('/data/snpedia.json');
      if (!dbResponse.ok) {
        throw new Error('Failed to load SNPedia database. Please ensure the database file exists.');
      }
      const database = await dbResponse.json();

      setDatabaseInfo({ size: Object.keys(database).length });
      setProgress({ percent: 70, message: 'Matching variants...' });

      // Stage 3: Matching
      setAppState(APP_STATES.ANALYZING);
      const matcher = new Matcher(database);
      const result = matcher.match(variants);

      setProgress({ percent: 80, message: 'Categorizing results...' });

      // Store results
      setMatches(result.matches);
      setStats({
        totalVariants: variants.length,
        totalMatches: result.matches.length,
        ...result.stats
      });

      // Categorize matches
      categorizeMatches(result.matches);

      // Stage 4: Advanced Analysis
      setProgress({ percent: 85, message: 'Calculating health risk scores...' });

      // Run health risk calculator
      const riskCalculator = new RiskCalculator();
      const riskScores = riskCalculator.calculateAllRiskScores(result.matches);
      setRiskScores(riskScores);

      setProgress({ percent: 92, message: 'Analyzing drug interactions...' });

      // Run pharmacogenomics analyzer
      const pharmaAnalyzer = new PharmaAnalyzer();
      const pharmaResults = pharmaAnalyzer.analyze(result.matches);
      setPharmaResults(pharmaResults);

      // Complete
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

  return { runAnalysis };
}

export default useAnalysisFlow;
