import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Avatar, Paper, Card, CardContent,
  CardMedia, IconButton, Button, Tab, Tabs, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, CircularProgress
} from '@mui/material';
import {
  Edit, PhotoCamera,
  Favorite, ChatBubbleOutline
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useDataContext } from '../contexts/DataContext';
import { usePosts } from '../contexts/PostContext';
import { useNavigate } from 'react-router-dom';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const { user, userStats, followers, following } = useDataContext();
  const { posts } = usePosts();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [loadingLikedPosts, setLoadingLikedPosts] = useState(false);
  
  // Use actual user data from backend instead of local state
  const [profileData, setProfileData] = useState({
    username: '',
    bio: 'Digital creator • Photography enthusiast • Coffee lover',
    website: 'https://example.com',
    isPrivate: false,
    profilePicture: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Initialize profile data from currentUser when it loads
  useEffect(() => {
    if (currentUser) {
      setProfileData(prev => ({
        ...prev,
        username: currentUser.username || '',
        profilePicture: currentUser.profilePicture || '',
        bio: currentUser.bio || 'Digital creator • Photography enthusiast • Coffee lover',
        website: currentUser.website || 'https://example.com'
      }));
    }
  }, [currentUser]);

  // Fetch liked posts when Liked tab is active
  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (activeTab === 1 && currentUser) {
        setLoadingLikedPosts(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/posts/liked`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setLikedPosts(data.posts || []);
          } else {
            console.error('Failed to fetch liked posts');
            setLikedPosts([]);
          }
        } catch (error) {
          console.error('Error fetching liked posts:', error);
          setLikedPosts([]);
        } finally {
          setLoadingLikedPosts(false);
        }
      }
    };

    fetchLikedPosts();
  }, [activeTab, currentUser, API_URL]);

  // Alternative: Get liked posts from existing posts data (if posts contain like information)
  useEffect(() => {
    if (activeTab === 1 && currentUser && posts.length > 0) {
      // Filter posts that the current user has liked
      const userLikedPosts = posts.filter(post => 
        Array.isArray(post.likes) && post.likes.includes(currentUser._id)
      );
      setLikedPosts(userLikedPosts);
    }
  }, [activeTab, currentUser, posts]);

  // Filter posts to show only user's posts
  const userPosts = posts.filter(post => 
    post.userId === currentUser?._id || post.userId === user?._id
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEditProfile = () => {
    setEditDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      console.log('🔄 SENDING TO BACKEND:', {
        username: profileData.username,
        bio: profileData.bio,
        profilePicture: profileData.profilePicture,
        website: profileData.website
      });

      await updateProfile({
        username: profileData.username,
        bio: profileData.bio,
        profilePicture: profileData.profilePicture,
        website: profileData.website
      });
      
      setEditDialogOpen(false);
      alert('Profile updated successfully! Changes saved to database.');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        
        try {
          await updateProfile({ profilePicture: imageUrl });
          setProfileData(prev => ({ ...prev, profilePicture: imageUrl }));
          alert('Profile picture updated successfully!');
        } catch (error) {
          console.error('Failed to update profile picture:', error);
          alert('Failed to update profile picture.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNavigateToSettings = () => {
    navigate('/settings');
  };

  // Safe user stats access
  const safeUserStats = {
    totalPosts: userStats?.totalPosts || userPosts.length,
    totalLikes: userStats?.totalLikes || 0,
    totalComments: userStats?.totalComments || 0,
    engagementRate: userStats?.engagementRate || 0,
    topTags: userStats?.topTags || [],
    joinDate: userStats?.joinDate || new Date().toISOString()
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // Use actual currentUser data for display
  const displayUsername = currentUser?.username || profileData.username;
  const displayProfilePicture = currentUser?.profilePicture || profileData.profilePicture;
  const displayBio = currentUser?.bio || profileData.bio;
  const displayWebsite = currentUser?.website || profileData.website;

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      {/* Profile Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
          {/* Profile Picture with Upload */}
          <Box sx={{ position: 'relative', mr: 3 }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                border: '4px solid',
                borderColor: 'background.paper',
                boxShadow: 2
              }}
              src={displayProfilePicture}
            >
              {displayUsername[0]?.toUpperCase()}
            </Avatar>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="profile-picture-upload"
              type="file"
              onChange={handleProfilePictureChange}
            />
            <label htmlFor="profile-picture-upload">
              <IconButton 
                component="span"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  width: 32,
                  height: 32
                }}
              >
                <PhotoCamera fontSize="small" />
              </IconButton>
            </label>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h4" fontWeight="bold">
                {displayUsername}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Edit />}
                  onClick={handleEditProfile}
                  size="small"
                >
                  Edit Profile
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleNavigateToSettings}
                  size="small"
                >
                  Settings
                </Button>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <Typography variant="body1">
                <strong>{safeUserStats.totalPosts}</strong> posts
              </Typography>
              <Typography variant="body1">
                <strong>{followers.length}</strong> followers
              </Typography>
              <Typography variant="body1">
                <strong>{following.length}</strong> following
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ mb: 1 }}>
              {displayBio}
            </Typography>
            
            {displayWebsite && displayWebsite !== 'https://example.com' && (
              <Typography 
                variant="body2" 
                color="primary" 
                sx={{ textDecoration: 'none', cursor: 'pointer' }}
                component="a"
                href={displayWebsite}
                target="_blank"
                rel="noopener noreferrer"
              >
                {displayWebsite}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Joined {formatJoinDate(safeUserStats.joinDate)}
            </Typography>
          </Box>
        </Box>

        {/* Removed Top Tags section as requested */}
      </Paper>

      {/* Tabs - Removed Saved and Tagged tabs */}
      <Paper>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Posts" />
          <Tab label="Liked" />
        </Tabs>

        {/* Posts Tab */}
        <TabPanel value={activeTab} index={0}>
          {userPosts.length > 0 ? (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2 
            }}>
              {userPosts.map((post) => (
                <Card key={post._id} sx={{ position: 'relative' }}>
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
                          {Array.isArray(post.likes) ? post.likes.length : post.likes}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChatBubbleOutline fontSize="small" />
                        <Typography variant="caption">
                          {Array.isArray(post.comments) ? post.comments.length : post.comments}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PhotoCamera sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Posts Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Share your first photo to get started!
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Liked Posts Tab */}
        <TabPanel value={activeTab} index={1}>
          {loadingLikedPosts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : likedPosts.length > 0 ? (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2 
            }}>
              {likedPosts.map((post) => (
                <Card key={post._id} sx={{ position: 'relative' }}>
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
                          {Array.isArray(post.likes) ? post.likes.length : post.likes}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChatBubbleOutline fontSize="small" />
                        <Typography variant="caption">
                          {Array.isArray(post.comments) ? post.comments.length : post.comments}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Favorite sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Liked Posts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Posts you've liked will appear here. Start liking some posts!
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username"
            value={profileData.username}
            onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Bio"
            multiline
            rows={3}
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Website"
            value={profileData.website}
            onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={profileData.isPrivate}
                onChange={(e) => setProfileData({ ...profileData, isPrivate: e.target.checked })}
              />
            }
            label="Private Account"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveProfile} 
            variant="contained"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;