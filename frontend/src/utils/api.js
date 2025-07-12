// API utility for consistent API calls
const BASE_URL = 'http://localhost:5000';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: getAuthHeaders(),
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Admin API functions
export const adminAPI = {
  // Get dashboard data
  getDashboard: () => apiCall('/api/admin/dashboard'),
  
  // Get users with optional query parameters
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/admin/users${queryString ? `?${queryString}` : ''}`;
    return apiCall(endpoint);
  },
  
  // Update user
  updateUser: (userId, userData) => apiCall(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  
  // Ban/Unban user
  banUser: (userId, isBanned, banReason = null) => apiCall(`/api/admin/users/${userId}/ban`, {
    method: 'PUT',
    body: JSON.stringify({ isBanned, banReason })
  }),
  
  // Delete user
  deleteUser: (userId) => apiCall(`/api/admin/users/${userId}`, {
    method: 'DELETE'
  }),
  
  // Get swaps
  getSwaps: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/admin/swaps${queryString ? `?${queryString}` : ''}`;
    return apiCall(endpoint);
  },
  
  // Update swap
  updateSwap: (swapId, swapData) => apiCall(`/api/admin/swaps/${swapId}`, {
    method: 'PUT',
    body: JSON.stringify(swapData)
  }),
  
  // Delete swap
  deleteSwap: (swapId) => apiCall(`/api/admin/swaps/${swapId}`, {
    method: 'DELETE'
  }),
  
  // Flag/Unflag swap
  flagSwap: (swapId, isFlagged, flagReason = null) => apiCall(`/api/admin/swaps/${swapId}/flag`, {
    method: 'PUT',
    body: JSON.stringify({ isFlagged, flagReason })
  }),
  
  // Get reviews
  getReviews: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/admin/reviews${queryString ? `?${queryString}` : ''}`;
    return apiCall(endpoint);
  },
  
  // Hide/Unhide review
  toggleReviewVisibility: (reviewId, isHidden) => apiCall(`/api/admin/reviews/${reviewId}/visibility`, {
    method: 'PUT',
    body: JSON.stringify({ isHidden })
  }),
  
  // Broadcast message
  broadcastMessage: (messageData) => apiCall('/api/admin/messages/broadcast', {
    method: 'POST',
    body: JSON.stringify(messageData)
  }),
  
  // Get analytics
  getAnalytics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/admin/analytics${queryString ? `?${queryString}` : ''}`;
    return apiCall(endpoint);
  },
  
  // Get advanced analytics
  getAdvancedAnalytics: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/admin/analytics/advanced${queryString ? `?${queryString}` : ''}`;
    return apiCall(endpoint);
  },
  
  // Get system health
  getSystemHealth: () => apiCall('/api/admin/system/health'),
  
  // Get moderation dashboard
  getModerationDashboard: () => apiCall('/api/admin/moderation/dashboard'),
  
  // Moderate user skills
  moderateUserSkills: (userId, skillsData) => apiCall(`/api/admin/users/${userId}/skills/moderate`, {
    method: 'PUT',
    body: JSON.stringify(skillsData)
  }),
  
  // Bulk moderation action
  bulkModerationAction: (actionData) => apiCall('/api/admin/moderation/bulk-action', {
    method: 'POST',
    body: JSON.stringify(actionData)
  }),
  
  // Get notifications
  getNotifications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/admin/notifications${queryString ? `?${queryString}` : ''}`;
    return apiCall(endpoint);
  },
  
  // Update notification
  updateNotification: (notificationId, notificationData) => apiCall(`/api/admin/notifications/${notificationId}`, {
    method: 'PUT',
    body: JSON.stringify(notificationData)
  }),
  
  // Delete notification
  deleteNotification: (notificationId) => apiCall(`/api/admin/notifications/${notificationId}`, {
    method: 'DELETE'
  }),
  
  // Get statistics overview
  getStatisticsOverview: () => apiCall('/api/admin/statistics/overview'),
  
  // Export data
  exportData: (type, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/admin/export/${type}${queryString ? `?${queryString}` : ''}`;
    return apiCall(endpoint);
  },
  
  // Generate reports
  generateReport: (reportType, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/admin/reports/${reportType}${queryString ? `?${queryString}` : ''}`;
    return apiCall(endpoint);
  },
  
  // Get swap monitoring data
  getSwapMonitoring: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/admin/swaps/monitor${queryString ? `?${queryString}` : ''}`;
    return apiCall(endpoint);
  }
};

// Auth API functions
export const authAPI = {
  login: (email, password) => apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  
  signup: (userData) => apiCall('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  })
};

// General API functions
export const api = {
  // Health check
  health: () => apiCall('/api/health'),
  
  // User profile
  getProfile: () => apiCall('/api/users/profile'),
  updateProfile: (userData) => apiCall('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(userData)
  })
};

export default { adminAPI, authAPI, api };