// server/src/models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  profilePic: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    required: true,
    maxlength: 2200
  },
  imageUrl: {
    type: String
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update counts before saving
postSchema.pre('save', function(next) {
  this.likesCount = this.likes.length;
  this.commentsCount = this.comments.length;
  next();
});

export default mongoose.model('Post', postSchema);