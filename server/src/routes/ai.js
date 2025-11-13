import express from 'express';
import mongoose from 'mongoose';
import AIPreference from '../models/AIPreference.js';
import AISurvey from '../models/AISurvey.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/ai/interaction
router.post('/interaction', auth, async (req, res) => {
  try {
    const { postId, interactionType, postTags } = req.body;
    const userId = req.user._id;

    let aiPreference = await AIPreference.findOne({ userId });
    if (!aiPreference) {
      aiPreference = new AIPreference({ userId });
    }

    // ALSO UPDATE USER'S MAIN PREFERENCES WHEN INTERACTING
    if (postTags && Array.isArray(postTags)) {
      const weightMap = {
        'like': 2,
        'unlike': -2,
        'comment': 3,
        'share': 4,
        'view': 0.5
      };

      const weight = weightMap[interactionType] || 1;

      postTags.forEach(tag => {
        const currentAffinity = aiPreference.tagAffinity.get(tag) || {
          score: 0,
          interactionCount: 0,
          lastInteracted: new Date(),
          category: categorizeTag(tag)
        };

        currentAffinity.score += weight;
        currentAffinity.interactionCount += Math.abs(weight);
        currentAffinity.lastInteracted = new Date();
        aiPreference.tagAffinity.set(tag, currentAffinity);
      });

      // ALSO UPDATE USER'S MAIN PREFERENCES
      if (interactionType === 'like' || interactionType === 'comment') {
        const user = await User.findById(userId);
        if (user && !user.preferences) {
          user.preferences = { interests: [] };
        }
        
        postTags.forEach(tag => {
          if (user.preferences && !user.preferences.interests.includes(tag)) {
            user.preferences.interests.push(tag);
          }
        });
        
        await user.save();
        console.log('✅ Updated user preferences from interaction:', postTags);
      }

      if (interactionType === 'unlike') {
        for (let [tag, affinity] of aiPreference.tagAffinity) {
          if (affinity.score <= 0) {
            aiPreference.tagAffinity.delete(tag);
          }
        }
      }
    }

    if (postId) {
      aiPreference.recommendationHistory.push({
        postId,
        shownAt: new Date(),
        interacted: interactionType !== 'view',
        interactionType
      });

      if (aiPreference.recommendationHistory.length > 100) {
        aiPreference.recommendationHistory = aiPreference.recommendationHistory.slice(-100);
      }
    }

    await aiPreference.save();

    res.json({
      success: true,
      message: 'Interaction recorded successfully'
    });

  } catch (error) {
    console.error('AI interaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error recording interaction'
    });
  }
});

// @route   GET /api/ai/recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20 } = req.query;

    const aiPreference = await AIPreference.findOne({ userId });
    
    // FALLBACK: If no AI preferences, check user's main preferences
    if (!aiPreference) {
      const user = await User.findById(userId);
      if (user && user.preferences && user.preferences.interests && user.preferences.interests.length > 0) {
        // Use user's main preferences for recommendations
        const allPosts = await Post.find({
          userId: { $ne: userId }
        })
          .populate('userId', 'username profilePic')
          .sort({ createdAt: -1 })
          .limit(parseInt(limit));

        const recommendedPosts = allPosts.filter(post => 
          post.tags && post.tags.some(tag => 
            user.preferences.interests.includes(tag)
          )
        ).slice(0, parseInt(limit));

        return res.json({
          success: true,
          posts: recommendedPosts.map(post => ({
            ...post.toObject(),
            recommendationScore: 5, // Default score for preference-based matches
            matchingTags: post.tags.filter(tag => user.preferences.interests.includes(tag)),
            reason: 'Based on your preferences'
          })),
          userInterests: user.preferences.interests.map(tag => ({ 
            tag, 
            score: 5, 
            interactionCount: 1, 
            category: categorizeTag(tag) 
          }))
        });
      }
      
      return res.json({
        success: true,
        posts: [],
        message: 'No preferences found'
      });
    }

    const interactedPostIds = aiPreference.recommendationHistory
      .filter(record => record.interacted)
      .map(record => record.postId);

    const allPosts = await Post.find({
      _id: { $nin: interactedPostIds },
      userId: { $ne: userId }
    })
      .populate('userId', 'username profilePic')
      .sort({ createdAt: -1 })
      .limit(100);

    const scoredPosts = allPosts.map(post => {
      let score = 0;
      const matchingTags = [];
      const newTags = [];

      post.tags.forEach(tag => {
        const affinity = aiPreference.tagAffinity.get(tag);
        if (affinity) {
          score += affinity.score;
          matchingTags.push(tag);
        } else {
          newTags.push(tag);
        }
      });

      if (newTags.length > 0) {
        score += newTags.length * aiPreference.aiSettings.discoveryBoost;
      }

      return {
        ...post.toObject(),
        recommendationScore: score,
        matchingTags,
        newTags,
        reason: generateRecommendationReason(matchingTags, newTags)
      };
    });

    const recommendedPosts = scoredPosts
      .filter(post => post.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      posts: recommendedPosts,
      userInterests: Array.from(aiPreference.tagAffinity.entries())
        .sort(([,a], [,b]) => b.score - a.score)
        .slice(0, 10)
        .map(([tag, data]) => ({ tag, ...data }))
    });

  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching recommendations'
    });
  }
});

