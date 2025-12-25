import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAnalysis as useAnalysisContext } from '../context/AnalysisContext';
import { useUI } from '../context/UIContext';

// Import existing parsers and matcher
import { VCFParser } from '../parsers/vcf';
import { CSVParser } from '../parsers/csv';
import { Matcher } from '../analysis/matcher';

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
    setDatabaseInfo
  } = useAnalysisContext();

  const { setActiveView } = useUI();

  const runAnalysis = useCallback(async (file, fileType) => {
    try {
      // Stage 1: Parsing
      setAppState(APP_STATES.PARSING);
      setProgress({ stage: 'parsing', percent: 0, message: 'Parsing your DNA file...' });

      // Select parser based on file type
      const parser = fileType === 'csv' ? new CSVParser() : new VCFParser();
      // Parsers expect File object and call file.text() internally
      const variants = await parser.parse(file);

      setVariants(variants);
      setProgress({ percent: 50, message: `Found ${variants.length.toLocaleString()} variants` });

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

      setProgress({ percent: 90, message: 'Categorizing results...' });

      // Store results
      setMatches(result.matches);
      setStats({
        totalVariants: variants.length,
        totalMatches: result.matches.length,
        ...result.stats
      });

      // Categorize matches
      categorizeMatches(result.matches);

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
    setActiveView,
    APP_STATES
  ]);

  return { runAnalysis };
}

export default useAnalysisFlow;
