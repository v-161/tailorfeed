// server/src/routes/notifications.js
import express from 'express';
import auth from '../middleware/auth.js';

const router = express.Router();

// Try to import Notification model, but provide fallback if it doesn't exist
let Notification;
try {
  Notification = (await import('../models/Notification.js')).default;
} catch (error) {
  console.log('Notification model not found, using mock data');
  Notification = null;
}

// @route   GET /api/notifications
// @desc    Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    // If Notification model exists, use real data
    if (Notification) {
      const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);

      const unreadCount = await Notification.countDocuments({ 
        userId: req.user._id, 
        read: false 
      });

      return res.json({
        success: true,
        notifications: notifications,
        unreadCount: unreadCount
      });
    }

    // Fallback: Mock notifications
    const mockNotifications = [
      {
        _id: '1',
        type: 'like',
        message: 'liked your post',
        userId: req.user._id,
        username: 'john_doe',
        postId: 'post1',
        read: false,
        priority: 'medium',
        createdAt: new Date()
      },
      {
        _id: '2',
        type: 'follow',
        message: 'started following you',
        userId: req.user._id,
        username: 'jane_smith',
        read: false,
        priority: 'medium',
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        _id: '3',
        type: 'comment',
        message: 'commented on your post',
        userId: req.user._id,
        username: 'mike_jones',
        postId: 'post1',
        read: true,
        priority: 'medium',
        createdAt: new Date(Date.now() - 7200000)
      }
    ];

    const unreadCount = mockNotifications.filter(n => !n.read).length;

    res.json({
      success: true,
      notifications: mockNotifications,
      unreadCount: unreadCount
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching notifications'
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    if (Notification) {
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      const unreadCount = await Notification.countDocuments({ 
        userId: req.user._id, 
        read: false 
      });

      return res.json({
        success: true,
        message: 'Notification marked as read',
        unreadCount: unreadCount
      });
    }

    // Fallback for mock data
    res.json({
      success: true,
      message: 'Notification marked as read (mock)',
      unreadCount: 1 // Mock value
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking notification as read'
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    if (Notification) {
      await Notification.updateMany(
        { userId: req.user._id, read: false },
        { read: true }
      );

      return res.json({
        success: true,
        message: 'All notifications marked as read',
        unreadCount: 0
      });
    }

    // Fallback for mock data
    res.json({
      success: true,
      message: 'All notifications marked as read (mock)',
      unreadCount: 0
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking all notifications as read'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    if (Notification) {
      const notification = await Notification.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      const unreadCount = await Notification.countDocuments({ 
        userId: req.user._id, 
        read: false 
      });

      return res.json({
        success: true,
        message: 'Notification deleted',
        unreadCount: unreadCount
      });
    }

    // Fallback for mock data
    res.json({
      success: true,
      message: 'Notification deleted (mock)',
      unreadCount: 1 // Mock value
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting notification'
    });
  }
});

// @route   DELETE /api/notifications
// @desc    Clear all notifications
router.delete('/', auth, async (req, res) => {
  try {
    if (Notification) {
      await Notification.deleteMany({ userId: req.user._id });

      return res.json({
        success: true,
        message: 'All notifications cleared',
        unreadCount: 0
      });
    }

    // Fallback for mock data
    res.json({
      success: true,
      message: 'All notifications cleared (mock)',
      unreadCount: 0
    });

  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error clearing notifications'
    });
  }
});

export default router;