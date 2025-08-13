import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response time for debugging
    const endTime = new Date();
    const startTime = response.config.metadata?.startTime;
    if (startTime) {
      const duration = endTime.getTime() - startTime.getTime();
      console.debug(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    // Handle different types of errors
    const { response, request, message } = error;
    
    if (response) {
      // Server responded with error status
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
          toast.error('Session expired. Please login again.');
          break;
          
        case 403:
          toast.error('Access denied. You do not have permission to perform this action.');
          break;
          
        case 404:
          toast.error('Resource not found.');
          break;
          
        case 422:
          // Validation errors
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => {
              toast.error(err.msg || 'Validation error');
            });
          } else {
            toast.error(data.error || 'Validation error');
          }
          break;
          
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(data?.error || 'An error occurred');
      }
    } else if (request) {
      // Request was made but no response received
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      toast.error(message || 'An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    me: '/api/auth/me',
  },
  
  // Users
  users: {
    profile: '/api/users/profile',
  },
  
  // Tests
  tests: {
    configure: '/api/tests/configure',
    generate: '/api/tests/generate',
    questions: (attemptId) => `/api/tests/${attemptId}/questions`,
    submit: (attemptId) => `/api/tests/${attemptId}/submit`,
    saveProgress: (attemptId) => `/api/tests/${attemptId}/save-progress`,
    configurations: '/api/tests/configurations',
  },
  
  // Questions
  questions: {
    get: (attemptId) => `/api/questions/${attemptId}`,
    updateAnswer: (questionId) => `/api/questions/${questionId}/answer`,
    weakAreas: '/api/questions/weak-areas',
  },
  
  // Results
  results: {
    history: '/api/results/history',
    detail: (attemptId) => `/api/results/${attemptId}`,
    analytics: '/api/results/analytics/summary',
  },
  
  // Analytics
  analytics: {
    dashboard: '/api/analytics/dashboard',
    progress: '/api/analytics/progress',
    performanceComparison: '/api/analytics/performance-comparison',
  },
};

// API helper functions
export const apiHelpers = {
  // Test configuration
  createTestConfig: async (configData) => {
    const response = await api.post(endpoints.tests.configure, configData);
    return response.data;
  },
  
  // Test generation
  generateTest: async (configId) => {
    const response = await api.post(endpoints.tests.generate, { config_id: configId });
    return response.data;
  },
  
  // Get test questions
  getTestQuestions: async (attemptId) => {
    const response = await api.get(endpoints.tests.questions(attemptId));
    return response.data;
  },
  
  // Submit test
  submitTest: async (attemptId, answers, timeSpent) => {
    const response = await api.post(endpoints.tests.submit(attemptId), {
      answers,
      time_spent_seconds: timeSpent
    });
    return response.data;
  },
  
  // Save test progress
  saveTestProgress: async (attemptId, answers, currentQuestion, timeSpent) => {
    const response = await api.post(endpoints.tests.saveProgress(attemptId), {
      answers,
      current_question: currentQuestion,
      time_spent_seconds: timeSpent
    });
    return response.data;
  },
  
  // Get test history
  getTestHistory: async (params = {}) => {
    const response = await api.get(endpoints.results.history, { params });
    return response.data;
  },
  
  // Get test result
  getTestResult: async (attemptId) => {
    const response = await api.get(endpoints.results.detail(attemptId));
    return response.data;
  },
  
  // Get analytics
  getAnalytics: async () => {
    const response = await api.get(endpoints.analytics.dashboard);
    return response.data;
  },
  
  // Get progress data
  getProgress: async (params = {}) => {
    const response = await api.get(endpoints.analytics.progress, { params });
    return response.data;
  },
  
  // Get performance comparison
  getPerformanceComparison: async () => {
    const response = await api.get(endpoints.analytics.performanceComparison);
    return response.data;
  },
  
  // Update question answer
  updateQuestionAnswer: async (questionId, answer, timeSpent) => {
    const response = await api.put(endpoints.questions.updateAnswer(questionId), {
      answer,
      timeSpent
    });
    return response.data;
  },
  
  // Get weak areas
  getWeakAreas: async (limit = 5) => {
    const response = await api.get(endpoints.questions.weakAreas, {
      params: { limit }
    });
    return response.data;
  },
  
  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put(endpoints.users.profile, profileData);
    return response.data;
  },
  
  // Get user profile
  getProfile: async () => {
    const response = await api.get(endpoints.users.profile);
    return response.data;
  },
};

export default api;








