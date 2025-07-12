# Admin Features Setup Guide

This guide explains the new admin functionality added to the Skill Swap Platform.

## Features Added

### 1. Role-Based Signup/Login
- Users can now select their role during signup (User or Admin)
- Role selection is prominently displayed with visual indicators
- Admin accounts get special privileges and access

### 2. Admin Dashboard
- Comprehensive overview of platform statistics
- Quick access to all admin functions
- Real-time data on users, swaps, and reviews

### 3. User Management
- View all users with advanced filtering
- Ban/unban users with reason tracking
- Change user roles (promote to admin or demote)
- Search users by name, email, or location

### 4. Content Moderation
- Review and moderate user skill descriptions
- Detect inappropriate content automatically
- Edit or remove inappropriate skills
- Track moderation history

### 5. Swap Monitoring
- Monitor all swap requests in real-time
- Filter by status, priority, and flags
- Identify overdue swaps
- Admin override for swap status

### 6. Platform-Wide Messaging
- Send broadcast messages to all users
- Multiple message types (info, warning, maintenance, feature)
- Priority levels for urgent communications
- Message preview before sending

### 7. Reports & Analytics
- Download detailed reports in JSON or CSV format
- User activity reports
- Feedback and review logs
- Swap statistics and success rates
- Moderation activity logs

## Setup Instructions

### 1. Backend Setup
The backend already includes all necessary routes and models. No additional setup required.

### 2. Create Demo Accounts
Run the seed script to create demo accounts:

```bash
cd backend
npm run seed
```

This creates:
- **Admin Account**: admin@skillswap.com / admin123
- **Demo User**: demo@skillswap.com / demo123
- Additional test users for testing

### 3. Frontend Access
Admin features are accessible through:
- `/admin` - Main admin dashboard
- `/admin/users` - User management
- `/admin/moderation` - Content moderation
- `/admin/swaps` - Swap monitoring
- `/admin/messages` - Broadcast messages
- `/admin/reports` - Download reports

### 4. Admin Navigation
- Admin users see an "Admin" link in the navigation bar
- All admin pages are protected by role-based authentication
- Non-admin users get an access denied message

## API Endpoints Added

### User Management
- `PUT /api/admin/users/:userId/ban` - Ban/unban users
- `PUT /api/admin/users/:userId/skills/moderate` - Moderate skills

### Messaging
- `POST /api/admin/messages/broadcast` - Send platform-wide messages

### Monitoring
- `GET /api/admin/swaps/monitor` - Enhanced swap monitoring

### Reports
- `GET /api/admin/reports/:reportType` - Generate and download reports

## Database Changes

### User Model Updates
- Added `banReason`, `bannedAt`, `bannedBy` fields
- Added `moderationHistory` array for tracking admin actions
- Added `notifications` array for broadcast messages

### SwapRequest Model Updates
- Added `isFlagged`, `flagReason`, `flaggedBy`, `flaggedAt` fields
- Added `adminNotes` field for admin comments

## Testing the Features

### 1. Test Role Selection
1. Go to signup page
2. Select "Administrator" role
3. Complete signup
4. Verify admin navigation appears

### 2. Test User Management
1. Login as admin
2. Go to `/admin/users`
3. Try banning a user
4. Test role changes

### 3. Test Content Moderation
1. Go to `/admin/moderation`
2. Review user skills
3. Edit inappropriate content
4. Save moderation notes

### 4. Test Broadcast Messages
1. Go to `/admin/messages`
2. Create a test message
3. Select message type and priority
4. Send to all users

### 5. Test Reports
1. Go to `/admin/reports`
2. Select report type
3. Choose date range and format
4. Download report

## Security Features

- All admin routes protected by authentication middleware
- Role-based access control
- Input validation on all admin endpoints
- Audit trail for admin actions
- Rate limiting on sensitive operations

## Customization

### Adding New Report Types
1. Add new case in `/api/admin/reports/:reportType` endpoint
2. Update frontend report selection in `ReportsDownload.jsx`

### Adding New Message Types
1. Update message types in backend validation
2. Add new type to frontend `BroadcastMessages.jsx`

### Extending User Moderation
1. Add new fields to User model
2. Update moderation interface in `ContentModeration.jsx`

## Troubleshooting

### Admin Access Issues
- Verify user role is set to 'admin' in database
- Check JWT token includes role information
- Ensure admin routes are properly protected

### Report Download Issues
- Check file permissions
- Verify date range parameters
- Test with smaller datasets first

### Broadcast Message Issues
- Verify all users have notifications array
- Check message validation rules
- Test with single user first

## Production Considerations

1. **Security**: Implement additional security measures for admin accounts
2. **Monitoring**: Set up logging for all admin actions
3. **Backup**: Regular backups before bulk operations
4. **Performance**: Monitor performance with large datasets
5. **Compliance**: Ensure data handling complies with privacy regulations

## Support

For issues or questions about admin features:
1. Check the console for error messages
2. Verify database connections
3. Test with demo accounts first
4. Review API response codes and messages