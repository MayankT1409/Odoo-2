# SkillSwap Platform API Documentation

## Overview
This is the backend API for the SkillSwap platform, a skill exchange platform where users can offer and request skills for mutual learning.

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### 1. User Registration
**POST** `/api/auth/signup`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "skillsOffered": ["JavaScript", "React"],
  "skillsWanted": ["Python", "Django"],
  "location": "New York",
  "bio": "Full-stack developer looking to learn backend technologies",
  "availability": "Weekends",
  "preferredLearningMode": "Both",
  "languages": ["English", "Spanish"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully!",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "skillsOffered": ["JavaScript", "React"],
    "skillsWanted": ["Python", "Django"],
    "location": "New York",
    "bio": "Full-stack developer looking to learn backend technologies",
    "availability": "Weekends",
    "preferredLearningMode": "Both",
    "rating": 0,
    "isPublic": true,
    "role": "user"
  }
}
```

#### 2. User Login
**POST** `/api/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "skillsOffered": ["JavaScript", "React"],
    "skillsWanted": ["Python", "Django"]
  }
}
```

#### 3. Get Current User
**GET** `/api/auth/me`

Get current authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "skillsOffered": ["JavaScript", "React"],
    "skillsWanted": ["Python", "Django"],
    "rating": 4.5,
    "reviewsCount": 10
  }
}
```

#### 4. Logout
**POST** `/api/auth/logout`

Logout current user.

**Headers:** `Authorization: Bearer <token>`

#### 5. Refresh Token
**POST** `/api/auth/refresh`

Refresh JWT token.

**Headers:** `Authorization: Bearer <token>`

### User Routes (`/api/users`)

#### 1. Get All Users
**GET** `/api/users`

Get all public users with optional filtering.

**Query Parameters:**
- `search` - Search in name, bio, skills
- `skillsOffered` - Filter by skills offered
- `skillsWanted` - Filter by skills wanted
- `location` - Filter by location
- `availability` - Filter by availability
- `minRating` - Minimum rating filter
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12, max: 50)
- `sortBy` - Sort by (rating, name, createdAt, lastLogin)
- `sortOrder` - Sort order (asc, desc)

**Example:**
```
GET /api/users?search=javascript&skillsOffered=React&page=1&limit=10&sortBy=rating&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "skillsOffered": ["JavaScript", "React"],
        "skillsWanted": ["Python", "Django"],
        "location": "New York",
        "rating": 4.5,
        "avatar": "avatar_url"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 45,
      "limit": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### 2. Get User Profile
**GET** `/api/users/:userId`

Get specific user profile by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "skillsOffered": ["JavaScript", "React"],
      "skillsWanted": ["Python", "Django"],
      "location": "New York",
      "bio": "Full-stack developer",
      "rating": 4.5,
      "reviewsCount": 10,
      "availability": "Weekends"
    },
    "stats": {
      "totalRequests": 15,
      "completedRequests": 10,
      "pendingRequests": 2
    }
  }
}
```

#### 3. Update User Profile
**PUT** `/api/users/:userId`

Update user profile (only own profile).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "bio": "Updated bio",
  "skillsOffered": ["JavaScript", "React", "Node.js"],
  "skillsWanted": ["Python", "Django", "Machine Learning"],
  "location": "San Francisco",
  "availability": "Flexible"
}
```

#### 4. Find Skill Matches
**GET** `/api/users/:userId/matches`

Find users with complementary skills.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` - Number of matches to return (default: 10)

#### 5. Get User's Swap Requests
**GET** `/api/users/:userId/swaps`

Get user's swap requests.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` - Filter by status (pending, accepted, rejected, completed, cancelled)
- `type` - Filter by type (sent, received, all)
- `page` - Page number
- `limit` - Items per page

#### 6. Deactivate Account
**DELETE** `/api/users/:userId`

Deactivate user account (only own account).

**Headers:** `Authorization: Bearer <token>`

### Swap Request Routes (`/api/swaps`)

#### 1. Get Swap Requests
**GET** `/api/swaps`

