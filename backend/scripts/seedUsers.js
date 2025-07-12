const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap');
    console.log('Connected to MongoDB');

    // Clear existing users (optional - remove this in production)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Create demo admin user
    const adminExists = await User.findOne({ email: 'admin@skillswap.com' });
    if (!adminExists) {
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@skillswap.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        skillsOffered: ['Platform Management', 'User Support'],
        skillsWanted: ['Community Building'],
        location: 'Platform HQ',
        availability: 'Flexible',
        bio: 'Platform administrator with full access to all features.'
      });
      await adminUser.save();
      console.log('Created admin user: admin@skillswap.com / admin123');
    } else {
      console.log('Admin user already exists');
    }

    // Create demo regular user
    const userExists = await User.findOne({ email: 'demo@skillswap.com' });
    if (!userExists) {
      const demoUser = new User({
        name: 'Demo User',
        email: 'demo@skillswap.com',
        password: 'demo123',
        role: 'user',
        isActive: true,
        isEmailVerified: true,
        skillsOffered: ['JavaScript', 'React', 'Node.js'],
        skillsWanted: ['Python', 'Machine Learning', 'Data Science'],
        location: 'New York, NY',
        availability: 'Weekends',
        bio: 'Full-stack developer looking to expand into data science.'
      });
      await demoUser.save();
      console.log('Created demo user: demo@skillswap.com / demo123');
    } else {
      console.log('Demo user already exists');
    }

    // Create additional test users
    const testUsers = [
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'password123',
        role: 'user',
        skillsOffered: ['Python', 'Data Analysis', 'SQL'],
        skillsWanted: ['React', 'Frontend Development'],
        location: 'San Francisco, CA',
        availability: 'Evenings'
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123',
        role: 'user',
        skillsOffered: ['Graphic Design', 'Photoshop', 'Illustrator'],
        skillsWanted: ['Web Design', 'UX/UI'],
        location: 'Los Angeles, CA',
        availability: 'Weekends'
      },
      {
        name: 'Carol Davis',
        email: 'carol@example.com',
        password: 'password123',
        role: 'user',
        skillsOffered: ['Marketing', 'Content Writing', 'SEO'],
        skillsWanted: ['Social Media Management', 'Analytics'],
        location: 'Chicago, IL',
        availability: 'Flexible'
      }
    ];

    for (const userData of testUsers) {
      const userExists = await User.findOne({ email: userData.email });
      if (!userExists) {
        const user = new User({
          ...userData,
          isActive: true,
          isEmailVerified: true,
          bio: `I'm ${userData.name} and I love learning new skills!`
        });
        await user.save();
        console.log(`Created user: ${userData.email}`);
      } else {
        console.log(`User ${userData.email} already exists`);
      }
    }

    console.log('\n=== Demo Accounts Created ===');
    console.log('Admin Account:');
    console.log('  Email: admin@skillswap.com');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    console.log('\nDemo User Account:');
    console.log('  Email: demo@skillswap.com');
    console.log('  Password: demo123');
    console.log('  Role: user');
    console.log('\nAdditional Test Users:');
    console.log('  alice@example.com / password123');
    console.log('  bob@example.com / password123');
    console.log('  carol@example.com / password123');
    console.log('\nAll accounts are active and email verified.');

  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the seed function
seedUsers();