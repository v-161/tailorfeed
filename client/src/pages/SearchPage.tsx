import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Typography, Paper, List, ListItem, ListItemText,
  ListItemIcon, Avatar, Chip, Button, IconButton
} from '@mui/material';
import {
  Search, TrendingUp, Person, Tag, History, Clear,
  SmartToy, Explore, Refresh
} from '@mui/icons-material';
import { useSearchContext } from '../contexts/SearchContext';
import { useDataContext } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Post as PostType } from '../contexts/PostContext';

// Simple Post component for search results
interface PostProps {
  post: PostType;
  onLike: () => void;
  onUserClick: (userId: string) => void;
}

const Post: React.FC<PostProps> = ({ post, onLike, onUserClick }) => {
  const username = post.username || 'Unknown User';
  const profilePicture = post.profilePicture || post.profilePic || 'https://placehold.co/100x100/60A5FA/ffffff?text=U';
  const firstLetter = username[0]?.toUpperCase() || 'U';

  // ✅ FIX: Check if userId exists before allowing click
  const handleUserClick = () => {
    if (post.userId) {
      onUserClick(post.userId);
    } else {
      console.error('❌ Cannot navigate: post.userId is missing', post);
    }
  };

  return (
    <Box sx={{ p: 2, mb: 2, border: '1px solid #ccc', borderRadius: 2 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 1,
          cursor: post.userId ? 'pointer' : 'default' // ✅ Only show pointer if userId exists
        }}
        onClick={handleUserClick}
      >
        <Avatar 
          src={profilePicture} 
          sx={{ width: 32, height: 32, mr: 1 }}
        >
          {firstLetter}
        </Avatar>
        <Typography variant="subtitle2" fontWeight="bold">
          {username}
        </Typography>
        {!post.userId && (
          <Typography variant="caption" color="error" sx={{ ml: 1 }}>
            (No profile)
          </Typography>
        )}
      </Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {post.caption}
      </Typography>
      {post.tags && post.tags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {post.tags.map((tag, index) => (
            <Typography key={index} variant="caption" color="primary.main">
              #{tag}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
};

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    searchQuery,
    searchResults,
    recentSearches,
    trendingTags,
    suggestedUsers,
    setSearchQuery,
    performSearch,
    clearSearch,
    addToRecentSearches,
    loading,
    fetchTrendingData
  } = useSearchContext();

  const { userPreferences } = useDataContext();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'users' | 'tags'>('all');
  const [localQuery, setLocalQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 🎯 ADD: Manual refresh function
  const handleRefreshSuggestions = async () => {
    setRefreshing(true);
    try {
      await fetchTrendingData();
      console.log('✅ Refreshed suggestions based on current preferences');
    } catch (error) {
      console.error('Failed to refresh suggestions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Single source of truth for debouncing
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Proper debouncing with cleanup
  useEffect(() => {
    if (localQuery.trim() === '') {
      performSearch('');
      return;
    }

    const handler = setTimeout(() => {
      console.log('🔍 Performing search for:', localQuery);
      performSearch(localQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [localQuery, performSearch]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocalQuery(query);
  };

  const handleQuickSearch = (query: string) => {
    setLocalQuery(query);
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    clearSearch();
  };

  const handleLikePost = async (postId: string) => {
    console.log('Liked post:', postId);
  };

  // ✅ FIXED: Use userId directly from the object
  const handleUserClick = (userId: string) => {
    console.log('🎯 Navigating to profile for user:', userId);
    navigate(`/profile/${userId}`);
  };

  const hasResults = searchResults.posts.length > 0 || 
                     searchResults.users.length > 0 || 
                     searchResults.tags.length > 0;

  // AI-powered search suggestions based on user preferences
  const aiSuggestions = userPreferences?.slice(0, 3) || [];

  // Safe user rendering function
  const renderUserItem = (user: any) => {
    const username = user.username || 'Unknown User';
    const profilePicture = user.profilePicture || user.avatar || user.profilePic || 'https://placehold.co/100x100/60A5FA/ffffff?text=U';
    const firstLetter = username[0]?.toUpperCase() || 'U';

    return (
      <ListItem 
        key={user._id} 
        sx={{ 
          px: 0, 
          py: 1,
          cursor: 'pointer'
        }}
        onClick={() => handleUserClick(user._id)}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          <Avatar src={profilePicture} sx={{ bgcolor: 'primary.main' }}>
            {firstLetter}
          </Avatar>
        </ListItemIcon>
        <ListItemText 
          primary={<Typography fontWeight="medium">{username}</Typography>}
          secondary={`@${username.toLowerCase()}`}
        />
      </ListItem>
    );
  };

  // Suggested users rendering function
  const renderSuggestedUser = (user: any) => {
    const username = user.username || 'Unknown User';
    const profilePicture = user.profilePicture || user.avatar || user.profilePic || 'https://placehold.co/100x100/60A5FA/ffffff?text=U';
    const firstLetter = username[0]?.toUpperCase() || 'U';

    return (
      <ListItem 
        key={user._id} 
        sx={{ 
          px: 0, 
          py: 1,
          cursor: 'pointer'
        }}
        onClick={() => handleUserClick(user._id)}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          <Avatar src={profilePicture} sx={{ bgcolor: 'primary.main' }}>
            {firstLetter}
          </Avatar>
        </ListItemIcon>
        <ListItemText 
          primary={<Typography fontWeight="medium">{username}</Typography>}
          secondary={`@${username.toLowerCase()}`}
        />
      </ListItem>
    );
  };

  return (
    <Box sx={{ p: 2, pb: 8, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.dark' }}>
        <Explore fontSize="inherit" /> Explore
      </Typography>

      {/* Search Header */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search users, tags, posts..."
          value={localQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: localQuery && (
              <IconButton onClick={handleClearSearch} size="small">
                <Clear />
              </IconButton>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              fontSize: '1.1rem',
              boxShadow: 2
            }
          }}
        />
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Searching...
          </Typography>
        </Box>
      )}

      {/* Search Results */}
      {!loading && localQuery && hasResults && (
        <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
          {/* Results Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', overflowX: 'auto' }}>
              {[
                { key: 'all' as const, label: `All (${searchResults.posts.length + searchResults.users.length + searchResults.tags.length})` },
                { key: 'posts' as const, label: `Posts (${searchResults.posts.length})` },
                { key: 'users' as const, label: `Users (${searchResults.users.length})` },
                { key: 'tags' as const, label: `Tags (${searchResults.tags.length})` }
              ].map(tab => (
                <Button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  sx={{
                    borderRadius: 0,
                    borderBottom: activeTab === tab.key ? 3 : 0,
                    borderColor: 'primary.main',
                    color: activeTab === tab.key ? 'primary.main' : 'text.secondary',
                    fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                    minWidth: 'auto',
                    px: 3,
                    py: 1.5,
                    textTransform: 'none'
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Results Content */}
          <Box sx={{ p: 2 }}>
            {/* ✅ FIXED: Posts Results - Use userId directly from post */}
            {(activeTab === 'all' || activeTab === 'posts') && searchResults.posts.map((item: any) => {
              const handlePostUserClick = () => {
                // ✅ FIX: Use the userId directly from the post object
                if (item.userId) {
                  console.log('✅ Navigating to profile for user ID:', item.userId);
                  navigate(`/profile/${item.userId}`);
                } else {
                  console.error('❌ No userId found in post:', item);
                  console.log('🔍 Full post object:', item);
                }
              };

              return (
                <Post 
                  key={item._id || item.id} 
                  post={item} 
                  onLike={() => handleLikePost(item._id || item.id)}
                  onUserClick={handlePostUserClick}
                />
              );
            })}

            {/* Users Results */}
            {(activeTab === 'all' || activeTab === 'users') && searchResults.users.map(renderUserItem)}

            {/* Tags Results */}
            {(activeTab === 'all' || activeTab === 'tags') && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {searchResults.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={`#${tag}`}
                    variant="outlined"
                    onClick={() => handleQuickSearch(tag)}
                    clickable
                    icon={<Tag sx={{ width: 18, height: 18 }} />}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* No Results */}
      {!loading && localQuery && !hasResults && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No results found for "{localQuery}"
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try searching with different keywords or explore trending topics below.
          </Typography>
        </Paper>
      )}

      {/* Discovery Section (Shows when no search) */}
      {!loading && !localQuery && (
        <Box>
          {/* AI Suggested Users Section */}
          {suggestedUsers && suggestedUsers.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                  <SmartToy color="primary" />
                  Suggested Users
                </Typography>
                <Button 
                  size="small" 
                  onClick={handleRefreshSuggestions}
                  disabled={refreshing}
                  startIcon={<Refresh />}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                People who post about your interests: {userPreferences.join(', ')}
              </Typography>
              <List sx={{ py: 0 }}>
                {suggestedUsers.map(renderSuggestedUser)}
              </List>
            </Paper>
          )}

          {/* Mr. Tailor AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                <SmartToy color="primary" />
                Mr. Tailor Suggestions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Based on your interests, you might like:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {aiSuggestions.map((tag, index) => (
                  <Chip
                    key={index}
                    label={`#${tag}`}
                    color="primary"
                    onClick={() => handleQuickSearch(tag)}
                    clickable
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <History />
                Recent Searches
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {recentSearches.map((search, index) => (
                  <Chip
                    key={index}
                    label={search}
                    variant="outlined"
                    onClick={() => handleQuickSearch(search)}
                    onDelete={() => { /* Placeholder for actual removal logic */ }}
                    deleteIcon={<Clear />}
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Trending Tags */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="success" />
              Trending Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {trendingTags.map((tag, index) => (
                <Chip
                  key={index}
                  label={`#${tag}`}
                  variant="filled"
                  color="secondary"
                  onClick={() => handleQuickSearch(tag)}
                  clickable
                  sx={{ fontSize: '0.9rem' }}
                />
              ))}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default SearchPage;
