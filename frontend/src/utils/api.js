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