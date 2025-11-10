import React from 'react';
import { Container, Typography, Box, CircularProgress, Alert, Button } from '@mui/material';
import { usePosts } from '../contexts/PostContext';
import { useAuth } from '../contexts/AuthContext';
import { useDataContext } from '../contexts/DataContext';
import Header from '../components/common/Header';
import Post from '../components/posts/Post';

const HomePage: React.FC = () => {
  const { posts, isLoading, error } = usePosts();
  const { currentUser } = useAuth();
  const { following } = useDataContext(); // Fixed: using 'following' not 'userData'

  // Filter posts to show only from followed users + your own posts
  const filteredPosts = React.useMemo(() => {
    if (!currentUser || !following) return [];
    
    return posts.filter(post => {
      // Show your own posts
      if (post.userId === currentUser._id) return true;
      
      // Show posts from users you follow
      return following.includes(post.userId);
    });
  }, [posts, currentUser, following]);

  // Debug: Check what's being filtered
  React.useEffect(() => {
    console.log('🏠 HomePage Debug:');
    console.log('Current User ID:', currentUser?._id);
    console.log('Following:', following);
    console.log('Total Posts:', posts.length);
    console.log('Filtered Posts:', filteredPosts.length);
    
    if (filteredPosts.length > 0) {
      console.log('Filtered Post Users:', filteredPosts.map(p => ({
        id: p._id,
        userId: p.userId,
        username: p.username,
        isMyPost: p.userId === currentUser?._id,
        isFollowing: following?.includes(p.userId)
      })));
    }
  }, [posts, filteredPosts, currentUser, following]);

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
        sx={{ bgcolor: 'background.default' }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="sm" sx={{ pt: 3, pb: 8 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="bold" 
          sx={{ 
            mb: 4, 
            textAlign: 'center'
          }}
        >
          TailorFeed
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {filteredPosts.length === 0 ? (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              {posts.length === 0 
                ? "No posts yet! Be the first to create content using the '+' button in the header."
                : "No posts from users you follow. Start following people to see their content here!"
              }
            </Alert>
            {posts.length > 0 && (
              <Button 
                variant="outlined" 
                href="/search"
                sx={{ mt: 1 }}
              >
                Discover People to Follow
              </Button>
            )}
          </Box>
        ) : (
          <Box>
            {filteredPosts.map((post) => (
              <Post key={post._id} post={post} />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default HomePage;