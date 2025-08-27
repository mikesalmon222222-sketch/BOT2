import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getBids, getTodaysBidCount, refreshBids, getCredentials } from '../services/api';

// Initial state
const initialState = {
  bids: [],
  todaysCount: 0,
  credentials: [],
  loading: false,
  error: null,
  lastRefresh: null
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_BIDS: 'SET_BIDS',
  SET_TODAYS_COUNT: 'SET_TODAYS_COUNT',
  SET_CREDENTIALS: 'SET_CREDENTIALS',
  ADD_CREDENTIAL: 'ADD_CREDENTIAL',
  UPDATE_CREDENTIAL: 'UPDATE_CREDENTIAL',
  DELETE_CREDENTIAL: 'DELETE_CREDENTIAL',
  SET_LAST_REFRESH: 'SET_LAST_REFRESH'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ActionTypes.SET_BIDS:
      return { ...state, bids: action.payload, loading: false, error: null };
    case ActionTypes.SET_TODAYS_COUNT:
      return { ...state, todaysCount: action.payload };
    case ActionTypes.SET_CREDENTIALS:
      return { ...state, credentials: action.payload };
    case ActionTypes.ADD_CREDENTIAL:
      return { ...state, credentials: [...(state.credentials || []), action.payload] };
    case ActionTypes.UPDATE_CREDENTIAL:
      return {
        ...state,
        credentials: (state.credentials || []).map(cred =>
          cred._id === action.payload._id ? action.payload : cred
        )
      };
    case ActionTypes.DELETE_CREDENTIAL:
      return {
        ...state,
        credentials: (state.credentials || []).filter(cred => cred._id !== action.payload)
      };
    case ActionTypes.SET_LAST_REFRESH:
      return { ...state, lastRefresh: action.payload };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const setLoading = (loading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  };

  const setBids = (bids) => {
    dispatch({ type: ActionTypes.SET_BIDS, payload: bids });
  };

  const setTodaysCount = (count) => {
    dispatch({ type: ActionTypes.SET_TODAYS_COUNT, payload: count });
  };

  const setCredentials = (credentials) => {
    dispatch({ type: ActionTypes.SET_CREDENTIALS, payload: credentials });
  };

  const addCredential = (credential) => {
    dispatch({ type: ActionTypes.ADD_CREDENTIAL, payload: credential });
  };

  const updateCredential = (credential) => {
    dispatch({ type: ActionTypes.UPDATE_CREDENTIAL, payload: credential });
  };

  const deleteCredential = (id) => {
    dispatch({ type: ActionTypes.DELETE_CREDENTIAL, payload: id });
  };

  const setLastRefresh = (timestamp) => {
    dispatch({ type: ActionTypes.SET_LAST_REFRESH, payload: timestamp });
  };

  // Fetch bids
  const fetchBids = async () => {
    try {
      setLoading(true);
      const response = await getBids();
      setBids(response.data.data);
      setLastRefresh(new Date().toISOString());
    } catch (error) {
      setError(error.message || 'Failed to fetch bids');
    }
  };

  // Fetch today's count
  const fetchTodaysCount = async () => {
    try {
      const response = await getTodaysBidCount();
      setTodaysCount(response.data.data.count);
    } catch (error) {
      console.error('Failed to fetch today\'s count:', error);
    }
  };

  // Fetch credentials
  const fetchCredentials = async () => {
    try {
      const response = await getCredentials();
      // The API returns {success: true, count: 1, data: [...]}
      // We need just the array part
      setCredentials(response.data.data || []);
    } catch (error) {
      console.error('AppContext: Failed to fetch credentials:', error);
    }
  };

  // Manual refresh
  const handleRefresh = async () => {
    try {
      setLoading(true);
      await refreshBids();
      await fetchBids();
      await fetchTodaysCount();
      await fetchCredentials();
    } catch (error) {
      setError(error.message || 'Failed to refresh bids');
    }
  };

  // Auto-refresh every 15 minutes
  useEffect(() => {
    // Initial fetch
    fetchBids();
    fetchTodaysCount();
    fetchCredentials();

    // Set up interval for auto-refresh
    const interval = setInterval(() => {
      fetchBids();
      fetchTodaysCount();
      fetchCredentials();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    ...state,
    setLoading,
    setError,
    setBids,
    setTodaysCount,
    setCredentials,
    addCredential,
    updateCredential,
    deleteCredential,
    setLastRefresh,
    fetchBids,
    fetchTodaysCount,
    fetchCredentials,
    handleRefresh
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the AppContext
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;