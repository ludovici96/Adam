import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

const initialState = {
  variants: [],
  matches: [],

  stats: {
    totalVariants: 0,
    totalMatches: 0,
    rsidLookups: 0,
    rsidHits: 0,
    coordLookups: 0,
    coordHits: 0,
    genotypeMisses: 0
  },

  categories: {
    health: [],
    traits: [],
    ancestry: [],
    pharmacogenomics: [],
    carrier: [],
    other: []
  },

  riskScores: [],
  pharmaResults: null,
  emotionalProfile: null,
  partnerEmotionalProfile: null,
  haplogroups: {
    yDNA: null,
    mtDNA: null
  },

  databaseLoaded: false,
  databaseSize: 0
};

const ACTIONS = {
  SET_VARIANTS: 'SET_VARIANTS',
  SET_MATCHES: 'SET_MATCHES',
  SET_STATS: 'SET_STATS',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_RISK_SCORES: 'SET_RISK_SCORES',
  SET_PHARMA_RESULTS: 'SET_PHARMA_RESULTS',
  SET_EMOTIONAL_PROFILE: 'SET_EMOTIONAL_PROFILE',
  SET_PARTNER_EMOTIONAL_PROFILE: 'SET_PARTNER_EMOTIONAL_PROFILE',
  SET_HAPLOGROUPS: 'SET_HAPLOGROUPS',
  SET_DATABASE_INFO: 'SET_DATABASE_INFO',
  RESET: 'RESET'
};

function analysisReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_VARIANTS:
      return {
        ...state,
        variants: action.payload
      };

    case ACTIONS.SET_MATCHES:
      return {
        ...state,
        matches: action.payload
      };

    case ACTIONS.SET_STATS:
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload
        }
      };

    case ACTIONS.SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload
      };

    case ACTIONS.SET_RISK_SCORES:
      return {
        ...state,
        riskScores: action.payload
      };

    case ACTIONS.SET_PHARMA_RESULTS:
      return {
        ...state,
        pharmaResults: action.payload
      };

    case ACTIONS.SET_EMOTIONAL_PROFILE:
      return {
        ...state,
        emotionalProfile: action.payload
      };

    case ACTIONS.SET_PARTNER_EMOTIONAL_PROFILE:
      return {
        ...state,
        partnerEmotionalProfile: action.payload
      };

    case ACTIONS.SET_HAPLOGROUPS:
      return {
        ...state,
        haplogroups: {
          ...state.haplogroups,
          ...action.payload
        }
      };

    case ACTIONS.SET_DATABASE_INFO:
      return {
        ...state,
        databaseLoaded: true,
        databaseSize: action.payload.size
      };

    case ACTIONS.RESET:
      return {
        ...initialState,
        databaseLoaded: state.databaseLoaded,
        databaseSize: state.databaseSize
      };

    default:
      return state;
  }
}

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [state, dispatch] = useReducer(analysisReducer, initialState);

  const setVariants = useCallback((variants) => {
    dispatch({ type: ACTIONS.SET_VARIANTS, payload: variants });
  }, []);

  const setMatches = useCallback((matches) => {
    dispatch({ type: ACTIONS.SET_MATCHES, payload: matches });
  }, []);

  const setStats = useCallback((stats) => {
    dispatch({ type: ACTIONS.SET_STATS, payload: stats });
  }, []);

  const setCategories = useCallback((categories) => {
    dispatch({ type: ACTIONS.SET_CATEGORIES, payload: categories });
  }, []);

  const setRiskScores = useCallback((scores) => {
    dispatch({ type: ACTIONS.SET_RISK_SCORES, payload: scores });
  }, []);

  const setPharmaResults = useCallback((results) => {
    dispatch({ type: ACTIONS.SET_PHARMA_RESULTS, payload: results });
  }, []);

  const setEmotionalProfile = useCallback((profile) => {
    dispatch({ type: ACTIONS.SET_EMOTIONAL_PROFILE, payload: profile });
  }, []);

  const setHaplogroups = useCallback((haplogroups) => {
    dispatch({ type: ACTIONS.SET_HAPLOGROUPS, payload: haplogroups });
  }, []);

  const setDatabaseInfo = useCallback((info) => {
    dispatch({ type: ACTIONS.SET_DATABASE_INFO, payload: info });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: ACTIONS.RESET });
  }, []);

  const categorizeMatches = useCallback((matches) => {
    const categories = {
      health: [],
      traits: [],
      ancestry: [],
      pharmacogenomics: [],
      carrier: [],
      other: []
    };

    matches.forEach(match => {
      const category = match.category?.toLowerCase() || 'other';
      if (categories[category]) {
        categories[category].push(match);
      } else {
        categories.other.push(match);
      }
    });

    Object.keys(categories).forEach(key => {
      categories[key].sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0));
    });

    setCategories(categories);
    return categories;
  }, [setCategories]);

  const computed = useMemo(() => {
    const notableFindings = state.matches.filter(m => (m.magnitude || 0) >= 2);
    const positiveFindings = state.matches.filter(m => m.repute?.toLowerCase() === 'good');
    const negativeFindings = state.matches.filter(m => m.repute?.toLowerCase() === 'bad');

    const magnitudeDistribution = {
      critical: state.matches.filter(m => (m.magnitude || 0) >= 4).length,
      high: state.matches.filter(m => (m.magnitude || 0) >= 3 && (m.magnitude || 0) < 4).length,
      moderate: state.matches.filter(m => (m.magnitude || 0) >= 2 && (m.magnitude || 0) < 3).length,
      low: state.matches.filter(m => (m.magnitude || 0) >= 1 && (m.magnitude || 0) < 2).length,
      benign: state.matches.filter(m => (m.magnitude || 0) < 1).length
    };

    const topFindings = [...state.matches]
      .sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0))
      .slice(0, 10);

    return {
      notableFindings,
      positiveFindings,
      negativeFindings,
      magnitudeDistribution,
      topFindings,
      notableCount: notableFindings.length,
      positiveCount: positiveFindings.length,
      negativeCount: negativeFindings.length
    };
  }, [state.matches]);

  const value = {
    ...state,
    ...computed,
    setVariants,
    setMatches,
    setStats,
    setCategories,
    setRiskScores,
    setPharmaResults,
    setEmotionalProfile,
    setHaplogroups,
    setDatabaseInfo,
    categorizeMatches,
    setPartnerEmotionalProfile: (profile) => dispatch({ type: ACTIONS.SET_PARTNER_EMOTIONAL_PROFILE, payload: profile }),
    reset
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}

export default AnalysisContext;
