import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-4xl font-bold text-white mb-6">TestForge</h1>
          <p className="text-xl text-indigo-200 mb-8">
            AI-Powered Testing Platform
          </p>
          <div className="space-y-4 text-indigo-100">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
              <span>Create unlimited AI-generated tests</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
              <span>Get instant scoring and feedback</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
              <span>Track your progress over time</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
              <span>Personalized learning analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center lg:hidden mb-8">
            <h1 className="text-3xl font-bold text-indigo-600">TestForge</h1>
            <p className="text-gray-600 mt-2">AI-Powered Testing Platform</p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
