import express from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts
router.get('/', async (req, res) => {
  try {
    const { limit } = req.query;
    let query = Post.find()
      .populate('userId', 'username profilePic')
      .sort({ createdAt: -1 });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const posts = await query;
    
    console.log('🔍 Posts fetched:', posts.length);
    
    res.json({
      success: true,
      posts: posts.map(post => {
        const userData = post.userId || {};
        
        return {
          id: post._id,
          userId: userData._id || post.userId,
          username: userData.username || post.username || 'Unknown User',
          profilePic: userData.profilePic || post.profilePic,
          profilePicture: userData.profilePic || post.profilePic, // Add both for compatibility
          caption: post.caption || '',
          imageUrl: post.imageUrl || '',
          tags: post.tags || [],
          likes: post.likes || [],
          comments: post.comments || [],
          commentsCount: post.comments?.length || 0,
          likesCount: post.likes?.length || 0,
          createdAt: post.createdAt
        };
      })
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching posts'
    });
  }
});

// @route   POST /api/posts
// @desc    Create a post
router.post('/', auth, async (req, res) => {
  try {
    const { caption, tags, imageUrl } = req.body;

    const post = new Post({
      userId: req.user._id,
      username: req.user.username,
      profilePic: req.user.profilePic,
      caption,
      tags: Array.isArray(tags) ? tags : [],
      imageUrl: imageUrl || '',
      likes: [],
      comments: []
    });

    await post.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalPosts': 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      postId: post._id,
      post: {
        id: post._id,
        userId: post.userId,
        username: post.username,
        profilePic: post.profilePic,
        profilePicture: post.profilePic, // Add both for compatibility
        caption: post.caption,
        imageUrl: post.imageUrl,
        tags: post.tags,
        likes: post.likes,
        comments: post.comments,
        commentsCount: post.comments?.length || 0,
        likesCount: post.likes?.length || 0,
        createdAt: post.createdAt
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating post'
    });
  }
});

// @route   PUT /api/posts/:id/like
// @desc    Like/unlike a post
router.put('/:id/like', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, action } = req.body;

    const post = await Post.findById(id).populate('userId', 'username profilePic');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (action === 'like') {
      if (!post.likes.includes(userId)) {
        post.likes.push(userId);
        
        // CREATE NOTIFICATION FOR POST OWNER (only if not liking own post)
        if (post.userId._id.toString() !== userId) {
          const notification = new Notification({
            userId: post.userId._id,
            type: 'like',
            message: 'liked your post',
            username: req.user.username,
            profilePicture: req.user.profilePic,
            postId: post._id,
            metadata: {
              postImage: post.imageUrl
            }
          });
          await notification.save();
          console.log('✅ Like notification created for user:', post.userId._id);
        }
      }
    } else if (action === 'unlike') {
      post.likes = post.likes.filter(likeId => likeId.toString() !== userId);
    }

    await post.save();

    res.json({
      success: true,
      message: `Post ${action === 'like' ? 'liked' : 'unliked'} successfully`,
      likesCount: post.likes.length,
      likes: post.likes
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating like'
    });
  }
});

// @route   POST /api/posts/:id/comments
// @desc    Add a comment to a post
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, userId, username } = req.body;

    console.log('💬 Adding comment to post:', id, 'Text:', text);

    const post = await Post.findById(id).populate('userId', 'username profilePic');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Create new comment
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      userId: userId || req.user._id,
      username: username || req.user.username,
      text: text,
      createdAt: new Date()
    };

    // Add comment to post
    post.comments.push(newComment);
    await post.save();

    // CREATE NOTIFICATION FOR POST OWNER (only if not commenting on own post)
    const commenterId = userId || req.user._id.toString();
    if (post.userId._id.toString() !== commenterId) {
      const notification = new Notification({
        userId: post.userId._id,
        type: 'comment',
        message: 'commented on your post',
        username: username || req.user.username,
        profilePicture: req.user.profilePic,
        postId: post._id,
        metadata: {
          postImage: post.imageUrl,
          commentText: text.substring(0, 100)
        }
      });
      await notification.save();
      console.log('✅ Comment notification created for user:', post.userId._id);
    }

    console.log('✅ Comment added, total comments:', post.comments.length);

    // Populate to get updated data
    const updatedPost = await Post.findById(id);
    
    res.json({
      success: true,
      message: 'Comment added successfully',
      post: {
        id: updatedPost._id,
        userId: updatedPost.userId,
        username: updatedPost.username,
        profilePic: updatedPost.profilePic,
        profilePicture: updatedPost.profilePic, // Add both for compatibility
        caption: updatedPost.caption,
        imageUrl: updatedPost.imageUrl,
        tags: updatedPost.tags,
        likes: updatedPost.likes,
        comments: updatedPost.comments,
        commentsCount: updatedPost.comments.length,
        likesCount: updatedPost.likes.length,
        createdAt: updatedPost.createdAt
      }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding comment'
    });
  }
});

// @route   GET /api/posts/user/:userId
// @desc    Get posts by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      posts: posts.map(post => ({
        id: post._id,
        userId: post.userId,
        username: post.username,
        profilePic: post.profilePic,
        profilePicture: post.profilePic, // Add both for compatibility
        caption: post.caption,
        imageUrl: post.imageUrl,
        tags: post.tags,
        likes: post.likes,
        comments: post.comments,
        commentsCount: post.comments?.length || 0,
        likesCount: post.likes?.length || 0,
        createdAt: post.createdAt
      }))
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user posts'
    });
  }
});

export default router;