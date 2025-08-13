import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Action types
const THEME_ACTIONS = {
  SET_THEME: 'SET_THEME',
  TOGGLE_THEME: 'TOGGLE_THEME',
  SET_ACCESSIBILITY: 'SET_ACCESSIBILITY',
  SET_FONT_SIZE: 'SET_FONT_SIZE',
  SET_HIGH_CONTRAST: 'SET_HIGH_CONTRAST',
  SET_REDUCED_MOTION: 'SET_REDUCED_MOTION'
};

// Initial state
const getInitialState = () => {
  const savedTheme = localStorage.getItem('theme');
  const savedFontSize = localStorage.getItem('fontSize');
  const savedHighContrast = localStorage.getItem('highContrast') === 'true';
  const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true';

  return {
    theme: savedTheme || 'light',
    fontSize: savedFontSize || 'medium',
    highContrast: savedHighContrast,
    reducedMotion: savedReducedMotion,
    accessibility: {
      screenReader: false,
      keyboardNavigation: true,
      focusIndicators: true
    }
  };
};

// Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
    
    case THEME_ACTIONS.TOGGLE_THEME:
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light'
      };
    
    case THEME_ACTIONS.SET_FONT_SIZE:
      return {
        ...state,
        fontSize: action.payload
      };
    
    case THEME_ACTIONS.SET_HIGH_CONTRAST:
      return {
        ...state,
        highContrast: action.payload
      };
    
    case THEME_ACTIONS.SET_REDUCED_MOTION:
      return {
        ...state,
        reducedMotion: action.payload
      };
    
    case THEME_ACTIONS.SET_ACCESSIBILITY:
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          ...action.payload
        }
      };
    
    default:
      return state;
  }
};

// Create context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, getInitialState());

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    root.setAttribute('data-theme', state.theme);
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    root.style.fontSize = fontSizeMap[state.fontSize];
    
    // Apply high contrast
    if (state.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Apply reduced motion
    if (state.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', state.theme);
    localStorage.setItem('fontSize', state.fontSize);
    localStorage.setItem('highContrast', state.highContrast);
    localStorage.setItem('reducedMotion', state.reducedMotion);
  }, [state]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        dispatch({ type: THEME_ACTIONS.SET_THEME, payload: e.matches ? 'dark' : 'light' });
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for system reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e) => {
      if (!localStorage.getItem('reducedMotion')) {
        dispatch({ type: THEME_ACTIONS.SET_REDUCED_MOTION, payload: e.matches });
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Theme actions
  const setTheme = (theme) => {
    dispatch({ type: THEME_ACTIONS.SET_THEME, payload: theme });
  };

  const toggleTheme = () => {
    dispatch({ type: THEME_ACTIONS.TOGGLE_THEME });
  };

  const setFontSize = (size) => {
    dispatch({ type: THEME_ACTIONS.SET_FONT_SIZE, payload: size });
  };

  const setHighContrast = (enabled) => {
    dispatch({ type: THEME_ACTIONS.SET_HIGH_CONTRAST, payload: enabled });
  };

  const setReducedMotion = (enabled) => {
    dispatch({ type: THEME_ACTIONS.SET_REDUCED_MOTION, payload: enabled });
  };

  const setAccessibility = (settings) => {
    dispatch({ type: THEME_ACTIONS.SET_ACCESSIBILITY, payload: settings });
  };

  // Get theme colors
  const getThemeColors = () => {
    const lightColors = {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#16a34a',
      warning: '#d97706',
      error: '#dc2626',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb'
    };

    const darkColors = {
      primary: '#3b82f6',
      secondary: '#94a3b8',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#d1d5db',
      border: '#374151'
    };

    return state.theme === 'dark' ? darkColors : lightColors;
  };

  const value = {
    // State
    theme: state.theme,
    fontSize: state.fontSize,
    highContrast: state.highContrast,
    reducedMotion: state.reducedMotion,
    accessibility: state.accessibility,
    
    // Actions
    setTheme,
    toggleTheme,
    setFontSize,
    setHighContrast,
    setReducedMotion,
    setAccessibility,
    
    // Utilities
    getThemeColors,
    isDark: state.theme === 'dark',
    isLight: state.theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;








