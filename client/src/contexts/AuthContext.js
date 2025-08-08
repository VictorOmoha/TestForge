import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_TOKEN: 'SET_TOKEN',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload,
        isAuthenticated: true
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Set auth token in API headers
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        try {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
          const response = await api.get('/api/auth/me');
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data.data.user });
        } catch (error) {
          console.error('Failed to load user:', error);
          logout();
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.post('/api/auth/login', { email, password });
      const { user, token } = response.data.data;

      // Store token
      localStorage.setItem('token', token);
      
      // Update state
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });

      toast.success('Login successful!');
      navigate('/dashboard');
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await api.post('/api/auth/register', userData);
      const { user, token } = response.data.data;

      // Store token
      localStorage.setItem('token', token);
      
      // Update state
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });

      toast.success('Registration successful!');
      navigate('/dashboard');
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    navigate('/');
    toast.success('Logged out successfully');
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      const response = await api.post('/api/auth/forgot-password', { email });
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to send reset email';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Reset password function
  const resetPassword = async (token, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      const response = await api.post('/api/auth/reset-password', { token, password });
      toast.success(response.data.message);
      navigate('/auth/login');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to reset password';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
      const response = await api.put('/api/users/profile', profileData);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data.data.user });
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;


