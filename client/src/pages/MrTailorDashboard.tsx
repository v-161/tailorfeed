import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  Tag,
  Insights,
  Psychology,
  EmojiObjects,
} from '@mui/icons-material';
import AIChatBot from 'src/components/ai/AIChatBot';

interface MrTailorDashboardProps {
  user: any;
  posts: any[];
  allPosts: any[];
}

const MrTailorDashboard: React.FC<MrTailorDashboardProps> = ({ user, posts, allPosts }) => {
  const [userStats, setUserStats] = useState({
    totalLikes: 0,
    engagementRate: 0,
  });
  const [userInterests, setUserInterests] = useState<{ tag: string; count: number }[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [aiTips, setAiTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Compute user stats in real time ---
  useEffect(() => {
    if (!posts || posts.length === 0) {
      setLoading(false);
      return;
    }

    const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    const engagementRate = Math.round((totalLikes / (posts.length * 10)) * 100); // Simple heuristic
    setUserStats({ totalLikes, engagementRate });

    // Collect tag frequency
    const tagCounts: Record<string, number> = {};
    posts.forEach(post => {
      (post.tags || []).forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort tags by count
    const sortedInterests = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag, count]) => ({ tag, count }))
      .slice(0, 5);

    setUserInterests(sortedInterests);
    setLoading(false);
  }, [posts]);

  // --- Generate recommendations based on global post trends ---
  useEffect(() => {
    if (!allPosts || allPosts.length === 0) return;

    const globalTagCounts: Record<string, number> = {};
    allPosts.forEach(post => {
      (post.tags || []).forEach((tag: string) => {
        globalTagCounts[tag] = (globalTagCounts[tag] || 0) + 1;
      });
    });

    const trendingTags = Object.entries(globalTagCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag]) => tag)
      .slice(0, 5);

    setRecommendations(trendingTags);
  }, [allPosts]);

  // --- Handle new tips coming from AIChatBot ---
  const handleNewTip = (tip: any) => {
    setAiTips(prev => [tip, ...prev].slice(0, 5)); // Keep latest 5 tips
  };

  // --- Memoized data for performance ---
  const displayInterests = useMemo(() => userInterests || [], [userInterests]);
  const displayRecommendations = useMemo(() => recommendations || [], [recommendations]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
        Welcome back, {user?.name || 'User'} 👋
      </Typography>

      <Grid container spacing={3}>
        {/* Engagement Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Insights color="primary" />
                <Typography variant="h6">Engagement Overview</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body1" sx={{ mb: 1 }}>
                Total Posts: {posts.length}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Total Likes: {userStats.totalLikes}
              </Typography>
              <Typography variant="body1">
                Engagement Rate: {userStats.engagementRate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Interests */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Psychology color="secondary" />
                <Typography variant="h6">Your Interests 🤖</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              {displayInterests.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {displayInterests.map((interest) => (
                    <Chip
                      key={interest.tag}
                      label={`#${interest.tag} (${interest.count})`}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No interests detected yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Trending Recommendations */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="success" />
                <Typography variant="h6">Trending Tags 🔥</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              {displayRecommendations.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {displayRecommendations.map((tag) => (
                    <Chip key={tag} label={`#${tag}`} color="success" variant="outlined" />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No trending tags available.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* AI Tips */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiObjects color="warning" />
                <Typography variant="h6">AI Tips & Suggestions 💡</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              {aiTips.length > 0 ? (
                <List>
                  {aiTips.map((tip) => (
                    <ListItem key={tip.id}>
                      <ListItemText
                        primary={tip.title}
                        secondary={tip.message}
                        secondaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No AI tips yet — chat with Mr. Tailor below to get personalized insights!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* AI Chatbot */}
        <Grid item xs={12} md={6}>
          <AIChatBot
            userPosts={posts}
            userInterests={userInterests}
            userStats={userStats}
            allPosts={allPosts}
            onNewTip={handleNewTip}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MrTailorDashboard;