Get user's swap requests.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` - Filter by status
- `skillOffered` - Filter by skill offered
- `skillWanted` - Filter by skill wanted
- `learningMode` - Filter by learning mode
- `page` - Page number
- `limit` - Items per page
- `sortBy` - Sort by (createdAt, responseBy, priority)
- `sortOrder` - Sort order (asc, desc)

#### 2. Create Swap Request
**POST** `/api/swaps`

Create a new swap request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "recipient": "recipient_user_id",
  "skillOffered": "JavaScript",
  "skillWanted": "Python",
  "message": "Hi! I'd love to teach you JavaScript in exchange for Python lessons.",
  "learningMode": "Online",
  "duration": {
    "estimatedHours": 10,
    "timeframe": "1 month"
  },
  "schedule": {
    "proposedStartDate": "2024-01-15",
    "preferredDays": ["Saturday", "Sunday"],
    "preferredTime": "Evening"
  },
  "priority": "medium"
}
```

#### 3. Get Swap Request Details
**GET** `/api/swaps/:swapId`

Get specific swap request details.

**Headers:** `Authorization: Bearer <token>`

#### 4. Update Swap Request
**PUT** `/api/swaps/:swapId`

Update swap request (by requester or recipient).

**Headers:** `Authorization: Bearer <token>`

#### 5. Accept Swap Request
**POST** `/api/swaps/:swapId/accept`

Accept a swap request.

**Headers:** `Authorization: Bearer <token>`

#### 6. Reject Swap Request
**POST** `/api/swaps/:swapId/reject`

Reject a swap request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "Schedule conflict"
}
```

#### 7. Complete Swap Request
**POST** `/api/swaps/:swapId/complete`

Mark swap request as completed.

**Headers:** `Authorization: Bearer <token>`

#### 8. Cancel Swap Request
**POST** `/api/swaps/:swapId/cancel`

Cancel swap request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

## Data Models

### User Model
```javascript
{
  id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  avatar: String (URL),
  bio: String,
  location: String,
  skillsOffered: [String],
  skillsWanted: [String],
  availability: String, // "Weekdays", "Evenings", "Weekends", "Flexible"
  experience: String, // "Beginner", "Intermediate", "Advanced", "Expert"
  preferredLearningMode: String, // "Online", "In-Person", "Both"
  languages: [String],
  rating: Number,
  reviewsCount: Number,
  isPublic: Boolean,
  isActive: Boolean,
  isEmailVerified: Boolean,
  role: String, // "user", "admin"
  socialLinks: {
    linkedin: String,
    github: String,
    portfolio: String
  },
  stats: {
    totalSwaps: Number,
    successfulSwaps: Number,
    totalTeachingHours: Number,
    totalLearningHours: Number
  },
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

### SwapRequest Model
```javascript
{
  id: ObjectId,
  requester: ObjectId (ref: User),
  recipient: ObjectId (ref: User),
  skillOffered: String,
  skillWanted: String,
  message: String,
  status: String, // "pending", "accepted", "rejected", "completed", "cancelled"
  learningMode: String, // "Online", "In-Person", "Both"
  duration: {
    estimatedHours: Number,
    timeframe: String
  },
  schedule: {
    proposedStartDate: Date,
    preferredDays: [String],
    preferredTime: String
  },
  meetingDetails: {
    location: String,
    meetingLink: String,
    additionalNotes: String
  },
  priority: String, // "low", "medium", "high", "urgent"
  responseBy: Date,
  acceptedAt: Date,
  rejectedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  feedback: {
    requesterFeedback: {
      rating: Number,
      comment: String,
      submittedAt: Date
    },
    recipientFeedback: {
      rating: Number,
      comment: String,
      submittedAt: Date
    }
  },
  tags: [String],
  isArchived: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error messages array"] // Optional
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Rate Limiting

API requests are rate-limited:
- Window: 15 minutes
- Max requests: 100 per window per IP

## Environment Variables

Required environment variables:
```
MONGODB_URI=mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with required variables

3. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

4. The API will be available at `http://localhost:5000`

## Testing

Test the API endpoints:
```bash
node test-api.js
```

This will run basic tests for authentication and user endpoints.