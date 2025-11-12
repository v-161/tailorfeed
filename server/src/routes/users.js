import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current user (alias for /auth/me)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('followers', 'username profilePic')
      .populate('following', 'username profilePic');
    
    console.log('🔍 User data fetched - Following:', user.following?.length || 0, 'Followers:', user.followers?.length || 0);
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePic,
        bio: user.bio,
        website: user.website,
        stats: user.stats,
        aiPreferences: user.aiPreferences,
        settings: user.settings,
        followers: user.followers || [],
        following: user.following || [],
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user profile by ID
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username profilePic bio stats followers following')
      .populate('followers', 'username profilePic')
      .populate('following', 'username profilePic');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's posts
    const userPosts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    // FIXED: Check if current user is following this user
    const isFollowing = user.followers.some(follower => {
      const followerId = typeof follower === 'object' ? follower._id.toString() : follower.toString();
      return followerId === req.user._id.toString();
    });

    console.log('🔍 User profile - IsFollowing:', isFollowing, 'User ID:', req.user._id);

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePic,
        bio: user.bio,
        stats: user.stats,
        followers: user.followers,
        following: user.following,
        isFollowing: isFollowing,
        posts: userPosts.map(post => ({
          id: post._id,
          caption: post.caption,
          imageUrl: post.imageUrl,
          tags: post.tags,
          likes: post.likes,
          comments: post.comments,
          createdAt: post.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user profile'
    });
  }
});

// @route   POST /api/users/follow
// @desc    Follow a user
router.post('/follow', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already following
    const currentUser = await User.findById(req.user._id);
    const isAlreadyFollowing = currentUser.following.some(followingId => 
      followingId.toString() === userId
    );

    if (isAlreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user'
      });
    }

    console.log('🔄 Following user:', userId, 'by user:', req.user._id);

    // Add to current user's following
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { following: userId }
    });
    
    // Add to target user's followers
    await User.findByIdAndUpdate(userId, {
      $addToSet: { followers: req.user._id }
    });

    // CREATE NOTIFICATION FOR THE USER BEING FOLLOWED
    const notification = new Notification({
      userId: userId,
      type: 'follow',
      message: 'started following you',
      username: req.user.username,
      profilePicture: req.user.profilePic
    });
    await notification.save();
    console.log('✅ Follow notification created for user:', userId);

    res.json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error following user'
    });
  }
});

// @route   POST /api/users/unfollow
// @desc    Unfollow a user
router.post('/unfollow', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log('🔄 Unfollowing user:', userId, 'by user:', req.user._id);

    // Remove from current user's following
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { following: userId }
    });
    
    // Remove from target user's followers
    await User.findByIdAndUpdate(userId, {
      $pull: { followers: req.user._id }
    });

    res.json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error unfollowing user'
    });
  }
});

// @route   POST /api/users/preferences
// @desc    Add a tag to user preferences
router.post('/preferences', auth, async (req, res) => {
  try {
    const { tag } = req.body;
    const userId = req.user._id;

    if (!tag) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tag is required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = { interests: [] };
    }

    // Add tag if it doesn't already exist
    if (!user.preferences.interests.includes(tag)) {
      user.preferences.interests.push(tag);
      await user.save();
    }

    console.log('✅ Preference added:', {
      userId: user._id,
      username: user.username,
      addedTag: tag,
      allInterests: user.preferences.interests
    });

    res.json({
      success: true,
      message: 'Preference added successfully',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('❌ Error adding preference:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add preference',
      error: error.message 
    });
  }
});

// @route   DELETE /api/users/preferences
// @desc    Remove a tag from user preferences
router.delete('/preferences', auth, async (req, res) => {
  try {
    const { tag } = req.body;
    const userId = req.user._id;

    if (!tag) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tag is required' 
      });
    }

    // Find user and remove the tag from preferences
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = { interests: [] };
    }

    // Remove the tag from interests array
    user.preferences.interests = user.preferences.interests.filter(
      interest => interest !== tag
    );

    await user.save();

    console.log('✅ Preference removed:', {
      userId: user._id,
      username: user.username,
      removedTag: tag,
      remainingInterests: user.preferences.interests
    });

    res.json({
      success: true,
      message: 'Preference removed successfully',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('❌ Error removing preference:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove preference',
      error: error.message 
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('followers', 'username profilePic')
      .populate('following', 'username profilePic');
    
    // Get user's posts
    const userPosts = await Post.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePic,
        bio: user.bio,
        website: user.website,
        stats: user.stats,
        aiPreferences: user.aiPreferences,
        settings: user.settings,
        followers: user.followers || [],
        following: user.following || [],
        posts: userPosts.map(post => ({
          id: post._id,
          caption: post.caption,
          imageUrl: post.imageUrl,
          tags: post.tags,
          likes: post.likes,
          comments: post.comments,
          createdAt: post.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, bio, profilePicture, website } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicture) updateData.profilePic = profilePicture;
    if (website !== undefined) updateData.website = website;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePic,
        bio: user.bio,
        website: user.website,
        stats: user.stats,
        aiPreferences: user.aiPreferences,
        settings: user.settings
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @route   POST /api/users/ai-survey
// @desc    Submit AI survey responses
router.post('/ai-survey', auth, async (req, res) => {
  try {
    const { responses } = req.body;

    // Extract interests from survey responses
    const interests = responses
      .filter(response => response.answer && typeof response.answer === 'string')
      .flatMap(response => 
        response.answer.toLowerCase().split(/[,\s]+/).filter(word => word.length > 2)
      );

    // Update user's AI preferences
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          'aiPreferences.surveyHistory': {
            date: new Date(),
            responses
          }
        },
        $addToSet: {
          'aiPreferences.interests': { $each: interests }
        },
        'aiPreferences.lastSurveyDate': new Date(),
        $inc: { 'aiPreferences.engagementScore': 10 }
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Survey submitted successfully',
      aiPreferences: user.aiPreferences
    });

  } catch (error) {
    console.error('AI survey error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error submitting survey'
    });
  }
});

export default router;