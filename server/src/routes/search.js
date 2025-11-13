// server/src/routes/search.js - Optimized version
import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

const router = express.Router();

// @route   GET /api/search/trending
// @desc    Get trending tags and AI-suggested users based on preferences
router.get('/trending', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user preferences to personalize suggestions
    const user = await User.findById(userId);
    const userPreferences = user?.preferences?.interests || [];
    
    console.log('🎯 Getting personalized suggestions for user:', userId);
    console.log('🎯 User preferences:', userPreferences);

    let suggestedUsers = [];

    // 🎯 FIX: Get AI suggested users based on preferences
    if (userPreferences.length > 0) {
      // Find users who post content matching user preferences
      const usersWithMatchingPosts = await User.aggregate([
        { $match: { _id: { $ne: userId } } }, // Exclude current user
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'userId',
            as: 'userPosts'
          }
        },
        {
          $match: {
            'userPosts.tags': { $in: userPreferences }
          }
        },
        {
          $project: {
            username: 1,
            profilePic: 1,
            bio: 1,
            matchCount: {
              $size: {
                $filter: {
                  input: '$userPosts.tags',
                  as: 'tags',
                  cond: { $in: ['$$tags', userPreferences] }
                }
              }
            }
          }
        },
        { $sort: { matchCount: -1 } },
        { $limit: 10 }
      ]);

      suggestedUsers = usersWithMatchingPosts.map(user => ({
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePic,
        bio: user.bio,
        matchCount: user.matchCount
      }));

      console.log('✅ Found suggested users based on preferences:', suggestedUsers.length);
    }

    // Mock trending data (you can enhance this too)
    const mockTrending = {
      tags: [
        { name: 'photography', count: 142 },
        { name: 'travel', count: 98 },
        { name: 'food', count: 76 },
        { name: 'art', count: 54 },
        { name: 'nature', count: 43 }
      ],
      suggestions: userPreferences.slice(0, 5) // Show user's own preferences as suggestions
    };

    res.json({
      success: true,
      ...mockTrending,
      suggestedUsers // 🎯 RETURN AI-SUGGESTED USERS
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching trending data'
    });
  }
});

// @route   GET /api/search
// @desc    Search users and posts
router.get('/', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    // Return empty results for empty queries
    if (!q || !q.trim()) {
      return res.json({
        success: true,
        users: [],
        posts: []
      });
    }

    const searchQuery = q.trim();
    
    // Search users and posts in parallel
    const [users, posts] = await Promise.all([
      // Search users
      User.find({
        username: { $regex: searchQuery, $options: 'i' }
      }).select('username profilePic').limit(10),
      
      // Search posts
      Post.find({
        $or: [
          { caption: { $regex: searchQuery, $options: 'i' } },
          { tags: { $in: [new RegExp(searchQuery, 'i')] } }
        ]
      })
      .populate('userId', 'username profilePic')
      .limit(20)
    ]);

    res.json({
      success: true,
      users: users.map(user => ({
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePic
      })),
      posts: posts.map(post => ({
        _id: post._id,
        userId: post.userId?._id || post.userId, // ✅ CRITICAL FIX: Include userId
        caption: post.caption,
        imageUrl: post.imageUrl,
        username: post.userId?.username || 'Unknown User',
        profilePicture: post.userId?.profilePic,
        tags: post.tags || [], // ✅ Include tags for consistency
        likes: post.likes || [], // ✅ Include likes array
        comments: post.comments || [], // ✅ Include comments array
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
        createdAt: post.createdAt
      }))
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during search'
    });
  }
});

export default router;
