import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import User from '../models/User.js';
import Post from '../models/Post.js';
import AIPreference from '../models/AIPreference.js';

console.log('🚀 Starting seed script...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ Missing');

const sampleUsers = [
  {
    username: 'art_lover',
    email: 'art@example.com',
    password: 'password123',
    fullName: 'Emma Thompson',
    bio: 'Digital artist and traditional painter 🎨',
    profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop',
    followers: [],
    following: [],
    posts: []
  },
  {
    username: 'tech_guru', 
    email: 'tech@example.com',
    password: 'password123',
    fullName: 'Alex Chen',
    bio: 'Software Developer | AI Enthusiast',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    followers: [],
    following: [],
    posts: []
  },
  {
    username: 'travel_diaries',
    email: 'travel@example.com', 
    password: 'password123',
    fullName: 'Sarah Johnson',
    bio: 'Wanderlust soul ✈️',
    profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    followers: [],
    following: [],
    posts: []
  }
];

const samplePosts = [
  {
    imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=600&fit=crop',
    caption: 'Digital painting! 🎨 #art #digitalart',
    tags: ['art', 'digitalart', 'painting'],
    likes: [],
    comments: []
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=600&fit=crop',
    caption: 'Coding session 💻 #tech #coding',
    tags: ['tech', 'coding', 'programming'],
    likes: [],
    comments: []
  },
  {
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop',
    caption: 'Mountain views 🏔️ #travel #nature',
    tags: ['travel', 'mountains', 'nature'],
    likes: [],
    comments: []
  }
];

const seedSampleData = async () => {
  try {
    console.log('🌱 Starting to seed sample data...');

    // Connect to database directly
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({}); 
    await AIPreference.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = new User({
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`✅ Created user: ${savedUser.username}`);
    }

    console.log(`✅ Created ${createdUsers.length} users`);

    // Create posts - FIXED: Include username and profilePic
    const createdPosts = [];
    for (let i = 0; i < samplePosts.length; i++) {
      const user = createdUsers[i % createdUsers.length]; // Assign posts round-robin
      const postData = samplePosts[i];
      
      const post = new Post({
        ...postData,
        userId: user._id,
        username: user.username, // ADD THIS - required by Post model
        profilePic: user.profilePicture, // ADD THIS - required by Post model
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedPost = await post.save();
      createdPosts.push(savedPost);

      // Add post to user's posts array
      user.posts.push(savedPost._id);
      await user.save();
      
      console.log(`✅ Created post for ${user.username}`);
    }

    console.log(`✅ Created ${createdPosts.length} posts`);

    // Create simple follow relationships
    if (createdUsers.length >= 2) {
      // user0 follows user1
      createdUsers[0].following.push(createdUsers[1]._id);
      createdUsers[1].followers.push(createdUsers[0]._id);
      
      // user1 follows user2  
      createdUsers[1].following.push(createdUsers[2]._id);
      createdUsers[2].followers.push(createdUsers[1]._id);

      await Promise.all(createdUsers.map(user => user.save()));
      console.log('✅ Created follow relationships');
    }

    // Create AI preferences
    for (const user of createdUsers) {
      const userPosts = createdPosts.filter(post => post.userId.toString() === user._id.toString());
      const userTags = [...new Set(userPosts.flatMap(post => post.tags))];
      
      const aiPreference = new AIPreference({
        userId: user._id,
        interests: userTags,
        preferredPostingTimes: ['18:00', '20:00'],
        engagementPatterns: {
          likesGiven: 15,
          commentsGiven: 5,
          avgTimeSpent: 20
        },
        lastSurveyDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await aiPreference.save();
      console.log(`✅ Created AI preferences for ${user.username}: ${userTags.join(', ')}`);
    }

    console.log('🎉 Sample data seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   📝 Posts: ${createdPosts.length}`);
    
    console.log('\n🔑 Login credentials:');
    createdUsers.forEach(user => {
      console.log(`   👉 Username: ${user.username} | Password: password123`);
    });

  } catch (error) {
    console.error('❌ Error seeding sample data:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    // Close connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('📡 Database connection closed');
    }
    process.exit(0);
  }
};

seedSampleData();