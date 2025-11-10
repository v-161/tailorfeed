// server/src/routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePic, // Changed to profilePicture
        bio: user.bio,                   // Added
        website: user.website,           // Added
        stats: user.stats,
        aiPreferences: user.aiPreferences
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePic, // Changed to profilePicture
        bio: user.bio,                   // Added
        website: user.website,           // Added
        stats: user.stats,
        aiPreferences: user.aiPreferences
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', auth, async (req, res) => {
  try {
    // Get fresh user data from database
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePic, // Changed to profilePicture
        bio: user.bio,                   // Added
        website: user.website,           // Added
        stats: user.stats,
        aiPreferences: user.aiPreferences,
        settings: user.settings,
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

// @route   POST /api/auth/forgot-password
// @desc    Forgot password (send reset email)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // In a real app, you would:
    // 1. Generate reset token
    // 2. Send email with reset link
    // 3. Save token to user document with expiry

    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // In a real app, you would:
    // 1. Verify reset token
    // 2. Find user by reset token
    // 3. Update password
    // 4. Clear reset token

    // For now, we'll simulate success
    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;