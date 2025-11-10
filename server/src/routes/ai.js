import express from 'express';
import AIPreference from '../models/AIPreference.js';
import AISurvey from '../models/AISurvey.js';
import Post from '../models/Post.js';
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
    if (!aiPreference) {
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

    responses.forEach(response => {
      if (response.answer && typeof response.answer === 'string') {
        const words = response.answer.toLowerCase().split(/\s+/);
        const tags = extractTagsFromText(words);
        
        tags.forEach(tag => {
          const currentAffinity = aiPreference.tagAffinity.get(tag) || {
            score: 0,
            interactionCount: 0,
            lastInteracted: new Date(),
            category: categorizeTag(tag)
          };

          currentAffinity.score += 3;
          currentAffinity.interactionCount += 1;
          aiPreference.tagAffinity.set(tag, currentAffinity);
        });
      }
    });

    aiPreference.surveyResponses.push({
      questions: responses,
      completedAt: new Date()
    });

    await aiPreference.save();

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
    const aiPreference = await AIPreference.findOne({ userId });

    if (!aiPreference) {
      return res.json({
        success: true,
        interests: []
      });
    }

    const interests = Array.from(aiPreference.tagAffinity.entries())
      .sort(([,a], [,b]) => b.score - a.score)
      .map(([tag, data]) => ({
        tag,
        score: data.score,
        interactionCount: data.interactionCount,
        category: data.category
      }));

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

// Helper functions
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