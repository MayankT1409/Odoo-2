import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { adminAPI } from '../../utils/api';
import BroadcastMessage from '../../components/admin/BroadcastMessage';
import ContentModeration from '../../components/admin/ContentModeration';
import { 
  UsersIcon, 
  ArrowPathIcon, 
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BellIcon,
  SpeakerWaveIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await adminAPI.getDashboard();
      if (data.success) {
        setDashboardData(data.data);
        setError(''); // Clear any previous errors
      } else {
        setError(data.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Error loading dashboard. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.overview || {};

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: UsersIcon,
      color: 'blue',
      change: `+${stats.recentUsers || 0} this month`
    },
    {
      title: 'Active Swaps',
      value: stats.pendingSwaps || 0,
      icon: ArrowPathIcon,
      color: 'green',
      change: `${stats.totalSwaps || 0} total swaps`
    },
    {
      title: 'Reviews',
      value: stats.totalReviews || 0,
      icon: ChatBubbleLeftRightIcon,
      color: 'purple',
      change: `${stats.averageRating?.toFixed(1) || 0}/5 avg rating`
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate || 0}%`,
      icon: ChartBarIcon,
      color: 'indigo',
      change: `${stats.completedSwaps || 0} completed`
    }
  ];

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, ban/unban accounts',
      icon: UsersIcon,
      color: 'blue',
      href: '/admin/users'
    },
    {
      title: 'Content Moderation',
      description: 'Review and moderate skills, content',
      icon: ShieldCheckIcon,
      color: 'red',
      href: '/admin/moderation'
    },
    {
      title: 'Swap Monitoring',
      description: 'Monitor pending, accepted, cancelled swaps',
      icon: ArrowPathIcon,
      color: 'green',
      href: '/admin/swaps'
    },
    {
      title: 'Broadcast Messages',
      description: 'Send platform-wide announcements',
      icon: BellIcon,
      color: 'purple',
      href: '/admin/messages'
    },
    {
      title: 'Analytics & Reports',
      description: 'View detailed analytics and export reports',
      icon: ChartBarIcon,
      color: 'indigo',
      href: '/admin/analytics'
    },
    {
      title: 'Download Reports',
      description: 'Export user activity, feedback logs',
      icon: DocumentArrowDownIcon,
      color: 'gray',
      href: '/admin/reports'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'moderation', label: 'Content Moderation', icon: ShieldCheckIcon },
    { id: 'broadcast', label: 'Broadcast Messages', icon: SpeakerWaveIcon },
    { id: 'analytics', label: 'Analytics', icon: DocumentArrowDownIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome back, {user?.name}. Here's what's happening on your platform.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchDashboardData}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, index) => (
                <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {stat.title}
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stat.value}
                          </dd>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-sm text-gray-500">
                        {stat.change}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickActions.map((action, index) => (
                  <div
                    key={index}
                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => {
                      if (action.title === 'Content Moderation') {
                        setActiveTab('moderation');
                      } else if (action.title === 'Broadcast Messages') {
                        setActiveTab('broadcast');
                      } else if (action.title === 'Analytics & Reports') {
                        setActiveTab('analytics');
                      } else {
                        window.location.href = action.href;
                      }
                    }}
                  >
                    <div className="p-6">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 p-3 bg-${action.color}-100 rounded-md`}>
                          <action.icon className={`h-6 w-6 text-${action.color}-600`} />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Platform Overview</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">User Growth</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Active Users</span>
                        <span className="font-medium">{stats.activeUsers || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">New This Month</span>
                        <span className="font-medium text-green-600">+{stats.recentUsers || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Swap Activity</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pending Swaps</span>
                        <span className="font-medium">{stats.pendingSwaps || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Recent Swaps</span>
                        <span className="font-medium text-blue-600">{stats.recentSwaps || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'moderation' && <ContentModeration />}
        {activeTab === 'broadcast' && <BroadcastMessage />}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics & Reports</h2>
            <p className="text-gray-600">Advanced analytics and reporting features coming soon...</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Settings</h2>
            <p className="text-gray-600">System configuration and settings coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;