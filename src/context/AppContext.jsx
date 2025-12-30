import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import localforage from 'localforage';

// Configure localforage
localforage.config({
  name: 'AdamApp',
  storeName: 'dna_session'
});

// Application states
export const APP_STATES = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PARSING: 'parsing',
  ANALYZING: 'analyzing',
  COMPLETE: 'complete',
  ERROR: 'error'
};

// Initial state
const initialState = {
  appState: APP_STATES.IDLE,
  file: null,
  fileName: null,
  fileSize: null,
  fileType: null,
  progress: {
    stage: '',
    percent: 0,
    message: ''
  },
  error: null,
  startTime: null,
  endTime: null,
  isRestoring: true // New flag for initial hydration
};

const ACTIONS = {
  SET_FILE: 'SET_FILE',
  SET_STATE: 'SET_STATE',
  SET_PROGRESS: 'SET_PROGRESS',
  SET_ERROR: 'SET_ERROR',
  RESET: 'RESET',
  RESTORE_COMPLETE: 'RESTORE_COMPLETE'
};

function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_FILE:
      return {
        ...state,
        file: action.payload.file,
        fileName: action.payload.file?.name || null,
        fileSize: action.payload.file?.size || null,
        fileType: action.payload.fileType || null,
        appState: APP_STATES.UPLOADING,
        startTime: Date.now(),
        error: null
      };

    case ACTIONS.SET_STATE:
      return {
        ...state,
        appState: action.payload,
        endTime: action.payload === APP_STATES.COMPLETE ? Date.now() : state.endTime
      };

    case ACTIONS.SET_PROGRESS:
      return {
        ...state,
        progress: {
          ...state.progress,
          ...action.payload
        }
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        appState: APP_STATES.ERROR,
        error: action.payload,
        endTime: Date.now()
      };

    case ACTIONS.RESET:
      return {
        ...initialState,
        isRestoring: false
      };

    case ACTIONS.RESTORE_COMPLETE:
      return {
        ...state,
        ...action.payload,
        isRestoring: false
      };

    default:
      return state;
  }
}

// Create context
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Hydrate state on mount
  useEffect(() => {
    const hydrate = async () => {
      try {
        const savedState = await localforage.getItem('appState');
        if (savedState) {
          // If we have saved state, we need to restore it
          // Note: Binary file objects cannot be stored in IndexedDB directly in this way usually,
          // but we care more about the analysis results which are likely stored in AnalysisContext.
          // For AppContext, we mainly care about the metadata and 'COMPLETE' status.
          dispatch({ type: ACTIONS.RESTORE_COMPLETE, payload: savedState });
        } else {
          dispatch({ type: ACTIONS.RESTORE_COMPLETE, payload: {} });
        }
      } catch (err) {
        console.error('Failed to hydrate state:', err);
        dispatch({ type: ACTIONS.RESTORE_COMPLETE, payload: {} });
      }
    };
    hydrate();
  }, []);

  // Persist state when essential fields change
  useEffect(() => {
    if (state.appState === APP_STATES.COMPLETE && !state.isRestoring) {
      // Create a persistable version of state (exclude large binary file objects if needed, though IndexedDB can handle blobs)
      // Here we store metadata. The heavy lifting of storing analysis results should happen in AnalysisContext or a unified persistence layer.
      const stateToSave = {
        appState: state.appState,
        fileName: state.fileName,
        fileSize: state.fileSize,
        fileType: state.fileType,
        endTime: state.endTime
      };
      localforage.setItem('appState', stateToSave).catch(err => console.error('Failed to save state:', err));
    }
  }, [state.appState, state.fileName, state.fileSize, state.fileType, state.endTime, state.isRestoring]);

  const setFile = useCallback((file, fileType) => {
    dispatch({ type: ACTIONS.SET_FILE, payload: { file, fileType } });
  }, []);

  const setAppState = useCallback((appState) => {
    dispatch({ type: ACTIONS.SET_STATE, payload: appState });
  }, []);

  const setProgress = useCallback((progress) => {
    dispatch({ type: ACTIONS.SET_PROGRESS, payload: progress });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: error });
  }, []);

  const reset = useCallback(async () => {
    await localforage.clear(); // Clear storage on reset
    dispatch({ type: ACTIONS.RESET });
  }, []);

  const isProcessing = [
    APP_STATES.UPLOADING,
    APP_STATES.PARSING,
    APP_STATES.ANALYZING
  ].includes(state.appState);

  const processingDuration = state.endTime && state.startTime
    ? ((state.endTime - state.startTime) / 1000).toFixed(1)
    : null;

  const value = {
    // State
    ...state,
    isProcessing,
    processingDuration,

    // Actions
    setFile,
    setAppState,
    setProgress,
    setError,
    reset,

    // Constants
    APP_STATES
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
