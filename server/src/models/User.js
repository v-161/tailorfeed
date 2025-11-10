// server/src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePic: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  website: {
    type: String,
    default: ''
  },
  
  // FOLLOW SYSTEM - ADD THESE FIELDS
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // AI Preferences for Mr. Tailor
  aiPreferences: {
    interests: [{ type: String }],
    surveyHistory: [{
      date: { type: Date, default: Date.now },
      responses: [{
        question: String,
        answer: String
      }]
    }],
    contentPreferences: [{ type: String }],
    engagementScore: { type: Number, default: 0 },
    lastSurveyDate: { type: Date },
    personalizedFeed: { type: Boolean, default: true },
    aiSuggestions: { type: Boolean, default: true }
  },
  
  // User Stats
  stats: {
    totalPosts: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 }
  },
  
  // Settings
  settings: {
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: false },
    profilePublic: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update stats when followers/following change
userSchema.methods.updateStats = function() {
  this.stats.followers = this.followers.length;
  this.stats.following = this.following.length;
};

// Update stats before saving
userSchema.pre('save', function(next) {
  this.updateStats();
  next();
});

export default mongoose.model('User', userSchema);