import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables FIRST
config();

const seedAIData = async () => {
  try {
    console.log('🌱 Starting AI data seeding...');

    // Use your existing MongoDB Atlas connection from .env
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔄 Connecting to MongoDB Atlas...');
    console.log('📡 Using URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Hide password
    
    // Connect with better options for Atlas
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout for Atlas
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    });
    
    console.log('✅ MongoDB Atlas connected successfully!');

    // Import models after successful connection
    const { default: AIPreference } = await import('../models/AIPreference.js');
    const { default: AISurvey } = await import('../models/AISurvey.js');
    const { default: User } = await import('../models/User.js');
    const { default: Post } = await import('../models/Post.js');

    console.log('🗑️ Clearing existing AI data...');
    await AIPreference.deleteMany({});
    await AISurvey.deleteMany({});
    console.log('✅ Cleared existing AI data');

    // Get users and posts with limits
    const users = await User.find().limit(3);
    const posts = await Post.find().limit(5);

    console.log(`👤 Found ${users.length} users`);
    console.log(`📝 Found ${posts.length} posts`);

    // Create AI preferences for each user
    for (const user of users) {
      console.log(`🤖 Creating AI preferences for: ${user.username}`);
      
      const aiPreference = new AIPreference({
        userId: user._id,
        tagAffinity: new Map([
          ['travel', { score: 8, interactionCount: 4, lastInteracted: new Date(), category: 'travel' }],
          ['food', { score: 6, interactionCount: 3, lastInteracted: new Date(), category: 'food' }],
          ['tech', { score: 4, interactionCount: 2, lastInteracted: new Date(), category: 'tech' }]
        ]),
        recommendationHistory: posts.slice(0, 2).map(post => ({
          postId: post._id,
          shownAt: new Date(),
          interacted: Math.random() > 0.5,
          interactionType: 'view'
        })),
        aiSettings: {
          diversityFactor: 0.3,
          discoveryBoost: 0.5,
          preferredCategories: ['travel', 'food', 'tech']
        }
      });

      await aiPreference.save();
      console.log(`✅ AI preferences created for ${user.username}`);
    }

    // Create sample survey
    console.log('📊 Creating AI survey...');
    const survey = new AISurvey({
      title: 'Mr. Tailor AI Survey',
      description: 'Help me understand your preferences better',
      questions: [
        {
          question: 'What type of content do you enjoy most?',
          type: 'multiple_choice',
          options: ['Travel', 'Food', 'Technology', 'Fitness', 'Art'],
          required: true
        }
      ],
      targetAudience: {
        userTypes: ['all'],
        minInteractions: 0
      },
      schedule: {
        frequency: 'biweekly',
        nextScheduled: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      isActive: true
    });

    await survey.save();
    console.log('✅ AI survey created');

    console.log('🎉 AI data seeding completed successfully!');
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ AI data seeding failed:', error.message);
    process.exit(1);
  }
};

seedAIData();