// server/src/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('❌ No Authorization header provided');
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token, access denied' 
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      console.log('❌ No token found in Authorization header');
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token, access denied' 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token has expired' 
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token' 
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Token verification failed' 
      });
    }

    // Find user by id - check both 'userId' and 'id' for compatibility
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      console.log('❌ No user ID found in token payload');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token payload' 
      });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.log(`❌ User not found for ID: ${userId}`);
      return res.status(401).json({ 
        success: false, 
        message: 'User not found - token is invalid' 
      });
    }

    // Add user to request
    req.user = user;
    console.log(`✅ Authenticated user: ${user.username} (${user._id})`);
    
    next();
  } catch (error) {
    console.error('🔐 Auth middleware unexpected error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

export default auth;