// Test API connectivity from frontend
export const testAPI = async () => {
  try {
    console.log('🧪 Testing API connectivity...');
    
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5000/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test login
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@skillswap.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('✅ Login test:', loginData.success ? 'SUCCESS' : 'FAILED');
    
    if (loginData.success) {
      const token = loginData.token;
      
      // Test admin dashboard
      const dashboardResponse = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard test:', dashboardData.success ? 'SUCCESS' : 'FAILED');
      console.log('📊 Dashboard data:', dashboardData.data?.overview);
      
      // Test users endpoint
      const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const usersData = await usersResponse.json();
      console.log('✅ Users test:', usersData.success ? 'SUCCESS' : 'FAILED');
      console.log('👥 Users count:', usersData.data?.users?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ API test error:', error);
  }
};

// Call this function from browser console: testAPI()
window.testAPI = testAPI;