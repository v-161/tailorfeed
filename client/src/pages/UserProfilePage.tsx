import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Avatar, Paper, Card, CardContent,
  CardMedia, IconButton, Button, Tab, Tabs, Chip,
  CircularProgress, Alert
} from '@mui/material';
import {
  Favorite, ChatBubbleOutline, PersonAdd, Person
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDataContext } from '../contexts/DataContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-profile-tabpanel-${index}`}
      aria-labelledby={`user-profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

interface UserProfile {
  _id: string;
  username: string;
  profilePicture?: string;
  bio: string;
  createdAt: string;
  stats: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    followers: number;
    following: number;
  };
  followers: any[];
  following: any[];
  isFollowing: boolean;
  posts: any[];
}

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const { followUser, unfollowUser, following } = useDataContext();
  const navigate = useNavigate();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 User profile data:', data.user);
          console.log('🔍 First follower:', data.user.followers[0]);
          setUserProfile(data.user);
          setIsFollowing(data.user.isFollowing);
        } else {
          setError('User not found');
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, API_URL]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFollowToggle = async () => {
    if (!userId || !userProfile) return;
    
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        // Update local state to reflect the change immediately
        setUserProfile(prev => prev ? {
          ...prev,
          isFollowing: false,
          followers: prev.followers.filter(follower => 
            follower._id !== currentUser?._id
          ),
          stats: {
            ...prev.stats,
            followers: Math.max(0, prev.stats.followers - 1)
          }
        } : null);
      } else {
        await followUser(userId);
        setIsFollowing(true);
        // Update local state to reflect the change immediately
        setUserProfile(prev => prev ? {
          ...prev,
          isFollowing: true,
          followers: [...prev.followers, {
            _id: currentUser?._id,
            username: currentUser?.username,
            profilePic: currentUser?.profilePicture
          }],
          stats: {
            ...prev.stats,
            followers: prev.stats.followers + 1
          }
        } : null);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !userProfile) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error || 'User not found'}</Alert>
      </Box>
    );
  }

  // Don't show follow button for own profile
  const isOwnProfile = currentUser?._id === userId;

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
          {/* Profile Picture */}
          <Avatar 
            sx={{ 
              width: 100, 
              height: 100, 
              border: '4px solid',
              borderColor: 'background.paper',
              boxShadow: 2,
              mr: 3
            }}
            src={userProfile.profilePicture}
          >
            {userProfile.username[0]?.toUpperCase()}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h4" fontWeight="bold">
                {userProfile.username}
              </Typography>
              
              {!isOwnProfile && (
                <Button 
                  variant={isFollowing ? "outlined" : "contained"}
                  startIcon={isFollowing ? <Person /> : <PersonAdd />}
                  onClick={handleFollowToggle}
                  size="small"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <Typography variant="body1">
                <strong>{userProfile.stats.totalPosts}</strong> posts
              </Typography>
              <Typography variant="body1">
                <strong>{userProfile.followers.length}</strong> followers
              </Typography>
              <Typography variant="body1">
                <strong>{userProfile.following.length}</strong> following
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 1 }}>
              {userProfile.bio || 'No bio yet'}
            </Typography>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Joined {formatJoinDate(userProfile.createdAt)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Posts" />
          <Tab label="Followers" />
          <Tab label="Following" />
        </Tabs>

        {/* Posts Tab */}
        <TabPanel value={activeTab} index={0}>
          {userProfile.posts && userProfile.posts.length > 0 ? (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2 
            }}>
              {userProfile.posts.map((post) => (
                <Card key={post.id || post._id} sx={{ position: 'relative' }}>
                  {post.imageUrl && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={post.imageUrl}
                      alt="Post"
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="body2" noWrap>
                      {post.caption}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Favorite fontSize="small" color="error" />
                        <Typography variant="caption">
                          {post.likes?.length || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChatBubbleOutline fontSize="small" />
                        <Typography variant="caption">
                          {post.comments?.length || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Posts Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userProfile.username} hasn't shared any posts yet.
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Followers Tab */}
        <TabPanel value={activeTab} index={1}>
          {userProfile.followers && userProfile.followers.length > 0 ? (
            <Box>
              {userProfile.followers.map((follower) => (
                <Box key={follower._id} sx={{ display: 'flex', alignItems: 'center', py: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Avatar 
                    src={follower.profilePic || follower.profilePicture} // Try both fields
                    sx={{ mr: 2 }}
                    alt={follower.username}
                  >
                    {follower.username?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                  <Typography variant="body1" fontWeight="medium">
                    {follower.username || 'Unknown User'}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No Followers
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userProfile.username} doesn't have any followers yet.
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Following Tab */}
        <TabPanel value={activeTab} index={2}>
          {userProfile.following && userProfile.following.length > 0 ? (
            <Box>
              {userProfile.following.map((followingUser) => (
                <Box key={followingUser._id} sx={{ display: 'flex', alignItems: 'center', py: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Avatar 
                    src={followingUser.profilePic || followingUser.profilePicture} // Try both fields
                    sx={{ mr: 2 }}
                    alt={followingUser.username}
                  >
                    {followingUser.username?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                  <Typography variant="body1" fontWeight="medium">
                    {followingUser.username || 'Unknown User'}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Not Following Anyone
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userProfile.username} isn't following anyone yet.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default UserProfilePage;