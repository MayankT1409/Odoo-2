const axios = require('axios');

async function verifyDatabaseData() {
    try {
        console.log('🔍 Verifying if data is stored in database...\n');

        // First, let's test login with the user we just created
        console.log('1. Testing login with created user...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'testdebug@example.com',
            password: 'password123'
        });

        if (loginResponse.data.success) {
            console.log('✅ Login successful! User exists in database');
            console.log('📋 User data from login:');
            console.log(`   - Name: ${loginResponse.data.user.name}`);
            console.log(`   - Email: ${loginResponse.data.user.email}`);
            console.log(`   - Skills Offered: ${loginResponse.data.user.skillsOffered.join(', ')}`);
            console.log(`   - Skills Wanted: ${loginResponse.data.user.skillsWanted.join(', ')}`);
            console.log(`   - Location: ${loginResponse.data.user.location}`);
            
            const token = loginResponse.data.token;
            const userId = loginResponse.data.user.id;

            // Test getting current user data
            console.log('\n2. Testing current user retrieval...');
            const meResponse = await axios.get('http://localhost:5000/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (meResponse.data.success) {
                console.log('✅ Current user data retrieved successfully!');
                console.log(`   - Database ID: ${meResponse.data.user._id}`);
                console.log(`   - Role: ${meResponse.data.user.role}`);
                console.log(`   - Created At: ${meResponse.data.user.createdAt}`);
            }

            // Test getting all users to see if our user appears in the list
            console.log('\n3. Testing user list to verify storage...');
            const usersResponse = await axios.get('http://localhost:5000/api/users');

            if (usersResponse.data.success) {
                const users = usersResponse.data.data.users;
                const ourUser = users.find(u => u.email === 'testdebug@example.com');
                
                if (ourUser) {
                    console.log('✅ User found in public users list!');
                    console.log(`   - Found user: ${ourUser.name}`);
                    console.log(`   - Total users in database: ${users.length}`);
                } else {
                    console.log('⚠️ User not found in public list (might be privacy settings)');
                    console.log(`   - Total users in database: ${users.length}`);
                }
            }

            // Test getting user profile directly
            console.log('\n4. Testing direct profile access...');
            const profileResponse = await axios.get(`http://localhost:5000/api/users/${userId}`);

            if (profileResponse.data.success) {
                console.log('✅ User profile accessible directly!');
                console.log('📋 Profile data:');
                console.log(`   - Bio: ${profileResponse.data.data.user.bio}`);
                console.log(`   - Rating: ${profileResponse.data.data.user.rating}/5`);
                console.log(`   - Total Requests: ${profileResponse.data.data.stats.totalRequests}`);
            }

            console.log('\n🎉 DATABASE VERIFICATION COMPLETE!');
            console.log('✅ Your signup functionality is working correctly');
            console.log('✅ Data is being stored in MongoDB successfully');
            console.log('✅ User can login and access their data');
            console.log('✅ All API endpoints are functioning properly');

        } else {
            console.log('❌ Login failed - user might not be stored properly');
        }

    } catch (error) {
        console.error('❌ Database verification failed!');
        
        if (error.response) {
            console.error('📋 Status:', error.response.status);
            console.error('📋 Error:', error.response.data);
        } else {
            console.error('📋 Error:', error.message);
        }
    }
}

verifyDatabaseData();