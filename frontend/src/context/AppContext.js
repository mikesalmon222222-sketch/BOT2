import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { bidService } from '../services/api';

const AppContext = createContext();

const initialState = {
  bids: [],
  todaysCount: 0,
  credentials: [],
  loading: false,
  error: null,
  lastRefresh: null
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_BIDS':
      return { ...state, bids: action.payload, loading: false, error: null };
    case 'SET_TODAYS_COUNT':
      return { ...state, todaysCount: action.payload };
    case 'SET_CREDENTIALS':
      return { ...state, credentials: action.payload, loading: false, error: null };
    case 'ADD_CREDENTIAL':
      return { ...state, credentials: [...state.credentials, action.payload] };
    case 'UPDATE_CREDENTIAL':
      return {
        ...state,
        credentials: state.credentials.map(cred => 
          cred._id === action.payload._id ? action.payload : cred
        )
      };
    case 'DELETE_CREDENTIAL':
      return {
        ...state,
        credentials: state.credentials.filter(cred => cred._id !== action.payload)
      };
    case 'SET_LAST_REFRESH':
      return { ...state, lastRefresh: new Date().toISOString() };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Fetch initial data
  useEffect(() => {
    fetchBids();
    fetchTodaysCount();
    fetchCredentials();
  }, []);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBids();
      fetchTodaysCount();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

  const fetchBids = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await bidService.getAllBids();
      dispatch({ type: 'SET_BIDS', payload: response.data.data });
      dispatch({ type: 'SET_LAST_REFRESH' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchTodaysCount = async () => {
    try {
      const response = await bidService.getTodaysCount();
      dispatch({ type: 'SET_TODAYS_COUNT', payload: response.data.count });
    } catch (error) {
      console.error('Error fetching today\'s count:', error);
    }
  };

  const fetchCredentials = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await bidService.getAllCredentials();
      dispatch({ type: 'SET_CREDENTIALS', payload: response.data.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const refreshBids = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await bidService.refreshBids();
      await fetchBids();
      await fetchTodaysCount();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const addCredential = async (credentialData) => {
    try {
      const response = await bidService.addCredential(credentialData);
      dispatch({ type: 'ADD_CREDENTIAL', payload: response.data.data });
      return response.data.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateCredential = async (id, credentialData) => {
    try {
      const response = await bidService.updateCredential(id, credentialData);
      dispatch({ type: 'UPDATE_CREDENTIAL', payload: response.data.data });
      return response.data.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteCredential = async (id) => {
    try {
      await bidService.deleteCredential(id);
      dispatch({ type: 'DELETE_CREDENTIAL', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value = {
    ...state,
    fetchBids,
    fetchTodaysCount,
    fetchCredentials,
    refreshBids,
    addCredential,
    updateCredential,
    deleteCredential,
    clearError
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};