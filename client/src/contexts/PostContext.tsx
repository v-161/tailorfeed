import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { aiService } from '../services/aiService'; // ADDED IMPORT

export interface NewPostData {
  caption: string;
  tags: string[];
  imageUrl?: string;
}

export interface Post {
  _id: string;
  userId: string;
  username: string;
  profilePicture?: string;
  profilePic?: string;
  caption: string;
  tags: string[];
  likes: string[];
  comments: Comment[];
  createdAt: string;
  imageUrl?: string;
}

export interface Comment {
  _id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

interface PostContextType {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  likePost: (postId: string, userId: string, isLiked: boolean) => Promise<void>;
  createPost: (postData: NewPostData, imageFile?: File) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  fetchPosts: () => Promise<void>;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

interface PostProviderProps {
  children: ReactNode;
}

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentUser } = useAuth();
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (currentUser) {
      fetchPosts();
      const interval = setInterval(fetchPosts, 10000);
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('🔍 RAW POSTS DATA:', data);
        
        if (!data.posts || !Array.isArray(data.posts)) {
          console.error('Invalid posts data structure:', data);
          setPosts([]);
          return;
        }

        // FIXED: Better field mapping with proper userId extraction
        const transformedPosts = data.posts.map((post: any) => {
          console.log('📝 Processing post:', post);
          
          // FIXED: Handle userId properly - it could be an object or string
          let userId: string;
          let username: string;
          let profilePic: string;

          if (post.userId && typeof post.userId === 'object') {
            // userId is populated user object
            userId = post.userId._id || post.userId;
            username = post.userId.username || post.username || 'Unknown User';
            profilePic = post.userId.profilePic || post.profilePic || post.profilePicture;
          } else {
            // userId is just the ID string
            userId = post.userId;
            username = post.username || 'Unknown User';
            profilePic = post.profilePic || post.profilePicture;
          }

          // FIXED: Ensure userId is always a string for comparison
          const finalUserId = userId?.toString() || 'unknown';
          
          const transformedPost = {
            _id: post.id || post._id,
            userId: finalUserId, // FIXED: Always use string format
            username: username,
            profilePic: profilePic,
            profilePicture: profilePic,
            caption: post.caption || 'No caption',
            tags: post.tags || [],
            likes: post.likes || [],
            comments: post.comments || [],
            createdAt: post.createdAt,
            imageUrl: post.imageUrl
          };

          console.log('✅ Transformed post:', {
            id: transformedPost._id,
            userId: transformedPost.userId,
            username: transformedPost.username,
            hasImage: !!transformedPost.imageUrl,
            likes: transformedPost.likes
          });

          return transformedPost;
        });
        
        console.log('📊 FINAL TRANSFORMED POSTS:', transformedPosts.length);
        console.log('👥 Post user IDs:', transformedPosts.map((p: Post) => ({
          id: p._id,
          userId: p.userId,
          username: p.username,
          likes: p.likes
        })));
        
        setPosts(transformedPosts);
        setError(null);
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error("❌ Error fetching posts:", err);
      setError("Failed to fetch posts. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikePost = async (postId: string, userId: string, isLiked: boolean) => {
    try {
      const token = localStorage.getItem('token');
      console.log(`🔄 Liking post ${postId} for user ${userId}, isLiked: ${isLiked}`);
      
      // Get the post data first to extract tags for AI tracking
      const post = posts.find(p => p._id === postId);
      const postTags = post?.tags || [];
      
      console.log('🎯 Post tags for AI tracking:', postTags);
      
      // FIXED: Changed from POST to PUT to match backend
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userId, 
          action: isLiked ? 'unlike' : 'like' 
        })
      });
      
      console.log('Like API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Like API success:', result);
        
        // 🎯 CRITICAL FIX: Record AI interaction AFTER successful like/unlike
        try {
          if (isLiked) {
            await aiService.unlikePostWithAI(postId, postTags);
          } else {
            await aiService.likePostWithAI(postId, postTags);
          }
          console.log('✅ AI interaction recorded');
          
          // 🎯 FIX: Trigger AI data refresh for real-time updates
          setTimeout(() => {
            if (typeof (window as any).refreshAIData === 'function') {
              console.log('🔄 Triggering AI data refresh after like/unlike');
              (window as any).refreshAIData();
            }
          }, 500);
        } catch (aiError) {
          console.error('❌ AI tracking failed, but like was successful:', aiError);
        }
        
        // Update local state immediately with proper like handling
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post._id === postId) {
              // Ensure likes is always an array
              const currentLikes = Array.isArray(post.likes) ? post.likes : [];
              const newLikes = isLiked 
                ? currentLikes.filter(id => id !== userId) // Remove like
                : [...currentLikes, userId]; // Add like
              
              console.log(`❤️ Post ${postId} likes updated:`, {
                from: currentLikes,
                to: newLikes,
                userLiked: !isLiked
              });
              
              return { 
                ...post, 
                likes: newLikes 
              };
            }
            return post;
          })
        );
        
      } else {
        const errorText = await response.text();
        console.error('❌ Like API error:', errorText);
        throw new Error(`Like failed: ${errorText}`);
      }
    } catch (err) {
      console.error("❌ Failed to like/unlike post:", err);
      throw err;
    }
  };

  const handleCreatePost = async (postData: NewPostData, imageFile?: File): Promise<void> => {
    if (!currentUser) {
      throw new Error("Authentication required: User not logged in.");
    }

    try {
      const token = localStorage.getItem('token');
      let imageUrl = postData.imageUrl;
      
      // Upload image directly to Cloudinary if provided
      if (imageFile) {
        const uploadServiceModule = await import('../services/cloudinaryService');
        imageUrl = await uploadServiceModule.cloudinaryService.uploadImage(imageFile);
        console.log('✅ Image uploaded to Cloudinary:', imageUrl);
      }

      // Create post with the Cloudinary URL
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...postData,
          imageUrl
        })
      });
      
      if (response.ok) {
        const newPost = await response.json();
        setPosts(prev => [newPost, ...prev]);
      } else {
        throw new Error('Failed to create post');
      }
    } catch (err) {
      console.error("Failed to create post:", err);
      throw err;
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text,
          userId: currentUser._id,
          username: currentUser.username 
        })
      });
      
      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId ? updatedPost.post : post
          )
        );
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
      throw err;
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      } else {
        throw new Error('Failed to delete post');
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
      throw err;
    }
  };

  const contextValue: PostContextType = {
    posts,
    isLoading,
    error,
    likePost: handleLikePost,
    createPost: handleCreatePost,
    addComment,
    deletePost,
    fetchPosts
  };

  return (
    <PostContext.Provider value={contextValue}>
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
};
