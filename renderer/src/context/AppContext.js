import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  stamps: [],
  selectedStamp: null,
  settings: {
    ebay: {
      enabled: false,
      apiKey: '',
      appId: '',
      devId: '',
      certId: ''
    },
    wix: {
      enabled: false,
      apiKey: '',
      siteId: ''
    },
    ai: {
      confidenceThreshold: 0.7,
      autoProcess: true
    }
  },
  loading: false,
  error: null,
  user: {
    uuid: 'default-user',
    name: 'Demo User'
  }
};

// Action types
export const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_STAMPS: 'SET_STAMPS',
  ADD_STAMP: 'ADD_STAMP',
  UPDATE_STAMP: 'UPDATE_STAMP',
  DELETE_STAMP: 'DELETE_STAMP',
  SELECT_STAMP: 'SELECT_STAMP',
  SET_SETTINGS: 'SET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS'
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case actionTypes.SET_STAMPS:
      return {
        ...state,
        stamps: action.payload,
        loading: false
      };

    case actionTypes.ADD_STAMP:
      return {
        ...state,
        stamps: [action.payload, ...state.stamps],
        loading: false
      };

    case actionTypes.UPDATE_STAMP:
      return {
        ...state,
        stamps: state.stamps.map(stamp =>
          stamp.stamp_uuid === action.payload.stamp_uuid
            ? { ...stamp, ...action.payload }
            : stamp
        ),
        selectedStamp: state.selectedStamp?.stamp_uuid === action.payload.stamp_uuid
          ? { ...state.selectedStamp, ...action.payload }
          : state.selectedStamp,
        loading: false
      };

    case actionTypes.DELETE_STAMP:
      return {
        ...state,
        stamps: state.stamps.filter(stamp => stamp.stamp_uuid !== action.payload),
        selectedStamp: state.selectedStamp?.stamp_uuid === action.payload
          ? null
          : state.selectedStamp,
        loading: false
      };

    case actionTypes.SELECT_STAMP:
      return {
        ...state,
        selectedStamp: action.payload
      };

    case actionTypes.SET_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };

    case actionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };

    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Action creators
  const actions = {
    setLoading: (loading) => {
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: loading
      });
    },

    setError: (error) => {
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: error
      });
    },

    clearError: () => {
      dispatch({
        type: actionTypes.CLEAR_ERROR
      });
    },

    setStamps: (stamps) => {
      dispatch({
        type: actionTypes.SET_STAMPS,
        payload: stamps
      });
    },

    addStamp: (stamp) => {
      dispatch({
        type: actionTypes.ADD_STAMP,
        payload: stamp
      });
    },

    updateStamp: (stamp) => {
      dispatch({
        type: actionTypes.UPDATE_STAMP,
        payload: stamp
      });
    },

    deleteStamp: (stampUuid) => {
      dispatch({
        type: actionTypes.DELETE_STAMP,
        payload: stampUuid
      });
    },

    selectStamp: (stamp) => {
      dispatch({
        type: actionTypes.SELECT_STAMP,
        payload: stamp
      });
    },

    setSettings: (settings) => {
      dispatch({
        type: actionTypes.SET_SETTINGS,
        payload: settings
      });
    },

    updateSettings: (settings) => {
      dispatch({
        type: actionTypes.UPDATE_SETTINGS,
        payload: settings
      });
    }
  };

  const value = {
    state,
    dispatch,
    actions
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Selectors for derived state
export const selectors = {
  getStampsByStatus: (state, status) => {
    return state.stamps.filter(stamp => stamp.processing_status === status);
  },

  getPendingStamps: (state) => {
    return selectors.getStampsByStatus(state, 'pending');
  },

  getProcessingStamps: (state) => {
    return selectors.getStampsByStatus(state, 'processing');
  },

  getCompletedStamps: (state) => {
    return selectors.getStampsByStatus(state, 'completed');
  },

  getFailedStamps: (state) => {
    return selectors.getStampsByStatus(state, 'failed');
  },

  getTotalStampValue: (state) => {
    return state.stamps.reduce((total, stamp) => {
      const price = parseFloat(stamp.user_input?.price || 0);
      return total + price;
    }, 0);
  },

  getStampStats: (state) => {
    const stamps = state.stamps;
    return {
      total: stamps.length,
      pending: selectors.getPendingStamps(state).length,
      processing: selectors.getProcessingStamps(state).length,
      completed: selectors.getCompletedStamps(state).length,
      failed: selectors.getFailedStamps(state).length,
      totalValue: selectors.getTotalStampValue(state)
    };
  }
};

export default AppContext;
