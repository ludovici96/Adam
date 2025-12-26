import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// Initial state
const initialState = {
  // Theme
  theme: 'system', // 'light' | 'dark' | 'system'
  resolvedTheme: 'light', // Actual theme after system preference resolution

  // Layout
  sidebarOpen: true,
  sidebarCollapsed: false,

  // Navigation
  activeView: 'upload', // 'upload' | 'dashboard' | 'report' | 'compare'
  activeCategory: 'all', // 'all' | 'health' | 'traits' | 'ancestry' | 'pharmacogenomics' | 'carrier'

  // Modal state
  selectedSNP: null,
  modalOpen: false,

  // Filters
  filters: {
    search: '',
    category: 'all',
    magnitudeMin: 0,
    magnitudeMax: 10,
    repute: 'all' // 'all' | 'good' | 'bad' | 'neutral'
  },

  // Sorting
  sort: {
    field: 'magnitude', // 'magnitude' | 'rsid' | 'repute' | 'category' | 'chromosome'
    direction: 'desc' // 'asc' | 'desc'
  },

  // Export state
  exportInProgress: false,
  exportFormat: null
};

const ACTIONS = {
  SET_THEME: 'SET_THEME',
  SET_RESOLVED_THEME: 'SET_RESOLVED_THEME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_ACTIVE_VIEW: 'SET_ACTIVE_VIEW',
  SET_ACTIVE_CATEGORY: 'SET_ACTIVE_CATEGORY',
  SET_SELECTED_SNP: 'SET_SELECTED_SNP',
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  SET_FILTER: 'SET_FILTER',
  RESET_FILTERS: 'RESET_FILTERS',
  SET_SORT: 'SET_SORT',
  SET_EXPORT_STATE: 'SET_EXPORT_STATE',
  RESET: 'RESET'
};

function uiReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };

    case ACTIONS.SET_RESOLVED_THEME:
      return {
        ...state,
        resolvedTheme: action.payload
      };

    case ACTIONS.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: action.payload ?? !state.sidebarOpen
      };

    case ACTIONS.SET_ACTIVE_VIEW:
      return {
        ...state,
        activeView: action.payload
      };

    case ACTIONS.SET_ACTIVE_CATEGORY:
      return {
        ...state,
        activeCategory: action.payload,
        filters: {
          ...state.filters,
          category: action.payload
        }
      };

    case ACTIONS.SET_SELECTED_SNP:
      return {
        ...state,
        selectedSNP: action.payload,
        modalOpen: action.payload !== null
      };

    case ACTIONS.OPEN_MODAL:
      return {
        ...state,
        modalOpen: true
      };

    case ACTIONS.CLOSE_MODAL:
      return {
        ...state,
        modalOpen: false,
        selectedSNP: null
      };

    case ACTIONS.SET_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };

    case ACTIONS.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters
      };

    case ACTIONS.SET_SORT:
      return {
        ...state,
        sort: {
          ...state.sort,
          ...action.payload
        }
      };

    case ACTIONS.SET_EXPORT_STATE:
      return {
        ...state,
        exportInProgress: action.payload.inProgress,
        exportFormat: action.payload.format
      };

    case ACTIONS.RESET:
      return {
        ...initialState,
        theme: state.theme,
        resolvedTheme: state.resolvedTheme
      };

    default:
      return state;
  }
}

// Create context
const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  const setTheme = useCallback((theme) => {
    dispatch({ type: ACTIONS.SET_THEME, payload: theme });
    localStorage.setItem('dna-genesis-theme', theme);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('dna-genesis-theme');
    if (savedTheme) {
      dispatch({ type: ACTIONS.SET_THEME, payload: savedTheme });
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (theme) => {
      dispatch({ type: ACTIONS.SET_RESOLVED_THEME, payload: theme });
      document.documentElement.setAttribute('data-theme', theme);
      // Add/remove 'dark' class for Tailwind
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    const handleChange = () => {
      if (state.theme === 'system') {
        const resolved = mediaQuery.matches ? 'dark' : 'light';
        applyTheme(resolved);
      }
    };

    // Initial resolution
    if (state.theme === 'system') {
      handleChange();
    } else {
      applyTheme(state.theme);
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [state.theme]);

  const toggleTheme = useCallback(() => {
    const newTheme = state.resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [state.resolvedTheme, setTheme]);

  const toggleSidebar = useCallback((open) => {
    dispatch({ type: ACTIONS.TOGGLE_SIDEBAR, payload: open });
  }, []);

  const setActiveView = useCallback((view) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_VIEW, payload: view });
  }, []);

  const setActiveCategory = useCallback((category) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_CATEGORY, payload: category });
  }, []);

  const selectSNP = useCallback((snp) => {
    dispatch({ type: ACTIONS.SET_SELECTED_SNP, payload: snp });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: ACTIONS.CLOSE_MODAL });
  }, []);

  const setFilter = useCallback((filter) => {
    dispatch({ type: ACTIONS.SET_FILTER, payload: filter });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_FILTERS });
  }, []);

  const setSort = useCallback((sort) => {
    dispatch({ type: ACTIONS.SET_SORT, payload: sort });
  }, []);

  const toggleSortDirection = useCallback(() => {
    dispatch({
      type: ACTIONS.SET_SORT,
      payload: { direction: state.sort.direction === 'asc' ? 'desc' : 'asc' }
    });
  }, [state.sort.direction]);

  const setExportState = useCallback((inProgress, format = null) => {
    dispatch({ type: ACTIONS.SET_EXPORT_STATE, payload: { inProgress, format } });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: ACTIONS.RESET });
  }, []);

  const value = {
    // State
    ...state,

    // Theme actions
    setTheme,
    toggleTheme,

    // Layout actions
    toggleSidebar,

    // Navigation actions
    setActiveView,
    setActiveCategory,

    // Modal actions
    selectSNP,
    closeModal,

    // Filter actions
    setFilter,
    resetFilters,

    // Sort actions
    setSort,
    toggleSortDirection,

    // Export actions
    setExportState,

    // Reset
    reset
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

// Hook to use the context
export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

export default UIContext;
