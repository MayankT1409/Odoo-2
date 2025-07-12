import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UsersIcon, 
  ClipboardDocumentListIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  MegaphoneIcon,
  XMarkIcon,
  CheckIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [reports, setReports] = useState([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');

  useEffect(() => {
    // Mock data
    const mockUsers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        status: 'active',
        joinDate: '2024-01-01',
        swapsCompleted: 5,
        rating: 4.5
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        status: 'banned',
        joinDate: '2024-01-05',
        swapsCompleted: 2,
        rating: 3.8
      },
      {
        id: 3,
        name: 'Mike Johnson',
        email: 'mike@example.com',
        status: 'active',
        joinDate: '2024-01-10',
        swapsCompleted: 8,
        rating: 4.9
      }
    ];

    const mockSwaps = [
      {
        id: 1,
        user1: 'John Doe',
        user2: 'Jane Smith',
        status: 'completed',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        skills: ['JavaScript', 'Python']
      },
      {
        id: 2,
        user1: 'Mike Johnson',
        user2: 'Sarah Chen',
        status: 'active',
        startDate: '2024-01-18',
        endDate: null,
        skills: ['Design', 'Marketing']
      },
      {
        id: 3,
        user1: 'Alex Rodriguez',
        user2: 'Emma Thompson',
        status: 'cancelled',
        startDate: '2024-01-12',
        endDate: '2024-01-14',
        skills: ['Mobile Dev', 'Project Management']
      }
    ];

    const mockReports = [
      {
        id: 1,
        reporter: 'John Doe',
        reported: 'Jane Smith',
        reason: 'Inappropriate behavior',
        date: '2024-01-20',
        status: 'pending'
      },
      {
        id: 2,
        reporter: 'Mike Johnson',
        reported: 'Alex Rodriguez',
        reason: 'Spam content',
        date: '2024-01-19',
        status: 'resolved'
      }
    ];

    setUsers(mockUsers);
    setSwaps(mockSwaps);
    setReports(mockReports);
  }, []);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleBanUser = (userId) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status: 'banned' } : user
    ));
  };

  const handleUnbanUser = (userId) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status: 'active' } : user
    ));
  };

  const handleResolveReport = (reportId) => {
    setReports(prev => prev.map(report => 
      report.id === reportId ? { ...report, status: 'resolved' } : report
    ));
  };

  const handleSendBroadcast = () => {
    if (broadcastMessage.trim()) {
      // Mock sending broadcast message
      alert('Broadcast message sent to all users!');
      setBroadcastMessage('');
      setShowMessageModal(false);
    }
  };

  const downloadReport = (type) => {
    // Mock download functionality
    alert(`Downloading ${type} report...`);
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalSwaps: swaps.length,
    activeSwaps: swaps.filter(s => s.status === 'active').length,
    completedSwaps: swaps.filter(s => s.status === 'completed').length,
    pendingReports: reports.filter(r => r.status === 'pending').length
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'swaps', label: 'Swaps', icon: ClipboardDocumentListIcon },
    { id: 'reports', label: 'Reports', icon: ExclamationTriangleIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, monitor swaps, and oversee platform activity</p>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowMessageModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              <MegaphoneIcon className="w-4 h-4" />
              <span>Send Broadcast</span>
            </button>
            <button
              onClick={() => downloadReport('users')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Download User Report</span>
            </button>
            <button
              onClick={() => downloadReport('swaps')}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Download Swap Report</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
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

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center">
                      <UsersIcon className="w-8 h-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Total Users</p>
                        <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center">
                      <UsersIcon className="w-8 h-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Active Users</p>
                        <p className="text-2xl font-bold text-green-900">{stats.activeUsers}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-center">
                      <ClipboardDocumentListIcon className="w-8 h-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600">Total Swaps</p>
                        <p className="text-2xl font-bold text-purple-900">{stats.totalSwaps}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                    <div className="flex items-center">
                      <ClipboardDocumentListIcon className="w-8 h-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-yellow-600">Active Swaps</p>
                        <p className="text-2xl font-bold text-yellow-900">{stats.activeSwaps}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                    <div className="flex items-center">
                      <CheckIcon className="w-8 h-8 text-indigo-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-indigo-600">Completed Swaps</p>
                        <p className="text-2xl font-bold text-indigo-900">{stats.completedSwaps}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-red-600">Pending Reports</p>
                        <p className="text-2xl font-bold text-red-900">{stats.pendingReports}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">User Management</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Swaps</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(user.joinDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.swapsCompleted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.rating.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {user.status === 'active' ? (
                              <button
                                onClick={() => handleBanUser(user.id)}
                                className="text-red-600 hover:text-red-900 mr-3"
                              >
                                Ban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnbanUser(user.id)}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                Unban
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Swaps Tab */}
            {activeTab === 'swaps' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Swap Management</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {swaps.map((swap) => (
                        <tr key={swap.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {swap.user1} ↔ {swap.user2}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {swap.skills.map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              swap.status === 'completed' ? 'bg-green-100 text-green-800' :
                              swap.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {swap.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(swap.startDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {swap.endDate ? new Date(swap.endDate).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">User Reports</h3>
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            Report against {report.reported}
                          </h4>
                          <p className="text-gray-600 mb-2">
                            <strong>Reporter:</strong> {report.reporter}
                          </p>
                          <p className="text-gray-600 mb-2">
                            <strong>Reason:</strong> {report.reason}
                          </p>
                          <p className="text-sm text-gray-500">
                            Reported on {new Date(report.date).toLocaleDateString()}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                            report.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        {report.status === 'pending' && (
                          <button
                            onClick={() => handleResolveReport(report.id)}
                            className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                          >
                            <CheckIcon className="w-4 h-4" />
                            <span>Resolve</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Broadcast Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Send Broadcast Message
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter your message to all users..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={!broadcastMessage.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;