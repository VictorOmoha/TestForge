import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const routeError = useRouteError();

  // Determine if this is a route error or component error
  const isRouteError = isRouteErrorResponse(routeError);
  const displayError = isRouteError ? routeError : error;

  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <>
      <Helmet>
        <title>Error - TestForge</title>
        <meta name="description" content="An error occurred while using TestForge" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isRouteError ? 'Page Not Found' : 'Something went wrong'}
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              {isRouteError 
                ? 'The page you are looking for does not exist or has been moved.'
                : 'We encountered an unexpected error. Please try again or contact support if the problem persists.'
              }
            </p>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && displayError && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Error Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded-md text-xs font-mono text-gray-800 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Message:</strong> {displayError.message || 'No error message'}
                  </div>
                  {displayError.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{displayError.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full btn btn-primary flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={handleGoBack}
                  className="flex-1 btn btn-outline flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </button>

                <button
                  onClick={handleGoHome}
                  className="flex-1 btn btn-outline flex items-center justify-center"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </button>
              </div>
            </div>

            {/* Support Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                If this problem persists, please contact our support team at{' '}
                <a 
                  href="mailto:support@testforge.com" 
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  support@testforge.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorFallback;








