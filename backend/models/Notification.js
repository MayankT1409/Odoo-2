const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        trim: true,
        maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'maintenance', 'feature', 'system'],
        default: 'info'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // null means broadcast to all users
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender is required']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date
    },
    metadata: {
        actionUrl: String,
        actionText: String,
        category: String,
        tags: [String]
    }
}, {
    timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ isActive: 1, expiresAt: 1 });
notificationSchema.index({ sentBy: 1 });

// Virtual to check if notification is expired
notificationSchema.virtual('isExpired').get(function() {
    return this.expiresAt && this.expiresAt < new Date();
});

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

// Static method to create broadcast notification
notificationSchema.statics.createBroadcast = async function(notificationData) {
    const notification = new this({
        ...notificationData,
        recipient: null // Broadcast to all
    });
    return notification.save();
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
    const {
        limit = 20,
        skip = 0,
        unreadOnly = false,
        type = null
    } = options;

    let query = {
        $or: [
            { recipient: userId },
            { recipient: null, isActive: true } // Broadcast messages
        ]
    };

    if (unreadOnly) {
        query.isRead = false;
    }

    if (type) {
        query.type = type;
    }

    return this.find(query)
        .populate('sentBy', 'name avatar role')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
};

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);