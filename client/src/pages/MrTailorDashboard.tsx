import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Card, CardContent, Chip,
  Button, LinearProgress, List, ListItem, ListItemText,
  ListItemIcon, Switch, FormControlLabel, Divider,
  Accordion, AccordionSummary, AccordionDetails, CircularProgress, Alert
} from '@mui/material';
import {
  SmartToy, Analytics, Psychology, TrendingUp,
  Favorite, Tag, Schedule, ExpandMore,
  TipsAndUpdates, Settings, Visibility, Refresh, Warning
} from '@mui/icons-material';
import { useDataContext } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { RecommendationEngine } from '../components/ai/RecommendationEngine';
import MrTailorSurvey from '../components/ai/MrTailorSurvey';
import { aiService, UserInterest } from '../services/aiService';
import { aiAnalyticsService, AITip } from '../services/AIAnalyticsService';

// 🎯 FIXED: Corrected interfaces to match backend response
interface RecommendedPost {
  _id: string;
  caption: string;
  tags: string[];
  imageUrl?: string;
  userId: {
    username: string;
    profilePic?: string;
  };
  recommendationScore: number;
  matchingTags: string[];
  reason: string;
}

interface Post {
  id: string;
  userId: string;
  username: string;
  caption: string;
  tags: string[];
  likes: string[] | number;
  comments: any[] | number;
  createdAt: Date;
  imageUrl: string;
}

// 🎯 FIXED: Simplified interface to match actual backend response
interface DisplayInterest {
  tag: string;
  score: number;
  interactionCount: number;
  category: string;
  lastInteracted?: string;
}

// 🎯 FIXED: API Response interfaces
interface AIInterestsResponse {
  success: boolean;
  interests: DisplayInterest[];
  message?: string;
}

interface AIRecommendationsResponse {
  success: boolean;
  posts: RecommendedPost[];
  userInterests?: DisplayInterest[];
  message?: string;
}

const MrTailorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { user, posts: contextPosts, userPreferences, userStats, addUserPreference, removeUserPreference, fetchUserData } = useDataContext();
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    personalizedFeed: true,
    smartNotifications: true,
    learningFromEngagement: true,
    weeklyInsights: true
  });

  const [userInterests, setUserInterests] = useState<DisplayInterest[]>([]);
  const [recommendedPosts, setRecommendedPosts] = useState<RecommendedPost[]>([]);
  const [aiTips, setAiTips] = useState<AITip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Safe user stats access
  const safeUserStats = {
    totalLikes: userStats?.totalLikes || 0,
    totalPosts: userStats?.totalPosts || 0,
    totalComments: userStats?.totalComments || 0,
    engagementRate: userStats?.engagementRate || 0,
    topTags: userStats?.topTags || [],
    joinDate: userStats?.joinDate || new Date().toISOString()
  };

  // 🎯 FIXED: Create a global refresh function with proper dependencies
  const refreshAIData = useCallback(async () => {
    console.log('🔄 Manually refreshing AI data...');
    setRefreshing(true);
    setApiError(null);
    await loadAIData();
  }, [currentUser?._id, userPreferences.length]); // Added dependencies

  // Make refresh function available globally for Post component
  useEffect(() => {
    (window as any).refreshAIData = refreshAIData;
    
    return () => {
      (window as any).refreshAIData = undefined;
    };
  }, [refreshAIData]);

  // 🎯 FIXED: Simplified data loading - only load when user changes
  useEffect(() => {
    if (currentUser?._id) {
      console.log('🎯 Initializing Mr. Tailor Dashboard for user:', currentUser._id);
      loadAIData();
    }
  }, [currentUser?._id]);

  // 🎯 FIXED: Single synchronization effect
  useEffect(() => {
    if (userPreferences.length > 0 && userInterests.length > 0) {
      console.log('🔄 Syncing AI interests with user preferences');
      
      // Filter AI interests to only include current user preferences
      const filteredInterests = userInterests.filter(interest => 
        userPreferences.includes(interest.tag)
      );
      
      if (filteredInterests.length !== userInterests.length) {
        console.log('🔄 Filtered out interests not in user preferences:', {
          before: userInterests.length,
          after: filteredInterests.length
        });
        setUserInterests(filteredInterests);
      }
    }
  }, [userPreferences, userInterests]);

  const loadAIData = async () => {
    if (!currentUser) {
      console.log('❌ No current user');
      return;
    }
    
    try {
      setLoading(true);
      setApiError(null);
      console.log('🚀 Loading AI data for user:', currentUser._id);
      console.log('📋 Current userPreferences:', userPreferences);
      
      // Test if we have a token
      const token = localStorage.getItem('token');
      console.log('🔐 Token exists:', !!token);
      
      // 🎯 FIXED: Load user interests from AI backend with proper typing
      let interestsResponse: AIInterestsResponse;
      try {
        interestsResponse = await aiService.getUserInterests() as AIInterestsResponse;
        console.log('📊 AI Interests Response:', interestsResponse);
      } catch (error) {
        console.error('❌ Failed to fetch AI interests:', error);
        interestsResponse = { success: false, interests: [] };
      }
      
      if (interestsResponse.success && interestsResponse.interests && interestsResponse.interests.length > 0) {
        console.log('✅ Raw AI Interests:', interestsResponse.interests);
        
        const aiInterests = interestsResponse.interests;
        
        // 🎯 FIXED: Always use userPreferences as source of truth
        if (userPreferences.length > 0) {
          // Filter AI interests to match user preferences
          const filteredInterests = aiInterests.filter(interest => 
            userPreferences.includes(interest.tag)
          );
          console.log('✅ Filtered AI interests by userPreferences:', {
            original: aiInterests.length,
            filtered: filteredInterests.length
          });
          setUserInterests(filteredInterests);
        } else {
          // No userPreferences yet - use AI interests and sync them
          console.log('🔄 No userPreferences found, using AI interests');
          setUserInterests(aiInterests);
          
          // Sync AI interests to user preferences
          const tagsToAdd = aiInterests.map(interest => interest.tag);
          console.log('🔄 Syncing AI interests to user preferences:', tagsToAdd);
          for (const tag of tagsToAdd) {
            await addUserPreference(tag);
          }
        }
      } else {
        console.log('⚠️ AI Interests empty or failed, using engagement-based interests');
        generateInterestsFromEngagement();
      }

      // 🎯 FIXED: Load recommendations with proper typing
      try {
        const recommendationsResponse = await aiService.getRecommendations() as AIRecommendationsResponse;
        if (recommendationsResponse.success && recommendationsResponse.posts) {
          setRecommendedPosts(recommendationsResponse.posts);
          console.log('✅ Loaded recommended posts:', recommendationsResponse.posts.length);
        }
      } catch (error) {
        console.error('❌ Failed to load recommendations:', error);
      }

      // Generate AI tips
      await generateAITips();

    } catch (error: any) {
      console.error('💥 Error loading AI data:', error);
      setApiError('AI service temporarily unavailable. Using engagement data.');
      generateInterestsFromEngagement();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Generate interests from actual user engagement
  const generateInterestsFromEngagement = () => {
    const userId = currentUser?._id;
    if (!userId) {
      console.log('❌ No user ID for engagement analysis');
      return;
    }

    const userLikedPosts = contextPosts.filter(post => {
      return Array.isArray(post.likes) && post.likes.includes(userId);
    });

    console.log('🔍 Found liked posts for engagement analysis:', userLikedPosts.length);

    // Extract interests from liked posts' tags
    const interestsFromLikes = userLikedPosts.flatMap(post => post.tags || []);
    const interestFrequency: { [key: string]: number } = {};
    
    interestsFromLikes.forEach(tag => {
      if (tag && tag.trim()) {
        interestFrequency[tag] = (interestFrequency[tag] || 0) + 1;
      }
    });

    // Convert to DisplayInterest format
    const generatedInterests: DisplayInterest[] = Object.entries(interestFrequency)
      .map(([tag, count]) => ({
        tag,
        score: Math.min(count * 2, 10),
        interactionCount: count,
        category: 'engagement'
      }))
      .sort((a, b) => b.score - a.score);

    if (generatedInterests.length > 0) {
      console.log('🎯 Generated interests from engagement:', generatedInterests);
      setUserInterests(generatedInterests);
      
      // Add engagement interests to user preferences
      const tagsToAdd = generatedInterests.map(interest => interest.tag);
      console.log('🔄 Adding engagement interests to user preferences:', tagsToAdd);
      tagsToAdd.forEach(tag => {
        addUserPreference(tag);
      });
    } else {
      console.log('📝 No engagement data found');
      setUserInterests([]);
    }
  };

  // 🎯 FIXED: Enhanced AI tips generation
  const generateAITips = async () => {
    try {
      const userId = currentUser?._id;
      if (!userId) return;

      // Filter user's own posts
      const userPosts = contextPosts.filter(post => post.userId === userId);
      
      const tips = await aiAnalyticsService.generateAITips(
        userPosts,
        contextPosts,
        userInterests,
        safeUserStats
      );
      setAiTips(tips);
      console.log('💡 Generated AI tips:', tips.length);
    } catch (error) {
      console.error('Error generating AI tips:', error);
      // Fallback tips
      setAiTips([{
        id: 'error-tip',
        title: 'Tips Coming Soon',
        message: 'We\'re analyzing your content to provide personalized tips.',
        type: 'engagement',
        priority: 'low'
      }]);
    }
  };

  // 🎯 FIXED: Calculate AI confidence based on available data
  const calculateAIConfidence = () => {
    if (userInterests.length === 0) return 0;

    const totalScore = userInterests.reduce((sum, interest) => {
      return sum + (interest.score / 10); // Convert 0-10 scale to 0-1
    }, 0);
    
    const avgScore = totalScore / userInterests.length;
    const interactionCount = userInterests.reduce((sum, interest) => sum + interest.interactionCount, 0);
    
    // Convert to percentage (0-100%)
    const scoreBased = avgScore * 70; // 70% weight for scores
    const interactionBased = Math.min((interactionCount / 20) * 30, 30); // 30% weight for interactions
    
    return Math.min(scoreBased + interactionBased, 100);
  };

  const aiConfidence = calculateAIConfidence();

  // 🎯 FIXED: Get display interests - always filtered by userPreferences
  const displayInterests: DisplayInterest[] = userInterests.filter(interest => 
    userPreferences.includes(interest.tag)
  );

  // 🎯 FIXED: Function to remove user preference with proper state sync
  const handleRemovePreference = async (tag: string) => {
    try {
      console.log('🗑️ Removing preference:', tag);
      const success = await removeUserPreference(tag);
      
      if (success) {
        // Update both AI interests state
        setUserInterests(prev => prev.filter(interest => interest.tag !== tag));
        console.log('✅ Preference removed and UI updated:', tag);
      }
    } catch (error) {
      console.error('Failed to remove preference:', error);
    }
  };

  // 🎯 FIXED: Survey submission with proper tag extraction
  const handleSurveySubmit = async (responses: any[]) => {
    try {
      console.log('📝 Submitting survey responses:', responses);
      const result = await aiService.submitSurvey(responses);
      
      if (result.success) {
        console.log('✅ Survey submitted successfully');
        
        // Extract tags from survey responses
        const surveyTags: string[] = [];
        responses.forEach(response => {
          if (response.answer && typeof response.answer === 'string') {
            // Simple tag extraction - look for topic words
            const answer = response.answer.toLowerCase();
            if (answer.includes('interested') || answer.includes('like') || answer.includes('love')) {
              // Extract the topic from the question
              const question = response.question.toLowerCase();
              const topicMatch = question.match(/in\s+(\w+)/) || question.match(/about\s+(\w+)/);
              if (topicMatch && topicMatch[1]) {
                surveyTags.push(topicMatch[1]);
              }
            }
          }
        });

        // Add unique tags to preferences
        const uniqueTags = [...new Set(surveyTags)].filter(tag => tag.length > 2).slice(0, 5);
        console.log('🔄 Adding survey tags to preferences:', uniqueTags);
        
        for (const tag of uniqueTags) {
          await addUserPreference(tag);
        }
        
        await refreshAIData(); // Reload AI data after survey
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
    }
  };

  const handleSettingChange = (setting: keyof typeof aiSettings) => {
    setAiSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleAddPreference = async (tag: string) => {
    try {
      await addUserPreference(tag);
      await refreshAIData(); // Refresh after adding preference
    } catch (error) {
      console.error('Failed to add preference:', error);
    }
  };

  // Convert posts for frontend engine
  const posts = contextPosts.map(post => ({
    id: post._id,
    userId: post.userId,
    username: post.username,
    caption: post.caption,
    tags: post.tags || [],
    likes: post.likes || [],
    comments: post.comments || [],
    createdAt: new Date(post.createdAt),
    imageUrl: post.imageUrl || 'https://placehold.co/600x400/CCCCCC/333333?text=No+Image'
  }));

  const engagementPattern = RecommendationEngine.getUserEngagementPattern(posts, currentUser?._id || user?._id || '');
  const recommendedTags = RecommendationEngine.getTopRecommendedTags(userPreferences, posts);

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SmartToy sx={{ fontSize: 48 }} />
          <Box>
            <Typography variant="h3" fontWeight="bold">
              Mr. Tailor AI
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Your Personal Content Assistant
            </Typography>
            {loading && (
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                🤖 Loading AI insights...
              </Typography>
            )}
          </Box>
        </Box>
        <Typography variant="body1">
          {userPreferences.length > 0 
            ? `Tracking ${userPreferences.length} interests with ${Math.round(aiConfidence)}% accuracy!`
            : "Start interacting with posts to help me understand your preferences!"
          }
        </Typography>
      </Paper>

      {/* API Error Alert */}
      {apiError && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={refreshAIData}>
              Retry
            </Button>
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning />
            {apiError}
          </Box>
        </Alert>
      )}

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Left Column - Insights */}
        <Box sx={{ flex: 2 }}>
          {/* AI Confidence Score */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Analytics />
                  AI Understanding Level
                </Typography>
                <Button 
                  startIcon={<Refresh />} 
                  onClick={refreshAIData}
                  disabled={refreshing}
                  size="small"
                >
                  {refreshing ? <CircularProgress size={20} /> : 'Refresh'}
                </Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={aiConfidence} 
                  sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                />
                <Typography variant="h6" fontWeight="bold">
                  {Math.round(aiConfidence)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {aiConfidence < 30 && "I'm just getting to know you. Like more posts to improve recommendations!"}
                {aiConfidence >= 30 && aiConfidence < 70 && "I'm learning your style! Keep engaging for better personalization."}
                {aiConfidence >= 70 && "Excellent! I have a strong understanding of your preferences."}
              </Typography>
            </CardContent>
          </Card>

          {/* Your Interests */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Psychology />
                Your Interests {userInterests.length > 0 && "🤖"}
              </Typography>
              
              {displayInterests.length > 0 ? (
                <Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {displayInterests.slice(0, 12).map((interest, index) => (
                      <Chip
                        key={interest.tag}
                        label={`#${interest.tag}`}
                        color="primary"
                        variant="filled"
                        onDelete={() => handleRemovePreference(interest.tag)}
                        deleteIcon={<Visibility />}
                        title={`Score: ${interest.score} | Interactions: ${interest.interactionCount}`}
                      />
                    ))}
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    Tracking {displayInterests.length} interests with {displayInterests.reduce((sum, i) => sum + i.interactionCount, 0)} total interactions
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No interests tracked yet. Start by liking posts or taking our survey!
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<SmartToy />}
                  onClick={() => setSurveyOpen(true)}
                >
                  Update Preferences
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Rest of your component remains the same... */}
          {/* Engagement Insights */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp />
                Engagement Insights
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                  <Favorite color="primary" />
                  <Typography variant="h6" fontWeight="bold">{safeUserStats.totalLikes}</Typography>
                  <Typography variant="body2">Likes Given</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', flex: 1 }}>
                  <Tag color="secondary" />
                  <Typography variant="h6" fontWeight="bold">{displayInterests.length}</Typography>
                  <Typography variant="body2">Interests</Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>

          {/* Enhanced AI Tips Section */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TipsAndUpdates />
                AI Optimization Tips
              </Typography>
              <List>
                {aiTips.map((tip) => (
                  <ListItem 
                    key={tip.id}
                    sx={{
                      borderLeft: `4px solid ${
                        tip.priority === 'high' ? '#f44336' : 
                        tip.priority === 'medium' ? '#ff9800' : '#4caf50'
                      }`,
                      mb: 1,
                      backgroundColor: 'background.default',
                      borderRadius: 1
                    }}
                  >
                    <ListItemIcon>
                      <TipsAndUpdates 
                        color={
                          tip.priority === 'high' ? 'error' : 
                          tip.priority === 'medium' ? 'warning' : 'success'
                        } 
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="medium">
                          {tip.title}
                        </Typography>
                      }
                      secondary={tip.message}
                    />
                  </ListItem>
                ))}
                {aiTips.length === 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <TipsAndUpdates color="disabled" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="No tips available yet"
                      secondary="Start posting and engaging to get personalized optimization tips."
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Right Column - Controls & Recommendations */}
        <Box sx={{ flex: 1 }}>
          {/* AI Settings */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings />
                AI Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                (default all enabled, disabling will be enabled in future patches)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={aiSettings.personalizedFeed}
                      onChange={() => handleSettingChange('personalizedFeed')}
                    />
                  }
                  label="Personalized Feed"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={aiSettings.smartNotifications}
                      onChange={() => handleSettingChange('smartNotifications')}
                    />
                  }
                  label="Smart Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={aiSettings.learningFromEngagement}
                      onChange={() => handleSettingChange('learningFromEngagement')}
                    />
                  }
                  label="Learn from Engagement"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={aiSettings.weeklyInsights}
                      onChange={() => handleSettingChange('weeklyInsights')}
                    />
                  }
                  label="Weekly Insights"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Recommended Tags */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tag />
                Explore New Tags
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                (will be enabled in future patches)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {recommendedTags.slice(0, 8).map((tag, index) => (
                  <Chip
                    key={index}
                    label={`#${tag}`}
                    variant="outlined"
                    onClick={() => handleAddPreference(tag)}
                    clickable
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Active Hours */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule />
                Your Active Hours
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Based on your posting patterns
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {engagementPattern.activeHours.slice(0, 6).map(hour => (
                  <Chip
                    key={hour}
                    label={`${hour}:00`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* FAQ Section */}
      <Accordion sx={{ mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">How Mr. Tailor Works</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            <strong>Mr. Tailor AI</strong> uses machine learning to understand your content preferences and engagement patterns.
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>Tag Analysis:</strong> Learns from posts you like and engage with
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>Behavior Patterns:</strong> Analyzes when and how you use the app
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>Smart Recommendations:</strong> Suggests content you're likely to enjoy
          </Typography>
          <Typography variant="body2">
            Your data is always private and secure. We never share your personal information.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Survey Dialog */}
      <MrTailorSurvey 
        open={surveyOpen} 
        onClose={() => setSurveyOpen(false)}
        onSubmit={handleSurveySubmit}
      />
    </Box>
  );
};

export default MrTailorDashboard;
