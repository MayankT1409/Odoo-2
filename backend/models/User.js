const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"]
    },
    avatar: {
      type: String,
      default: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: ""
    },
    location: {
      type: String,
      maxlength: [100, "Location cannot exceed 100 characters"],
      default: ""
    },
    skillsOffered: [{
      type: String,
      trim: true,
      maxlength: [50, "Skill name cannot exceed 50 characters"]
    }],
    skillsWanted: [{
      type: String,
      trim: true,
      maxlength: [50, "Skill name cannot exceed 50 characters"]
    }],
    availability: {
      type: String,
      enum: ["Weekdays", "Evenings", "Weekends", "Flexible"],
      default: "Flexible"
    },
    experience: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
      default: "Beginner"
    },
    preferredLearningMode: {
      type: String,
      enum: ["Online", "In-Person", "Both"],
      default: "Both"
    },
    languages: [{
      type: String,
      trim: true
    }],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewsCount: {
      type: Number,
      default: 0
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    socialLinks: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      portfolio: { type: String, default: "" }
    },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      profileVisibility: {
        type: String,
        enum: ["public", "private", "connections"],
        default: "public"
      }
    },
    stats: {
      totalSwaps: { type: Number, default: 0 },
      successfulSwaps: { type: Number, default: 0 },
      totalTeachingHours: { type: Number, default: 0 },
      totalLearningHours: { type: Number, default: 0 }
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    },
    banReason: {
      type: String,
      default: null
    },
    bannedAt: {
      type: Date,
      default: null
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    moderationHistory: [{
      date: { type: Date, default: Date.now },
      moderator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      action: { type: String, enum: ['skills_moderated', 'content_removed', 'warning_issued', 'other'] },
      note: { type: String, maxlength: 500 }
    }],
    notifications: [{
      title: { type: String, required: true },
      message: { type: String, required: true },
      type: { type: String, enum: ['info', 'warning', 'maintenance', 'feature'], default: 'info' },
      priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
      read: { type: Boolean, default: false },
      receivedAt: { type: Date, default: Date.now },
      sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
  },
  { timestamps: true }
);

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ skillsOffered: 1 });
UserSchema.index({ skillsWanted: 1 });
UserSchema.index({ location: 1 });
UserSchema.index({ rating: -1 });
UserSchema.index({ isPublic: 1, isActive: 1 });

// Hash password before saving
UserSchema.pre("save", async function (next) {
  // Only hash the password if it's modified or new
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare entered password with stored hashed password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    return isMatch;
  } catch (err) {
    throw err;
  }
};

// Instance method to calculate success rate
UserSchema.methods.getSuccessRate = function() {
  if (this.stats.totalSwaps === 0) return 0;
  return Math.round((this.stats.successfulSwaps / this.stats.totalSwaps) * 100);
};

// Instance method to get public profile data
UserSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find users with complementary skills
UserSchema.statics.findComplementaryUsers = function(userId, skillsWanted, skillsOffered) {
  return this.find({
    _id: { $ne: userId },
    isPublic: true,
    isActive: true,
    $or: [
      { skillsOffered: { $in: skillsWanted } },
      { skillsWanted: { $in: skillsOffered } }
    ]
  }).select('-password');
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model("User", UserSchema);