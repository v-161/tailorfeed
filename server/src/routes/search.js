// server/src/routes/search.js - Optimized version
import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

const router = express.Router();

// @route   GET /api/search/trending
// @desc    Get trending tags and posts
router.get('/trending', auth, async (req, res) => {
  try {
    // Mock trending data for now
    const mockTrending = {
      tags: [
        { name: 'photography', count: 142 },
        { name: 'travel', count: 98 },
        { name: 'food', count: 76 },
        { name: 'art', count: 54 },
        { name: 'nature', count: 43 }
      ],
      suggestions: [
        'landscape', 'portrait', 'street', 'wildlife', 'macro'
      ]
    };

    res.json({
      success: true,
      ...mockTrending
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
        caption: post.caption,
        imageUrl: post.imageUrl,
        username: post.userId?.username || 'Unknown User',
        profilePicture: post.userId?.profilePic,
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