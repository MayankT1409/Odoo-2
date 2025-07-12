const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
    console.log('🧪 Testing SkillSwap API Endpoints...\n');

    try {
        // Test 1: Health Check
        console.log('1. Testing Health Check...');
        const healthResponse = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Health Check:', healthResponse.data.status);
        console.log('');

        // Test 2: Root Endpoint
        console.log('2. Testing Root Endpoint...');
        const rootResponse = await axios.get(`${BASE_URL}/`);
        console.log('✅ Root Endpoint:', rootResponse.data.message);
        console.log('Available Endpoints:', Object.keys(rootResponse.data.endpoints));
        console.log('');

        // Test 3: Test Registration
        console.log('3. Testing User Registration...');
        const signupData = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'testpassword123',
            skillsOffered: ['JavaScript', 'React'],
            skillsWanted: ['Python', 'Django'],
            location: 'Test City',
            bio: 'Test user for API testing'
        };

        try {
            const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, signupData);
            console.log('✅ Registration successful:', signupResponse.data.message);
            
            // Test 4: Test Login
            console.log('4. Testing User Login...');
            const loginData = {
                email: 'test@example.com',
                password: 'testpassword123'
            };
            
            const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
            console.log('✅ Login successful:', loginResponse.data.message);
            
            const token = loginResponse.data.token;
            const userId = loginResponse.data.user.id;
            
            // Test 5: Test Protected Route
            console.log('5. Testing Protected Route (Get Current User)...');
            const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Current User:', meResponse.data.user.name);
            
            // Test 6: Test Get Users
            console.log('6. Testing Get Users...');
            const usersResponse = await axios.get(`${BASE_URL}/api/users`);
            console.log('✅ Users retrieved:', usersResponse.data.data.users.length, 'users found');
            
            // Test 7: Test User Profile
            console.log('7. Testing User Profile...');
            const profileResponse = await axios.get(`${BASE_URL}/api/users/${userId}`);
            console.log('✅ User Profile:', profileResponse.data.data.user.name);
            
            console.log('\n🎉 All API tests passed successfully!');
            
        } catch (signupError) {
            if (signupError.response?.status === 400 && signupError.response?.data?.message?.includes('already exists')) {
                console.log('ℹ️ User already exists, testing login instead...');
                
                // Test Login with existing user
                const loginData = {
                    email: 'test@example.com',
                    password: 'testpassword123'
                };
                
                const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
                console.log('✅ Login successful:', loginResponse.data.message);
                
                const token = loginResponse.data.token;
                
                // Test Protected Route
                const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ Current User:', meResponse.data.user.name);
                
                console.log('\n🎉 API tests completed successfully!');
            } else {
                throw signupError;
            }
        }

    } catch (error) {
        console.error('❌ API Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('Request Error:', error.message);
            console.error('Make sure the server is running on http://localhost:5000');
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the tests
testAPI();