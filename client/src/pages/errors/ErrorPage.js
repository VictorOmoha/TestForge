import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

const ErrorPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-600 mt-2">
            We're sorry, but something unexpected happened. Please try again.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </button>
          
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
