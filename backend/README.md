# SkillSwap Platform Backend

A Node.js/Express backend API for the SkillSwap platform - a skill exchange platform where users can offer and request skills for mutual learning.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone and navigate to backend directory:**
```bash
cd "Odoo-2/backend"
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment Setup:**
The `.env` file is already configured with:
```env
# Database Configuration
MONGODB_URI=mongodb+srv://manthanbhadaliya:manthan%40007007@skillswapplatform.mak9qwb.mongodb.net/?retryWrites=true&w=majority&appName=SkillSwapPlatform

# JWT Configuration
JWT_SECRET=f09d4152baca4a15e1b8ed082e36d0d96f1e3b9a645bfe75631c3156f504a68c65f05d206e149e727f2ff51d831376d6d8f82b66c2ed78979c003b6111d38295
JWT_EXPIRE=30d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

4. **Start the server:**
```bash
# Development mode (with auto-restart)
npm run dev

# OR Production mode
npm start
```

5. **Verify installation:**
- Server should start on `http://localhost:5000`
- MongoDB should connect successfully
- You should see: ✅ MongoDB Connected to SkillSwap Database

## 📊 API Endpoints

### Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh token

### Users
- `GET /users` - Get all users (with filtering)
- `GET /users/:id` - Get user profile
- `PUT /users/:id` - Update user profile
- `GET /users/:id/matches` - Find skill matches
- `GET /users/:id/swaps` - Get user's swaps
- `DELETE /users/:id` - Deactivate account

### Swap Requests
- `GET /swaps` - Get swap requests
- `POST /swaps` - Create swap request
- `GET /swaps/:id` - Get swap details
- `PUT /swaps/:id` - Update swap request
- `POST /swaps/:id/accept` - Accept swap
- `POST /swaps/:id/reject` - Reject swap
- `POST /swaps/:id/complete` - Complete swap
- `POST /swaps/:id/cancel` - Cancel swap

## 🧪 Testing

Test the API endpoints:
```bash
node test-api.js
```

## 📁 Project Structure

```
backend/
├── models/           # MongoDB schemas
│   ├── User.js      # User model with skills
│   ├── SwapRequest.js # Skill swap requests
│   └── Review.js    # User reviews
├── routes/          # API route handlers
│   ├── authRoutes.js # Authentication routes
│   ├── userRoutes.js # User management routes
│   └── swapRoutes.js # Swap request routes
├── middleware/      # Express middleware
│   └── auth.js      # JWT authentication
├── uploads/         # File upload directory
├── server.js        # Main server file
├── package.json     # Dependencies
├── .env            # Environment variables
└── README.md       # This file
```

## 🔧 Key Features

### User Management
- ✅ User registration with skills
- ✅ JWT authentication
- ✅ Profile management
- ✅ Skill-based user matching
- ✅ Public/private profiles
- ✅ User ratings and reviews

### Skill Swapping
- ✅ Create swap requests
- ✅ Accept/reject requests
- ✅ Track swap status
- ✅ Schedule management
- ✅ Feedback system
- ✅ Priority levels

### Advanced Features
- ✅ Search and filtering
- ✅ Pagination
- ✅ Input validation
- ✅ Error handling
- ✅ CORS configuration
- ✅ Rate limiting ready

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS protection
- Rate limiting capability
- Environment-based configuration

## 🌐 Frontend Integration

This backend is designed to work with React/Vite frontend on `http://localhost:5173`.

**For your frontend, use these API calls:**

### Example Registration:
```javascript
const response = await fetch('http://localhost:5000/api/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    skillsOffered: ['JavaScript', 'React'],
    skillsWanted: ['Python', 'Django'],
    location: 'New York'
  })
});
```

### Example Login:
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});

const { token, user } = await response.json();
localStorage.setItem('token', token);
```

### Example Protected Request:
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5000/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🚨 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error:**
   - Check your internet connection
   - Verify MongoDB URI in .env file
   - Ensure MongoDB Atlas cluster is running

2. **Port Already in Use:**
   - Change PORT in .env file
   - Kill existing processes on port 5000

3. **CORS Errors:**
   - Ensure frontend is running on http://localhost:5173
   - Update FRONTEND_URL in .env if different

4. **Authentication Issues:**
   - Check JWT_SECRET in .env
   - Verify token format in requests
   - Ensure token hasn't expired

## 📚 Documentation

- **Full API Documentation:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Postman Collection:** Import endpoints for testing

## 🤝 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure MongoDB connection is working
4. Check API documentation for correct request format

## 📝 Next Steps

Your backend is now ready! You can:
1. Start your frontend development
2. Integrate authentication flows
3. Implement user profiles
4. Add swap request functionality
5. Build the skill matching system

The backend provides all necessary endpoints for a complete SkillSwap platform. Happy coding! 🎉