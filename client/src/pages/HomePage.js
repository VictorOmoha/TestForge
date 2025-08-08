import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Brain, BarChart, Clock, Users } from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Generated Questions',
      description: 'Get unique, intelligent questions tailored to your learning level and subject preferences.'
    },
    {
      icon: BarChart,
      title: 'Detailed Analytics',
      description: 'Track your progress with comprehensive analytics and identify areas for improvement.'
    },
    {
      icon: Clock,
      title: 'Unlimited Practice',
      description: 'Take as many tests as you want, whenever you want, with no restrictions.'
    },
    {
      icon: Users,
      title: 'Personalized Learning',
      description: 'Adaptive difficulty and personalized recommendations based on your performance.'
    }
  ];

  const subjects = [
    'Mathematics', 'Science', 'Programming', 'History', 'English', 'Geography'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">TestForge</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/auth/login"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/auth/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Master Any Subject with
              <span className="text-indigo-600 block">AI-Powered Testing</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create unlimited personalized tests, get instant AI-powered feedback, 
              and track your learning progress with our intelligent testing platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-medium flex items-center justify-center"
              >
                Start Testing Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/auth/login"
                className="border border-gray-300 hover:border-indigo-600 text-gray-700 hover:text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose TestForge?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform adapts to your learning style and helps you achieve your goals faster.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subjects Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Test Your Knowledge In Any Subject
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From mathematics to programming, our AI can generate questions for any topic you want to master.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {subjects.map((subject, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900">{subject}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-indigo-200 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are already using TestForge to achieve their goals.
          </p>
          <Link
            to="/auth/register"
            className="bg-white hover:bg-gray-100 text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium inline-flex items-center"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">TestForge</h3>
            <p className="text-gray-400 mb-8">
              AI-Powered Testing Platform for Accelerated Learning
            </p>
            <div className="flex justify-center space-x-8">
              <Link to="/auth/login" className="text-gray-400 hover:text-white">
                Sign In
              </Link>
              <Link to="/auth/register" className="text-gray-400 hover:text-white">
                Register
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
              <p>&copy; 2024 TestForge. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
