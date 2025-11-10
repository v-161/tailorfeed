// server/src/routes/upload.js - Updated to match your frontend approach
import express from 'express';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/upload
// @desc    Upload image (compatible with frontend flow)
router.post('/', auth, async (req, res) => {
  try {
    // Since frontend handles uploads directly to Cloudinary,
    // this endpoint can be used for validation or backup uploads
    console.log('📝 Upload endpoint called - frontend should handle Cloudinary uploads directly');
    
    res.json({
      success: true,
      message: 'Use frontend Cloudinary service for direct uploads',
      note: 'Images should be uploaded directly from client to Cloudinary'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload'
    });
  }
});

export default router;