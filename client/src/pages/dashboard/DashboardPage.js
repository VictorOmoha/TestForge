import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  FileText, 
  BarChart3, 
  Clock, 
  Target,
  TrendingUp,
  Award,
  Calendar
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Create New Test',
      description: 'Configure and generate a new AI-powered test',
      icon: Plus,
      href: '/dashboard/tests/configure',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'View Test History',
      description: 'Review your past test performances',
      icon: FileText,
      href: '/dashboard/tests/history',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Analytics Dashboard',
      description: 'Detailed insights into your learning progress',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Progress Tracking',
      description: 'Monitor your improvement over time',
      icon: TrendingUp,
      href: '/dashboard/analytics/progress',
      color: 'bg-blue-500 hover:bg-blue-600'
    }
  ];

  const stats = [
    {
      name: 'Tests Taken',
      value: '12',
      change: '+2 this week',
      icon: FileText,
      color: 'text-indigo-600'
    },
    {
      name: 'Average Score',
      value: '85%',
      change: '+5% improvement',
      icon: Target,
      color: 'text-green-600'
    },
    {
      name: 'Study Time',
      value: '24h',
      change: '+3h this week',
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      name: 'Achievements',
      value: '7',
      change: '2 new badges',
      icon: Award,
      color: 'text-yellow-600'
    }
  ];

  const recentTests = [
    {
      id: 1,
      subject: 'Mathematics',
      difficulty: 'Medium',
      score: 88,
      date: '2024-01-15',
      questions: 20
    },
    {
      id: 2,
      subject: 'Science',
      difficulty: 'Hard',
      score: 76,
      date: '2024-01-14',
      questions: 15
    },
    {
      id: 3,
      subject: 'Programming',
      difficulty: 'Easy',
      score: 95,
      date: '2024-01-13',
      questions: 25
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-indigo-100 text-lg">
              Ready to continue your learning journey? Let's create some tests and track your progress.
            </p>
          </div>
          <div className="hidden md:block">
            <Calendar className="h-16 w-16 text-indigo-200" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.href}
                className="group block"
              >
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 h-full">
                  <div className={`inline-flex p-3 rounded-lg text-white ${action.color} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Tests */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Tests</h2>
          <Link
            to="/dashboard/tests/history"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{test.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        test.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                        test.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {test.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{test.score}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{test.questions}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{test.date}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
