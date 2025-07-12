import React, { useState, useEffect } from 'react';
import { 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { adminAPI } from '../../utils/api';

const SwapMonitoring = () => {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    flagged: '',
    overdue: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 25
  });
  const [statistics, setStatistics] = useState({
    totalActive: 0,
    totalPending: 0,
    totalCompleted: 0,
    totalFlagged: 0
  });

  useEffect(() => {
    fetchSwaps();
  }, [filters, pagination.current]);

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: pagination.current,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await fetch(`http://localhost:5000/api/admin/swaps?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSwaps(data.data?.swaps || []);
        setPagination(data.data?.pagination || { current: 1, pages: 1, total: 0, limit: 25 });
        setStatistics(data.data?.statistics || {
          totalActive: 0,
          totalPending: 0,
          totalCompleted: 0,
          totalFlagged: 0
        });
        setError(''); // Clear any previous errors
      } else {
        setError('Failed to fetch swap data');
      }
    } catch (err) {
      setError('Error loading swaps');
    } finally {
      setLoading(false);
    }
  };

  const updateSwapStatus = async (swapId, status, priority, adminNotes) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/swaps/${swapId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, priority, adminNotes })
      });

      if (response.ok) {
        fetchSwaps();
      } else {
        setError('Failed to update swap');
      }
    } catch (err) {
      setError('Error updating swap');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadgeColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = (swap) => {
    const daysSinceCreated = Math.floor((new Date() - new Date(swap.createdAt)) / (1000 * 60 * 60 * 24));
    return ['pending', 'accepted'].includes(swap.status) && daysSinceCreated > 7;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Swap Monitoring</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Monitor and manage all skill swap requests
                </p>
              </div>
              <button
                onClick={fetchSwaps}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Swaps
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics?.totalActive || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FlagIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Flagged
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statistics?.totalFlagged || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Overdue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {(swaps || []).filter(s => isOverdue(s)).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowPathIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Swaps
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pagination.total}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flagged</label>
                <select
                  value={filters.flagged}
                  onChange={(e) => setFilters({...filters, flagged: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All</option>
                  <option value="true">Flagged Only</option>
                  <option value="false">Not Flagged</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overdue</label>
                <select
                  value={filters.overdue}
                  onChange={(e) => setFilters({...filters, overdue: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All</option>
                  <option value="true">Overdue Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Swaps Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Swap Requests ({pagination.total})
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading swaps...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Swap Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {swaps.map((swap) => (
                    <tr key={swap._id} className={`hover:bg-gray-50 ${isOverdue(swap) ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {swap.skillOffered} ↔ {swap.skillWanted}
                          </div>
                          <div className="text-sm text-gray-500">
                            {swap.message && swap.message.substring(0, 50)}...
                          </div>
                          {swap.isFlagged && (
                            <div className="flex items-center mt-1">
                              <FlagIcon className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-xs text-red-600">Flagged</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {swap.requester?.name}
                          </div>
                          <div className="text-gray-500">→ {swap.recipient?.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(swap.status)}`}>
                          {swap.status}
                        </span>
                        {isOverdue(swap) && (
                          <div className="text-xs text-red-600 mt-1">Overdue</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={swap.priority}
                          onChange={(e) => updateSwapStatus(swap._id, null, e.target.value, null)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${getPriorityBadgeColor(swap.priority)}`}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(swap.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {swap.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateSwapStatus(swap._id, 'accepted', null, 'Admin approved')}
                                className="text-green-600 hover:text-green-900 flex items-center"
                              >
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => updateSwapStatus(swap._id, 'rejected', null, 'Admin rejected')}
                                className="text-red-600 hover:text-red-900 flex items-center"
                              >
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Reject
                              </button>
                            </>
                          )}
                          <button className="text-blue-600 hover:text-blue-900">
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.current} of {pagination.pages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination({...pagination, current: pagination.current - 1})}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({...pagination, current: pagination.current + 1})}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapMonitoring;