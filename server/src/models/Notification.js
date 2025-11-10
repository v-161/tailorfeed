import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['like', 'comment', 'follow', 'ai_suggestion', 'survey_reminder', 'trending']
  },
  message: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  read: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  metadata: {
    postImage: String,
    commentText: String,
    surveyId: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for better performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;