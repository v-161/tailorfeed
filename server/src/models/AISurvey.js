import mongoose from 'mongoose';

const surveySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  questions: [{
    question: String,
    type: { 
      type: String, 
      enum: ['multiple_choice', 'text', 'rating', 'tag_selection'],
      default: 'text'
    },
    options: [String],
    required: Boolean
  }],
  targetAudience: {
    userTypes: [String],
    interestCategories: [String],
    minInteractions: { type: Number, default: 0 }
  },
  schedule: {
    frequency: { 
      type: String, 
      enum: ['once', 'weekly', 'biweekly', 'monthly'],
      default: 'biweekly'
    },
    nextScheduled: Date,
    lastSent: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  responseCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('AISurvey', surveySchema);