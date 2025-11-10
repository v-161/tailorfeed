import mongoose from 'mongoose';

const aiPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  tagAffinity: {
    type: Map,
    of: {
      score: { type: Number, default: 0 },
      interactionCount: { type: Number, default: 0 },
      lastInteracted: { type: Date, default: Date.now },
      category: String
    },
    default: {}
  },
  behaviorPatterns: {
    activeHours: [Number],
    preferredContentTypes: [String],
    averageEngagementTime: Number,
    lastActive: Date
  },
  surveyResponses: [{
    surveyId: String,
    questions: [{
      question: String,
      answer: String,
      timestamp: { type: Date, default: Date.now }
    }],
    completedAt: Date
  }],
  recommendationHistory: [{
    postId: mongoose.Schema.Types.ObjectId,
    shownAt: Date,
    interacted: Boolean,
    interactionType: String
  }],
  aiSettings: {
    diversityFactor: { type: Number, default: 0.3, min: 0, max: 1 },
    discoveryBoost: { type: Number, default: 0.5, min: 0, max: 1 },
    preferredCategories: [String]
  }
}, {
  timestamps: true
});

aiPreferenceSchema.index({ userId: 1 });
aiPreferenceSchema.index({ 'tagAffinity.score': -1 });

export default mongoose.model('AIPreference', aiPreferenceSchema);