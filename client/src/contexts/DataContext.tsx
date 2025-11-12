import React, { 
    createContext, 
    useContext, 
    useState, 
    ReactNode,
    useCallback,
    useMemo,
    useEffect
} from 'react';
import { useAuth } from './AuthContext';

// Define types for MongoDB
export interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  createdAt: string;
  preferences?: {
    interests: string[];
    theme: 'light' | 'dark';
    aiPreferences?: {
      lastSurveyDate?: string;
      contentPreferences?: string[];
      engagementScore?: number;
    };
  };
  followers?: string[];
  following?: string[];
}

export interface Post {
  _id: string;
  userId: string;
  username: string;
  profilePicture?: string;
  caption: string;
  tags: string[];
  likes: string[];
  comments: Comment[];
  createdAt: string;
  imageUrl?: string;
  user?: {
    username: string;
    profilePicture?: string;
  };
}

export interface Comment {
  _id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

interface UserStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  engagementRate: number;
  topTags: string[];
  joinDate: string;
}

interface DataContextType {
  user: User | null;
  posts: Post[];
  userPreferences: string[];
  userStats: UserStats;
  followers: string[];
  following: string[];
  loading: boolean;
  setUser: (user: User | null) => void;
  addPost: (postData: Omit<Post, '_id' | 'createdAt' | 'userId' | 'username'>) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  addUserPreference: (tag: string) => Promise<void>;
  removeUserPreference: (tag: string) => Promise<void>; // ADD THIS LINE
  updateUserPreferences: (preferences: any) => Promise<void>;
  updateUserStats: () => void;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  fetchPosts: () => Promise<void>;
  fetchUserData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userPreferences, setUserPreferences] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const [userStats, setUserStats] = useState<UserStats>({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    engagementRate: 0,
    topTags: [],
    joinDate: new Date().toISOString()
  });

  // Fetch user data and posts on component mount
  useEffect(() => {
    if (currentUser) {
      fetchUserData();
      fetchPosts();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchUserData = async () => {
    if (!currentUser) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User data fetched:', {
          username: data.user.username,
          following: data.user.following?.length || 0,
          followers: data.user.followers?.length || 0
        });
        
        // FIXED: Ensure following data is in string format for comparison
        const stringFollowing = (data.user.following || []).map((id: any) => 
          typeof id === 'object' ? id._id?.toString() : id.toString()
        );
        
        const stringFollowers = (data.user.followers || []).map((id: any) => 
          typeof id === 'object' ? id._id?.toString() : id.toString()
        );
        
        setUser(data.user);
        setUserPreferences(data.user.preferences?.interests || []);
        setFollowers(stringFollowers);
        setFollowing(stringFollowing);
        
        console.log('🔍 Following IDs (string format):', stringFollowing);
      } else {
        console.error('❌ Failed to fetch user data:', response.status);
      }
    } catch (error) {
      console.error('❌ Failed to fetch user data:', error);
    }
  };

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
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStats = useCallback(() => {
    if (!user) return;

    const userPosts = posts.filter(post => post.userId === user._id);
    const totalPosts = userPosts.length;
    
    const totalLikes = userPosts.reduce((sum, post) => sum + post.likes.length, 0);
    const totalComments = userPosts.reduce((sum, post) => sum + post.comments.length, 0);
    
    const allTags = userPosts.flatMap(post => post.tags);
    const tagFrequency: { [key: string]: number } = {};
    allTags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
    
    const topTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);

    setUserStats({
      totalPosts,
      totalLikes,
      totalComments,
      engagementRate: totalPosts > 0 ? (totalLikes / totalPosts) * 100 : 0,
      topTags,
      joinDate: user.createdAt
    });
  }, [posts, user]);

  useEffect(() => {
    updateUserStats();
  }, [updateUserStats]);

  const addPost = useCallback(async (postData: Omit<Post, '_id' | 'createdAt' | 'userId' | 'username'>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });
      
      if (response.ok) {
        const newPost = await response.json();
        setPosts(prev => [newPost, ...prev]);
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }, []);

  const likePost = useCallback(async (postId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(prev => prev.map(post => 
          post._id === postId ? updatedPost : post
        ));
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  }, []);

  const addUserPreference = useCallback(async (tag: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tag })
      });
      
      if (response.ok) {
        setUserPreferences(prev => 
          prev.includes(tag) ? prev : [...prev, tag]
        );
      }
    } catch (error) {
      console.error('Failed to add preference:', error);
    }
  }, []);

  // ADD THIS FUNCTION: removeUserPreference
  const removeUserPreference = useCallback(async (tag: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/preferences`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tag })
      });
      
      if (response.ok) {
        setUserPreferences(prev => prev.filter(pref => pref !== tag));
        console.log('✅ Preference removed:', tag);
      } else {
        throw new Error('Failed to remove preference');
      }
    } catch (error) {
      console.error('Failed to remove preference:', error);
      throw error;
    }
  }, []);

  const updateUserPreferences = useCallback(async (preferences: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  }, []);

  // FIXED: followUser - ensures ID is in string format
  const followUser = useCallback(async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        console.log('✅ Followed user:', userId);
        
        // FIXED: Ensure userId is string for consistent comparison
        const stringUserId = userId.toString();
        
        // Update both user.following and the separate following array
        setFollowing(prev => 
          prev.includes(stringUserId) ? prev : [...prev, stringUserId]
        );
        
        // Also update user object's following array
        setUser(prev => prev ? {
          ...prev,
          following: prev.following ? [...prev.following, stringUserId] : [stringUserId]
        } : prev);
        
        // Refresh to ensure sync with backend
        setTimeout(() => {
          fetchUserData();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  }, [fetchUserData]);

  // FIXED: unfollowUser - ensures ID is in string format
  const unfollowUser = useCallback(async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/unfollow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        console.log('✅ Unfollowed user:', userId);
        
        // FIXED: Ensure userId is string for consistent comparison
        const stringUserId = userId.toString();
        
        // Update both user.following and the separate following array
        setFollowing(prev => prev.filter(id => id !== stringUserId));
        
        // Also update user object's following array
        setUser(prev => prev ? {
          ...prev,
          following: prev.following ? prev.following.filter(id => id !== stringUserId) : []
        } : prev);
        
        // Refresh to ensure sync with backend
        setTimeout(() => {
          fetchUserData();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to unfollow user:', error);
    }
  }, [fetchUserData]);

  const value: DataContextType = useMemo(() => ({
    user,
    posts,
    userPreferences,
    userStats,
    followers,
    following,
    loading,
    setUser,
    addPost,
    likePost,
    addUserPreference,
    removeUserPreference, // ADD THIS LINE
    updateUserPreferences,
    updateUserStats,
    followUser,
    unfollowUser,
    fetchPosts,
    fetchUserData,
  }), [
    user,
    posts,
    userPreferences,
    userStats,
    followers,
    following,
    loading,
    addPost,
    likePost,
    addUserPreference,
    removeUserPreference, // ADD THIS LINE
    updateUserPreferences,
    updateUserStats,
    followUser,
    unfollowUser,
    fetchPosts,
    fetchUserData,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-medium text-gray-700 p-4 rounded-lg shadow-lg bg-white">
          Loading data...
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};