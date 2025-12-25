import React, { createContext, useContext, useReducer, useCallback } from 'react';

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
  endTime: null
};

// Action types
const ACTIONS = {
  SET_FILE: 'SET_FILE',
  SET_STATE: 'SET_STATE',
  SET_PROGRESS: 'SET_PROGRESS',
  SET_ERROR: 'SET_ERROR',
  RESET: 'RESET'
};

// Reducer
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
      return initialState;

    default:
      return state;
  }
}

// Create context
const AppContext = createContext(null);

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
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

  const reset = useCallback(() => {
    dispatch({ type: ACTIONS.RESET });
  }, []);

  // Computed values
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
