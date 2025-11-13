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

    console.log('🎯 AI Interaction:', { interactionType, postTags });

    let aiPreference = await AIPreference.findOne({ userId });
    if (!aiPreference) {
      aiPreference = new AIPreference({ userId });
    }

    // 🎯 CRITICAL FIX: Get user FIRST and update preferences directly
    const user = await User.findById(userId);
    if (!user.preferences) {
      user.preferences = { interests: [] };
    }

    if (postTags && Array.isArray(postTags)) {
      const weightMap = {
        'like': 2,
        'comment': 3,
        'share': 4,
        'view': 0.5,
        'unlike': -3
      };

      const weight = weightMap[interactionType] || 1;

      // 🎯 SIMPLIFIED LOGIC: Handle AI preferences
      postTags.forEach(tag => {
        if (!tag || tag.trim() === '') return;

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

      // 🎯 CRITICAL FIX: SIMPLIFIED USER PREFERENCES UPDATE
      if (interactionType === 'like') {
        // ADD TAGS TO USER PREFERENCES WHEN LIKING
        postTags.forEach(tag => {
          if (tag && !user.preferences.interests.includes(tag)) {
            user.preferences.interests.push(tag);
            console.log('✅ ADDED tag to user preferences from like:', tag);
          }
        });
      } 
      else if (interactionType === 'unlike') {
        // REMOVE TAGS FROM USER PREFERENCES WHEN UNLIKING
        postTags.forEach(tag => {
          if (tag && user.preferences.interests.includes(tag)) {
            user.preferences.interests = user.preferences.interests.filter(t => t !== tag);
            console.log('🗑️ REMOVED tag from user preferences from unlike:', tag);
          }
        });

        // Also remove from AI preferences if score is too low
        for (let [tag, affinity] of aiPreference.tagAffinity) {
          if (affinity.score <= -5) {
            aiPreference.tagAffinity.delete(tag);
            console.log('🗑️ Removed tag from AI preferences due to low score:', tag);
          }
        }
      }

      // 🎯 FIX: SAVE USER PREFERENCES
      await user.save();
      console.log('💾 Saved user preferences:', user.preferences.interests);
    }

    // Handle recommendation history
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
      message: 'Interaction recorded successfully',
      userPreferences: user.preferences.interests // Return updated preferences for debugging
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

    console.log('🎯 Survey received:', responses);

    let aiPreference = await AIPreference.findOne({ userId });
    if (!aiPreference) {
      aiPreference = new AIPreference({ userId });
    }

    // ALSO UPDATE USER'S MAIN PREFERENCES FROM SURVEY
    const user = await User.findById(userId);
    if (!user.preferences) {
      user.preferences = { interests: [] };
    }

    // 🎯 CRITICAL FIX: Extract tags directly from survey responses (not from text)
    const tagsFromSurvey = responses
      .map(response => {
        // Extract tag from question: "How interested are you in {tag}?"
        const match = response.question.match(/How interested are you in (.+)\?/);
        return match ? match[1].toLowerCase().trim() : null;
      })
      .filter(tag => tag && tag.length > 0);

    console.log('🎯 Tags extracted from survey:', tagsFromSurvey);

    tagsFromSurvey.forEach((tag, index) => {
      const response = responses[index];
      const isInterested = response.answer && response.answer.includes('interested');
      
      if (isInterested) {
        // Update AI preferences for interested tags
        const currentAffinity = aiPreference.tagAffinity.get(tag) || {
          score: 0,
          interactionCount: 0,
          lastInteracted: new Date(),
          category: categorizeTag(tag)
        };

        currentAffinity.score += 5; // High weight for survey responses
        currentAffinity.interactionCount += 1;
        aiPreference.tagAffinity.set(tag, currentAffinity);

        // ALSO UPDATE USER'S MAIN PREFERENCES
        if (!user.preferences.interests.includes(tag)) {
          user.preferences.interests.push(tag);
          console.log('✅ Added tag to user preferences from survey:', tag);
        }
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
      message: 'Survey responses recorded successfully',
      tagsAdded: tagsFromSurvey
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
    
    console.log('🎯 Current user preferences from DB:', currentUserPreferences);

    const aiPreference = await AIPreference.findOne({ userId });

    // If no AI preferences, return ONLY user's current preferences
    if (!aiPreference) {
      console.log('🔄 No AI preferences found, returning user preferences');
      return res.json({
        success: true,
        interests: currentUserPreferences.map(tag => ({
          tag,
          score: 5, // Default score
          interactionCount: 1,
          category: categorizeTag(tag),
          tagAffinity: 0.5, // Add tagAffinity for frontend
          source: 'user_preferences'
        }))
      });
    }

    // 🎯 CRITICAL FIX: Only return AI interests that are in CURRENT user preferences
    let interests = Array.from(aiPreference.tagAffinity.entries())
      .filter(([tag, data]) => {
        const isInPreferences = currentUserPreferences.includes(tag);
        console.log(`🔍 Tag ${tag}: inPreferences=${isInPreferences}, score=${data.score}`);
        return isInPreferences && data.score > 0; // Only include positive engagement
      })
      .sort(([,a], [,b]) => b.score - a.score)
      .map(([tag, data]) => ({
        tag,
        score: data.score,
        interactionCount: data.interactionCount,
        category: data.category,
        tagAffinity: Math.min(data.score / 20, 1), // Convert to 0-1 scale for frontend
        source: 'ai_analysis'
      }));

    console.log('🎯 Filtered AI interests by current preferences:', interests.map(i => i.tag));

    // 🎯 FIX: If user has preferences but no matching AI data, create basic entries
    if (currentUserPreferences.length > 0 && interests.length === 0) {
      console.log('🔄 Creating basic interests from user preferences');
      interests = currentUserPreferences.map(tag => ({
        tag,
        score: 5,
        interactionCount: 1,
        category: categorizeTag(tag),
        tagAffinity: 0.5,
        source: 'user_preferences'
      }));
    }

    console.log('🎯 Final interests to return:', interests.length);

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

    // 🎯 CRITICAL FIX: ONLY use CURRENT user preferences, ignore AI preferences
    if (currentUserPreferences.length > 0) {
      userInterests = currentUserPreferences.slice(0, 5);
      console.log('✅ STRICTLY Using CURRENT user preferences:', userInterests);
    } else {
      console.log('ℹ️ No user preferences found, returning empty suggestions');
      return res.json({
        success: true,
        suggestedUsers: []
      });
    }

    console.log('🎯 Final user interests for suggestions:', userInterests);

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
