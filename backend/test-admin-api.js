const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAdminAPI() {
    try {
        console.log('🧪 Testing Admin API Endpoints...\n');

        // First, login as admin to get token
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@skillswap.com',
            password: 'admin123'
        });

        if (loginResponse.data.success) {
            console.log('✅ Admin login successful');
            const token = loginResponse.data.token;
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Test dashboard endpoint
            console.log('\n2. Testing dashboard endpoint...');
            try {
                const dashboardResponse = await axios.get(`${BASE_URL}/api/admin/dashboard`, { headers });
                if (dashboardResponse.data.success) {
                    console.log('✅ Dashboard endpoint working');
                    console.log('📊 Dashboard data:', JSON.stringify(dashboardResponse.data.data.overview, null, 2));
                } else {
                    console.log('❌ Dashboard endpoint failed:', dashboardResponse.data.message);
                }
            } catch (err) {
                console.log('❌ Dashboard endpoint error:', err.response?.data?.message || err.message);
            }

            // Test users endpoint
            console.log('\n3. Testing users endpoint...');
            try {
                const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, { headers });
                if (usersResponse.data.success) {
                    console.log('✅ Users endpoint working');
                    console.log(`👥 Found ${usersResponse.data.data.users.length} users`);
                    console.log('📄 Pagination:', usersResponse.data.data.pagination);
                } else {
                    console.log('❌ Users endpoint failed:', usersResponse.data.message);
                }
            } catch (err) {
                console.log('❌ Users endpoint error:', err.response?.data?.message || err.message);
            }

        } else {
            console.log('❌ Admin login failed:', loginResponse.data.message);
        }

    } catch (err) {
        console.log('❌ Login error:', err.response?.data?.message || err.message);
    }
}

// Test without admin token
async function testWithoutAuth() {
    console.log('\n4. Testing endpoints without authentication...');
    
    try {
        await axios.get(`${BASE_URL}/api/admin/dashboard`);
        console.log('❌ Dashboard should require authentication');
    } catch (err) {
        if (err.response?.status === 401) {
            console.log('✅ Dashboard properly requires authentication');
        } else {
            console.log('❌ Unexpected error:', err.response?.data?.message || err.message);
        }
    }

    try {
        await axios.get(`${BASE_URL}/api/admin/users`);
        console.log('❌ Users should require authentication');
    } catch (err) {
        if (err.response?.status === 401) {
            console.log('✅ Users endpoint properly requires authentication');
        } else {
            console.log('❌ Unexpected error:', err.response?.data?.message || err.message);
        }
    }
}

// Run tests
testAdminAPI().then(() => {
    testWithoutAuth().then(() => {
        console.log('\n🏁 Test completed!');
        process.exit(0);
    });
});