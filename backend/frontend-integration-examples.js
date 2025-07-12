// SkillSwap Frontend Integration Examples
// Copy these functions to your React app for easy API integration

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get token from localStorage
const getAuthToken = () => localStorage.getItem('skillswap_token');

// Helper function to make authenticated requests
const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
};

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

export const authAPI = {
  // Register new user
  signup: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem('skillswap_token', data.token);
      localStorage.setItem('skillswap_user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Login user
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem('skillswap_token', data.token);
      localStorage.setItem('skillswap_user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await authFetch(`${API_BASE_URL}/auth/me`);
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('skillswap_user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Logout user
  logout: async () => {
    await authFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    localStorage.removeItem('skillswap_token');
    localStorage.removeItem('skillswap_user');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAuthToken();
  },

  // Get stored user data
  getStoredUser: () => {
    const user = localStorage.getItem('skillswap_user');
    return user ? JSON.parse(user) : null;
  },
};

// =============================================================================
// USER FUNCTIONS
// =============================================================================

export const userAPI = {
  // Get all users with optional filters
  getUsers: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value);
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/users?${queryParams}`);
    return response.json();
  },

  // Get user profile by ID
  getUserProfile: async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    return response.json();
  },

  // Update user profile
  updateProfile: async (userId, updateData) => {
    const response = await authFetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.json();
  },

  // Find skill matches for user
  findMatches: async (userId, limit = 10) => {
    const response = await authFetch(`${API_BASE_URL}/users/${userId}/matches?limit=${limit}`);
    return response.json();
  },

  // Get user's swap requests
  getUserSwaps: async (userId, filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    const response = await authFetch(`${API_BASE_URL}/users/${userId}/swaps?${queryParams}`);
    return response.json();
  },

  // Deactivate account
  deactivateAccount: async (userId) => {
    const response = await authFetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// =============================================================================
// SWAP REQUEST FUNCTIONS
// =============================================================================

export const swapAPI = {
  // Get swap requests
  getSwaps: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    const response = await authFetch(`${API_BASE_URL}/swaps?${queryParams}`);
    return response.json();
  },

  // Create new swap request
  createSwap: async (swapData) => {
    const response = await authFetch(`${API_BASE_URL}/swaps`, {
      method: 'POST',
      body: JSON.stringify(swapData),
    });
    return response.json();
  },

  // Get swap request details
  getSwapDetails: async (swapId) => {
    const response = await authFetch(`${API_BASE_URL}/swaps/${swapId}`);
    return response.json();
  },

  // Update swap request
  updateSwap: async (swapId, updateData) => {
    const response = await authFetch(`${API_BASE_URL}/swaps/${swapId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.json();
  },

  // Accept swap request
  acceptSwap: async (swapId) => {
    const response = await authFetch(`${API_BASE_URL}/swaps/${swapId}/accept`, {
      method: 'POST',
    });
    return response.json();
  },

  // Reject swap request
  rejectSwap: async (swapId, reason = '') => {
    const response = await authFetch(`${API_BASE_URL}/swaps/${swapId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.json();
  },

  // Complete swap request
  completeSwap: async (swapId) => {
    const response = await authFetch(`${API_BASE_URL}/swaps/${swapId}/complete`, {
      method: 'POST',
    });
    return response.json();
  },

  // Cancel swap request
  cancelSwap: async (swapId, reason = '') => {
    const response = await authFetch(`${API_BASE_URL}/swaps/${swapId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.json();
  },
};

// =============================================================================
// EXAMPLE USAGE IN REACT COMPONENTS
// =============================================================================

/*
// Example: Login Form Component
import { authAPI } from './api/skillswap-api';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await authAPI.login(email, password);
      if (result.success) {
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required 
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required 
      />
      <button type="submit">Login</button>
    </form>
  );
};

// Example: User List Component
import { userAPI } from './api/skillswap-api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await userAPI.getUsers({
          page: 1,
          limit: 10,
          sortBy: 'rating',
          sortOrder: 'desc'
        });
        
        if (result.success) {
          setUsers(result.data.users);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <h3>{user.name}</h3>
          <p>Skills: {user.skillsOffered.join(', ')}</p>
          <p>Wants: {user.skillsWanted.join(', ')}</p>
          <p>Rating: {user.rating}/5</p>
        </div>
      ))}
    </div>
  );
};

// Example: Create Swap Request
import { swapAPI } from './api/skillswap-api';

const CreateSwapForm = ({ recipientId }) => {
  const handleCreateSwap = async (formData) => {
    try {
      const swapData = {
        recipient: recipientId,
        skillOffered: formData.skillOffered,
        skillWanted: formData.skillWanted,
        message: formData.message,
        learningMode: formData.learningMode,
        duration: {
          estimatedHours: formData.estimatedHours,
          timeframe: formData.timeframe
        },
        priority: 'medium'
      };

      const result = await swapAPI.createSwap(swapData);
      
      if (result.success) {
        alert('Swap request sent successfully!');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error creating swap:', error);
    }
  };

  // Form implementation here...
};

// Example: Protected Route Component
import { authAPI } from './api/skillswap-api';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (authAPI.isAuthenticated()) {
        try {
          const result = await authAPI.getCurrentUser();
          setIsAuthenticated(result.success);
        } catch (error) {
          setIsAuthenticated(false);
          authAPI.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};
*/

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const utils = {
  // Format date for display
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Get status badge color
  getStatusColor: (status) => {
    const colors = {
      pending: 'orange',
      accepted: 'blue',
      completed: 'green',
      rejected: 'red',
      cancelled: 'gray',
    };
    return colors[status] || 'gray';
  },

  // Format skills list
  formatSkills: (skills) => {
    if (!skills || skills.length === 0) return 'None';
    return skills.slice(0, 3).join(', ') + (skills.length > 3 ? ` +${skills.length - 3} more` : '');
  },

  // Handle API errors
  handleApiError: (error) => {
    if (error.response?.status === 401) {
      authAPI.logout();
      window.location.href = '/login';
    }
    
    return error.response?.data?.message || 'An error occurred';
  },
};

export default {
  authAPI,
  userAPI,
  swapAPI,
  utils,
};