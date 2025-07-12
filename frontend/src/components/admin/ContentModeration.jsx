import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  ShieldCheckIcon, 
  FlagIcon,
  EyeSlashIcon,
  EyeIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const ContentModeration = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [moderationData, setModerationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchModerationData();
  }, []);

  const fetchModerationData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getModerationDashboard();
      
      if (response.success) {
        setModerationData(response.data);
        setError('');
      } else {
        setError(response.message || 'Failed to fetch moderation data');
      }
    } catch (err) {
      console.error('Moderation data fetch error:', err);
      setError('Error loading moderation data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFlagSwap = async (swapId, isFlagged, reason = '') => {
    try {
      setActionLoading(true);
      const response = await adminAPI.flagSwap(swapId, isFlagged, reason);
      
      if (response.success) {
        await fetchModerationData(); // Refresh data
      } else {
        setError(response.message || 'Failed to update flag status');
      }
    } catch (err) {
      console.error('Flag swap error:', err);
      setError('Error updating flag status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHideReview = async (reviewId, isHidden) => {
    try {
      setActionLoading(true);
      const response = await adminAPI.toggleReviewVisibility(reviewId, isHidden);
      
      if (response.success) {
        await fetchModerationData(); // Refresh data
      } else {
        setError(response.message || 'Failed to update review visibility');
      }
    } catch (err) {
      console.error('Hide review error:', err);
      setError('Error updating review visibility. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async (userId, isBanned, reason = '') => {
    try {
      setActionLoading(true);
      const response = await adminAPI.banUser(userId, isBanned, reason);
      
      if (response.success) {
        await fetchModerationData(); // Refresh data
      } else {
        setError(response.message || 'Failed to update user ban status');
      }
    } catch (err) {
      console.error('Ban user error:', err);
      setError('Error updating user ban status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: ShieldCheckIcon },
    { id: 'flagged', label: 'Flagged Content', icon: FlagIcon },
    { id: 'users', label: 'Reported Users', icon: UserIcon },
    { id: 'reviews', label: 'Reviews', icon: ChatBubbleLeftRightIcon }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading moderation data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Content Moderation</h2>
          </div>
          <button
            onClick={fetchModerationData}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
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

      {/* Content */}
      <div className="p-6">
        {activeTab === 'dashboard' && moderationData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <FlagIcon className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-600">Flagged Content</p>
                  <p className="text-2xl font-bold text-red-900">{moderationData.statistics?.totalFlagged || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <UserIcon className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">Banned Users</p>
                  <p className="text-2xl font-bold text-yellow-900">{moderationData.statistics?.totalBanned || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <EyeSlashIcon className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Hidden Reviews</p>
                  <p className="text-2xl font-bold text-blue-900">{moderationData.statistics?.totalHiddenReviews || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <ShieldCheckIcon className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">Pending Flags</p>
                  <p className="text-2xl font-bold text-purple-900">{moderationData.statistics?.pendingFlags || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'flagged' && moderationData?.flaggedContent && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Flagged Swap Requests</h3>
            {moderationData.flaggedContent.swaps.length === 0 ? (
              <p className="text-gray-500">No flagged content found.</p>
            ) : (
              <div className="space-y-4">
                {moderationData.flaggedContent.swaps.map((swap) => (
                  <div key={swap._id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <FlagIcon className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">
                            {swap.skillOffered} ↔ {swap.skillWanted}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{swap.message}</p>
                        <div className="text-xs text-gray-500">
                          <p>Requester: {swap.requester?.name}</p>
                          <p>Recipient: {swap.recipient?.name}</p>
                          <p>Flagged: {new Date(swap.flaggedAt).toLocaleDateString()}</p>
                          {swap.flagReason && <p>Reason: {swap.flagReason}</p>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFlagSwap(swap._id, false)}
                          disabled={actionLoading}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Unflag
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && moderationData?.reportedUsers && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Reported Users</h3>
            {moderationData.reportedUsers.users.length === 0 ? (
              <p className="text-gray-500">No reported users found.</p>
            ) : (
              <div className="space-y-4">
                {moderationData.reportedUsers.users.map((user) => (
                  <div key={user._id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <UserIcon className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">{user.name}</span>
                          <span className="text-xs text-gray-500">({user.email})</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          <p>Status: {user.isActive ? 'Active' : 'Banned'}</p>
                          {user.banReason && <p>Ban Reason: {user.banReason}</p>}
                          {user.bannedAt && <p>Banned: {new Date(user.bannedAt).toLocaleDateString()}</p>}
                          {user.reportCount && <p>Reports: {user.reportCount}</p>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {user.isActive ? (
                          <button
                            onClick={() => handleBanUser(user._id, true, 'Banned by admin')}
                            disabled={actionLoading}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Ban User
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBanUser(user._id, false)}
                            disabled={actionLoading}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Unban User
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && moderationData?.pendingReviews && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Reviews Needing Attention</h3>
            {moderationData.pendingReviews.reviews.length === 0 ? (
              <p className="text-gray-500">No reviews needing attention.</p>
            ) : (
              <div className="space-y-4">
                {moderationData.pendingReviews.reviews.map((review) => (
                  <div key={review._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium">Rating: {review.rating?.overall}/5</span>
                          <span className="text-xs text-gray-500">
                            by {review.reviewer?.name} for {review.reviewee?.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                        <div className="text-xs text-gray-500">
                          <p>Date: {new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleHideReview(review._id, !review.isHidden)}
                          disabled={actionLoading}
                          className={`px-3 py-1 text-xs rounded disabled:opacity-50 ${
                            review.isHidden
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {review.isHidden ? (
                            <div className="flex items-center space-x-1">
                              <EyeIcon className="w-3 h-3" />
                              <span>Show</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <EyeSlashIcon className="w-3 h-3" />
                              <span>Hide</span>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentModeration;