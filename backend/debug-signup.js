const axios = require('axios');

async function testSignup() {
    try {
        console.log('🧪 Testing Signup Functionality...\n');

        const testUser = {
            name: "Test User Debug",
            email: "testdebug@example.com",
            password: "password123",
            skillsOffered: ["JavaScript", "React"],
            skillsWanted: ["Python", "Django"],
            location: "Test City",
            bio: "Test user for debugging signup issue"
        };

        console.log('📤 Sending signup request with data:');
        console.log(JSON.stringify(testUser, null, 2));
        console.log('');

        const response = await axios.post('http://localhost:5000/api/auth/signup', testUser, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('✅ Signup successful!');
        console.log('📋 Response status:', response.status);
        console.log('📋 Response data:');
        console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('❌ Signup failed!');
        
        if (error.response) {
            console.error('📋 Status:', error.response.status);
            console.error('📋 Status Text:', error.response.statusText);
            console.error('📋 Response data:');
            console.error(JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('📋 Request Error:', error.message);
            console.error('📋 No response received. Server might be down.');
        } else {
            console.error('📋 Error:', error.message);
        }
        
        console.error('\n🔍 Full error object:');
        console.error(error);
    }
}

// Test MongoDB connection separately
async function testMongoConnection() {
    try {
        console.log('\n🔍 Testing MongoDB connection...');
        const response = await axios.get('http://localhost:5000/api/health');
        console.log('✅ Health check response:', response.data);
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
}

async function runTests() {
    await testMongoConnection();
    await testSignup();
}

runTests();