// @route   POST /api/ai/survey
router.post('/survey', auth, async (req, res) => {
  try {
    const { responses } = req.body;
    const userId = req.user._id;

    let aiPreference = await AIPreference.findOne({ userId });
    if (!aiPreference) {
      aiPreference = new AIPreference({ userId });
    }

    // ALSO UPDATE USER'S MAIN PREFERENCES FROM SURVEY
    const user = await User.findById(userId);
    if (!user.preferences) {
      user.preferences = { interests: [] };
    }

    responses.forEach(response => {
      if (response.answer && typeof response.answer === 'string') {
        const words = response.answer.toLowerCase().split(/\s+/);
        const tags = extractTagsFromText(words);
        
        tags.forEach(tag => {
          // Update AI preferences
          const currentAffinity = aiPreference.tagAffinity.get(tag) || {
            score: 0,
            interactionCount: 0,
            lastInteracted: new Date(),
            category: categorizeTag(tag)
          };

          currentAffinity.score += 3;
          currentAffinity.interactionCount += 1;
          aiPreference.tagAffinity.set(tag, currentAffinity);

          // ALSO UPDATE USER'S MAIN PREFERENCES
          if (!user.preferences.interests.includes(tag)) {
            user.preferences.interests.push(tag);
          }
        });
      }
    });

    aiPreference.surveyResponses.push({
      questions: responses,
      completedAt: new Date()
    });

    await aiPreference.save();
    await user.save();

    console.log('✅ Updated both AI preferences and user preferences from survey');

    res.json({
      success: true,
      message: 'Survey responses recorded successfully'
    });

  } catch (error) {
    console.error('AI survey error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing survey'
    });
  }
});

// @route   GET /api/ai/interests
router.get('/interests', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 🎯 FIX: Get user's CURRENT preferences first
    const user = await User.findById(userId);
    const currentUserPreferences = user?.preferences?.interests || [];
    
    console.log('🎯 Current user preferences:', currentUserPreferences);

    const aiPreference = await AIPreference.findOne({ userId });

    // If no AI preferences, return user's current preferences
    if (!aiPreference) {
      return res.json({
        success: true,
        interests: currentUserPreferences.map(tag => ({
          tag,
          score: 5, // Default score
          interactionCount: 1,
          category: categorizeTag(tag),
          source: 'user_preferences'
        }))
      });
    }

    // 🎯 FIX: Combine AI interests with user's CURRENT preferences
    let interests = Array.from(aiPreference.tagAffinity.entries())
      .sort(([,a], [,b]) => b.score - a.score)
      .map(([tag, data]) => ({
        tag,
        score: data.score,
        interactionCount: data.interactionCount,
        category: data.category,
        source: 'ai_analysis'
      }));

    // 🎯 FIX: Add any user preferences that aren't in AI interests
    currentUserPreferences.forEach(tag => {
      if (!interests.find(interest => interest.tag === tag)) {
        interests.push({
          tag,
          score: 3, // Medium score for manual preferences
          interactionCount: 1,
          category: categorizeTag(tag),
          source: 'manual_addition'
        });
      }
    });

    // 🎯 FIX: Remove any interests that user has manually removed
    interests = interests.filter(interest => 
      currentUserPreferences.includes(interest.tag) || interest.interactionCount > 1
    );

    console.log('🎯 Final combined interests:', interests.map(i => i.tag));

    res.json({
      success: true,
      interests
    });

  } catch (error) {
    console.error('AI interests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching interests'
    });
  }
});

