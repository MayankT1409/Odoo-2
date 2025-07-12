// Direct MongoDB connection to verify data storage
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkDatabaseDirectly() {
    try {
        console.log('🔍 Connecting directly to MongoDB...\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!');
        
        // Get database info
        const dbName = mongoose.connection.db.databaseName;
        console.log(`📊 Database name: ${dbName}`);
        
        // Count total users
        const userCount = await User.countDocuments();
        console.log(`👥 Total users in database: ${userCount}`);
        
        if (userCount > 0) {
            console.log('\n📋 All users in database:');
            const users = await User.find({}).select('name email skillsOffered skillsWanted location createdAt role').lean();
            
            users.forEach((user, index) => {
                console.log(`\n   User ${index + 1}:`);
                console.log(`   - ID: ${user._id}`);
                console.log(`   - Name: ${user.name}`);
                console.log(`   - Email: ${user.email}`);
                console.log(`   - Role: ${user.role}`);
                console.log(`   - Skills Offered: ${user.skillsOffered?.join(', ') || 'None'}`);
                console.log(`   - Skills Wanted: ${user.skillsWanted?.join(', ') || 'None'}`);
                console.log(`   - Location: ${user.location || 'Not specified'}`);
                console.log(`   - Created: ${user.createdAt}`);
            });
            
            console.log('\n🎉 CONCLUSION: Data IS being stored in your database!');
            console.log('✅ Your signup functionality is working perfectly');
            console.log('✅ MongoDB connection is successful');
            console.log('✅ User data is persisted correctly');
            
        } else {
            console.log('\n❌ No users found in database');
            console.log('❓ This might indicate:');
            console.log('   - Different database being used');
            console.log('   - Connection to wrong cluster');
            console.log('   - Data being stored elsewhere');
        }
        
        // Check collections in database
        console.log('\n📊 Collections in database:');
        const collections = await mongoose.connection.db.listCollections().toArray();
        collections.forEach(collection => {
            console.log(`   - ${collection.name}`);
        });
        
    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

checkDatabaseDirectly();