// @route   GET /api/ai/suggestions/users/:userId
router.get('/suggestions/users/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔄 Getting AI suggestions for user:', userId);
    
    // Get current user's preferences - CHECK USER'S CURRENT PREFERENCES FIRST
    const user = await User.findById(userId);
    const currentUserPreferences = user?.preferences?.interests || [];
    
    const aiPreference = await AIPreference.findOne({ userId });
    
    console.log('🔍 AI Preference found:', !!aiPreference);
    console.log('🔍 User Preferences found:', !!(user && user.preferences && user.preferences.interests));
    
    let userInterests = [];

    // PRIORITY 1: User's CURRENT preferences
    if (currentUserPreferences.length > 0) {
      userInterests = currentUserPreferences.slice(0, 5);
      console.log('✅ Using CURRENT user preferences:', userInterests);
    }
    // PRIORITY 2: AI Preferences (tagAffinity)
    else if (aiPreference && aiPreference.tagAffinity && aiPreference.tagAffinity.size > 0) {
      userInterests = Array.from(aiPreference.tagAffinity.keys())
        .sort((a, b) => aiPreference.tagAffinity.get(b).score - aiPreference.tagAffinity.get(a).score)
        .slice(0, 5);
      console.log('✅ Using AI tagAffinity:', userInterests);
    }
    // PRIORITY 3: AI interests array (legacy)
    else if (aiPreference && aiPreference.interests && aiPreference.interests.length > 0) {
      userInterests = aiPreference.interests;
      console.log('✅ Using AI interests array:', userInterests);
    }

    console.log('🎯 Final user interests for suggestions:', userInterests);

    if (!userInterests.length) {
      console.log('ℹ️ No user interests found, returning empty suggestions');
      return res.json({
        success: true,
        suggestedUsers: []
      });
    }

    console.log('🔍 Finding users with matching interests...');
    
    // Get all users except current user
    const allUsers = await User.find({ _id: { $ne: userId } })
      .select('username profilePicture bio profilePic')
      .limit(50);

    // Get posts for these users and check for matching tags
    const usersWithPosts = await Promise.all(
      allUsers.map(async (user) => {
        try {
          const userPosts = await Post.find({ userId: user._id });
          const matchingPosts = userPosts.filter(post => 
            post.tags && post.tags.some(tag => userInterests.includes(tag))
          );
          
          return {
            _id: user._id,
            username: user.username,
            profilePicture: user.profilePicture || user.profilePic,
            bio: user.bio,
            matchCount: matchingPosts.length
          };
        } catch (error) {
          console.error(`Error processing user ${user.username}:`, error);
          return null;
        }
      })
    );

    // Filter out null results and users with at least one matching post
    const suggestedUsers = usersWithPosts
      .filter(user => user !== null && user.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 10);

    console.log('✅ Found suggested users:', suggestedUsers.length);

    res.json({
      success: true,
      suggestedUsers: suggestedUsers
    });

  } catch (error) {
    console.error('❌ User suggestions error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message,
      suggestedUsers: [] 
    });
  }
});

// Helper functions (keep these the same)
function categorizeTag(tag) {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('travel') || tagLower.includes('vacation')) return 'travel';
  if (tagLower.includes('food') || tagLower.includes('cooking')) return 'food';
  if (tagLower.includes('tech') || tagLower.includes('programming')) return 'tech';
  if (tagLower.includes('fitness') || tagLower.includes('workout')) return 'fitness';
  if (tagLower.includes('art') || tagLower.includes('design')) return 'art';
  return 'lifestyle';
}

function extractTagsFromText(words) {
  const commonTags = [
    'travel', 'food', 'tech', 'fitness', 'art', 'music', 'photography',
    'programming', 'cooking', 'workout', 'design'
  ];
  return words.filter(word => 
    word.length > 3 && commonTags.some(tag => word.includes(tag))
  ).slice(0, 5);
}

function generateRecommendationReason(matchingTags, newTags) {
  if (matchingTags.length > 0 && newTags.length > 0) {
    return `Matches ${matchingTags.slice(0, 2).join(', ')} + ${newTags[0]}`;
  }
  if (matchingTags.length > 0) {
    return `Matches ${matchingTags.slice(0, 3).join(', ')}`;
  }
  return 'New content discovery';
}

export default router;
