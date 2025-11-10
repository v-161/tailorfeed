import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Card, CardContent, Chip,
  Button, LinearProgress, List, ListItem, ListItemText,
  ListItemIcon, Switch, FormControlLabel, Divider,
  Accordion, AccordionSummary, AccordionDetails, CircularProgress, Alert,
  Grid, TextField, Avatar, IconButton
} from '@mui/material';
import {
  SmartToy, Analytics, Psychology, TrendingUp,
  Favorite, Tag, Schedule, ExpandMore,
  TipsAndUpdates, Settings, Visibility, Refresh, Warning,
  Send, Person, SmartToy as BotIcon
} from '@mui/icons-material';
import { useDataContext } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { RecommendationEngine } from '../components/ai/RecommendationEngine';
import MrTailorSurvey from '../components/ai/MrTailorSurvey';
import { aiService, UserInterest } from '../services/aiService';
import { aiAnalyticsService, AITip } from '../services/AIAnalyticsService';

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

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Simple AI Chatbot Component
const AIChatBot: React.FC<{
  userPosts: any[];
  userInterests: UserInterest[];
  userStats: any;
  allPosts: any[];
  onNewTip: (tip: AITip) => void;
}> = ({ userPosts, userInterests, userStats, allPosts, onNewTip }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hi! I'm Mr. Tailor AI. I can help you optimize your content strategy and provide personalized tips. Ask me about your posting patterns, engagement, or how to improve!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateResponse = async (userMessage: string): Promise<string> => {
    // Simple rule-based responses - no external API needed
    const userMessageLower = userMessage.toLowerCase();
    
    // Analyze user data for personalized responses
    const postCount = userPosts.length;
    const topInterests = userInterests.slice(0, 3).map(i => i.tag);
    const totalLikes = userStats.totalLikes;
    const engagementRate = userStats.engagementRate;

    if (userMessageLower.includes('hello') || userMessageLower.includes('hi') || userMessageLower.includes('hey')) {
      return "Hello! I'm Mr. Tailor, your personal content assistant. How can I help you with your social media strategy today?";
    }

    if (userMessageLower.includes('post') || userMessageLower.includes('content')) {
      if (postCount === 0) {
        return "I see you haven't posted yet! Starting with 2-3 posts about your interests would help establish your presence. Try sharing content related to your hobbies or expertise!";
      } else if (postCount < 5) {
        return `You've made ${postCount} posts so far. That's a good start! Consider posting more consistently - maybe 2-3 times per week to build momentum.`;
      } else {
        return `Great job with ${postCount} posts! You're building a solid content history. Keep focusing on quality content that aligns with your interests.`;
      }
    }

    if (userMessageLower.includes('interest') || userMessageLower.includes('like') || userMessageLower.includes('preference')) {
      if (topInterests.length > 0) {
        return `Based on your activity, your top interests are: ${topInterests.map(tag => `#${tag}`).join(', ')}. You should create more content around these topics as they resonate well with you!`;
      } else {
        return "I'm still learning about your interests. Try liking more posts or updating your preferences in the survey to help me understand what content you enjoy!";
      }
    }

    if (userMessageLower.includes('engagement') || userMessageLower.includes('like') || userMessageLower.includes('interact')) {
      if (totalLikes > 10) {
        return `You've given ${totalLikes} likes - that's excellent engagement! Your active participation helps me understand your preferences better. Keep interacting with content you enjoy!`;
      } else if (totalLikes > 0) {
        return `You've given ${totalLikes} likes so far. Try engaging with more posts to help me learn your preferences faster!`;
      } else {
        return "Start by liking posts that interest you! This helps me understand your preferences and recommend better content for you.";
      }
    }

    if (userMessageLower.includes('tip') || userMessageLower.includes('advice') || userMessageLower.includes('help')) {
      // Generate a personalized tip based on user data
      let tipText = "";
      
      if (postCount === 0) {
        tipText = "Start by creating your first post! Share something you're passionate about.";
      } else if (topInterests.length > 0) {
        tipText = `Create more content about ${topInterests[0]} - it's one of your strongest interests!`;
      } else if (totalLikes < 5) {
        tipText = "Try engaging with 5-10 posts today to help me understand your preferences better.";
      } else {
        tipText = "Consider posting at different times of day to see when your audience is most active.";
      }

      // Also create a tip for the dashboard
      const newTip: AITip = {
        id: `chatbot-${Date.now()}`,
        title: '💡 Chatbot Suggestion',
        message: tipText,
        type: 'optimization',
        priority: 'medium'
      };
      onNewTip(newTip);

      return `Here's a personalized tip: ${tipText}`;
    }

    if (userMessageLower.includes('tag') || userMessageLower.includes('hashtag')) {
      if (topInterests.length > 0) {
        return `For better reach, use tags like: ${topInterests.map(tag => `#${tag}`).join(', ')} in your posts. These align with your interests and can help connect with like-minded users!`;
      } else {
        return "Popular tags can help your posts get discovered. Try using relevant tags that describe your content and interests.";
      }
    }

    if (userMessageLower.includes('time') || userMessageLower.includes('when') || userMessageLower.includes('schedule')) {
      return "Based on general patterns, posting in the evening (6-9 PM) often gets good engagement. But the best time is when your specific audience is most active!";
    }

    if (userMessageLower.includes('thank') || userMessageLower.includes('thanks')) {
      return "You're welcome! I'm here to help you succeed. Feel free to ask me anything about content strategy or optimization!";
    }

    // Default response for unrecognized queries
    return "I'm here to help with your content strategy! You can ask me about: posting tips, engagement strategies, interest analysis, tag recommendations, or best practices for growing your presence.";
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await generateResponse(inputText);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble processing your request right now. Please try again!",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BotIcon />
            Mr. Tailor Chat
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Your AI Content Assistant
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2, maxHeight: 400 }}>
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1,
                  maxWidth: '70%',
                  flexDirection: message.isUser ? 'row-reverse' : 'row'
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: message.isUser ? 'primary.main' : 'secondary.main'
                  }}
                >
                  {message.isUser ? <Person /> : <BotIcon />}
                </Avatar>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    bgcolor: message.isUser ? 'primary.light' : 'background.default',
                    color: message.isUser ? 'primary.contrastText' : 'text.primary'
                  }}
                >
                  <Typography variant="body2">{message.text}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <BotIcon />
                </Avatar>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    Thinking...
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask me about content strategy..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <IconButton 
              onClick={handleSendMessage} 
              disabled={!inputText.trim() || isLoading}
              color="primary"
            >
              <Send />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Try: "How can I improve my posts?" or "What are my top interests?"
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const MrTailorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { user, posts: contextPosts, userPreferences, userStats, addUserPreference } = useDataContext();
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    personalizedFeed: true,
    smartNotifications: true,
    learningFromEngagement: true,
    weeklyInsights: true
  });

  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [recommendedPosts, setRecommendedPosts] = useState<RecommendedPost[]>([]);
  const [aiTips, setAiTips] = useState<AITip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Add state for chatbot tips
  const [chatbotTips, setChatbotTips] = useState<AITip[]>([]);

  // Safe user stats access
  const safeUserStats = {
    totalLikes: userStats?.totalLikes || 0,
    totalPosts: userStats?.totalPosts || 0,
    totalComments: userStats?.totalComments || 0,
    engagementRate: userStats?.engagementRate || 0,
    topTags: userStats?.topTags || [],
    joinDate: userStats?.joinDate || new Date().toISOString()
  };

  // Add this function to handle new tips from chatbot
  const handleNewChatbotTip = (tip: AITip) => {
    setChatbotTips(prev => [tip, ...prev].slice(0, 3));
  };

  // Create a global refresh function
  const refreshAIData = useCallback(async () => {
    console.log('🔄 Manually refreshing AI data...');
    setRefreshing(true);
    setApiError(null);
    await loadAIData();
  }, []);

  // Make refresh function available globally for Post component
  useEffect(() => {
    (window as any).refreshAIData = refreshAIData;
    
    return () => {
      (window as any).refreshAIData = undefined;
    };
  }, [refreshAIData]);

  // Auto-refresh when component mounts
  useEffect(() => {
    loadAIData();
  }, [currentUser]);

  const loadAIData = async () => {
    if (!currentUser) {
      console.log('❌ No current user');
      return;
    }
    
    try {
      setLoading(true);
      setApiError(null);
      console.log('🚀 Loading AI data for user:', currentUser._id);
      
      // Test if we have a token
      const token = localStorage.getItem('token');
      console.log('🔐 Token exists:', !!token);
      
      // Load user interests from AI backend
      const interestsResponse = await aiService.getUserInterests();
      console.log('📊 AI Interests Response:', interestsResponse);
      
      if (interestsResponse.success && interestsResponse.interests && interestsResponse.interests.length > 0) {
        console.log('✅ Setting AI Interests:', interestsResponse.interests);
        setUserInterests(interestsResponse.interests);
        // Generate tips with actual interests
        await generateAITips(interestsResponse.interests);
      } else {
        console.log('⚠️ AI Interests empty or failed, using engagement-based interests');
        const generatedInterests = generateInterestsFromEngagement();
        // Generate tips with generated interests
        await generateAITips(generatedInterests);
      }

      // Load recommendations
      const recommendationsResponse = await aiService.getRecommendations();
      if (recommendationsResponse.success && recommendationsResponse.data) {
        setRecommendedPosts(recommendationsResponse.data.posts || []);
      }

    } catch (error: any) {
      console.error('💥 Error loading AI data:', error);
      setApiError('AI service temporarily unavailable. Using engagement data.');
      const generatedInterests = generateInterestsFromEngagement();
      // Generate fallback tips
      await generateAITips(generatedInterests);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Generate interests from actual user engagement - FIXED VERSION
  const generateInterestsFromEngagement = (): UserInterest[] => {
    const userLikedPosts = contextPosts.filter(post => {
      const userId = currentUser?._id;
      return userId && Array.isArray(post.likes) && post.likes.includes(userId);
    });

    // Extract interests from liked posts' tags
    const interestsFromLikes = userLikedPosts.flatMap(post => post.tags || []);
    const interestFrequency: { [key: string]: number } = {};
    
    interestsFromLikes.forEach(tag => {
      if (tag) {
        interestFrequency[tag] = (interestFrequency[tag] || 0) + 1;
      }
    });

    // Convert to UserInterest format - FIXED THE SORT
    const generatedInterests: UserInterest[] = Object.entries(interestFrequency)
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
      return generatedInterests;
    } else {
      console.log('📝 No engagement data found');
      return [];
    }
  };

  // Enhanced AI tips generation with real user data
  const generateAITips = async (interests: UserInterest[]) => {
    try {
      // Filter user's own posts and liked posts
      const userPosts = contextPosts.filter(post => post.userId === currentUser?._id);
      const userLikedPosts = contextPosts.filter(post => {
        const userId = currentUser?._id;
        return userId && Array.isArray(post.likes) && post.likes.includes(userId);
      });

      console.log('🔍 Generating personalized tips for:', {
        userPosts: userPosts.length,
        userLikedPosts: userLikedPosts.length,
        interests: interests.length,
        totalPosts: contextPosts.length
      });

      // Use the enhanced AI analytics service
      const tips = await aiAnalyticsService.generateAITips(
        userPosts,
        contextPosts,
        interests,
        safeUserStats
      );

      console.log('✅ Generated personalized tips:', tips);
      setAiTips(tips);

    } catch (error) {
      console.error('❌ Error generating AI tips:', error);
      
      // Fallback: Generate basic tips from actual user data
      const fallbackTips = generateFallbackTips();
      setAiTips(fallbackTips);
    }
  };

  const generateFallbackTips = (): AITip[] => {
  const userPosts = contextPosts.filter(post => post.userId === currentUser?._id);
  const userLikedPosts = contextPosts.filter(post => {
    const userId = currentUser?._id;
    return userId && Array.isArray(post.likes) && post.likes.includes(userId);
  });

  const tips: AITip[] = [];

  // Tip based on posting activity
  if (userPosts.length === 0) {
    tips.push({
      id: 'first-post',
      title: '🎨 Create Your First Post!',
      message: 'Start by sharing your first post to help Mr. Tailor understand your content style.',
      type: 'content',
      priority: 'high'
    });
  } else if (userPosts.length < 3) {
    tips.push({
      id: 'more-posts',
      title: '📝 Share More Content',
      message: `You've created ${userPosts.length} post${userPosts.length === 1 ? '' : 's'}. Try posting 2-3 more times to establish your content pattern.`,
      type: 'content',
      priority: 'medium'
    });
  }

  // Tip based on engagement
  if (userLikedPosts.length === 0) {
    tips.push({
      id: 'start-engaging',
      title: '💖 Start Engaging',
      message: 'Like some posts to help Mr. Tailor learn what content you enjoy!',
      type: 'engagement',
      priority: 'high'
    });
  } else {
    // Analyze liked posts for patterns - FIXED SORT
    const likedTags = userLikedPosts.flatMap(post => post.tags || []);
    const tagCounts = likedTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])  // FIXED: Changed from [,a], [,b] to a, b
      .slice(0, 3)
      .map(([tag]) => tag);

    if (topTags.length > 0) {
      tips.push({
        id: 'interest-pattern',
        title: '🎯 Your Interest Pattern',
        message: `You frequently engage with ${topTags.map(t => `#${t}`).join(', ')}. We're showing you more content in these areas!`,
        type: 'optimization',
        priority: 'medium'
      });
    }
  }

  // Tip based on user preferences
  if (userPreferences.length > 0) {
    tips.push({
      id: 'preference-match',
      title: '✨ Matching Preferences',
      message: `Based on your preferences (${userPreferences.slice(0, 3).map(p => `#${p}`).join(', ')}), we're curating relevant content for you.`,
      type: 'optimization',
      priority: 'low'
    });
  }

  // Tip based on posting performance - FIXED SORT
  if (userPosts.length > 0) {
    const userPostTags = userPosts.flatMap(post => post.tags || []);
    const userTagCounts = userPostTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedTags = Object.entries(userTagCounts)
      .sort((a, b) => b[1] - a[1])  // FIXED: Changed from [,a], [,b] to a, b
      .slice(0, 2)
      .map(([tag]) => tag);

    if (mostUsedTags.length > 0) {
      tips.push({
        id: 'content-style',
        title: '🎨 Your Content Style',
        message: `You often post about ${mostUsedTags.map(t => `#${t}`).join(' and ')}. Your audience engages well with these topics!`,
        type: 'content',
        priority: 'low'
      });
    }
  }

  // Default tip if no others
  if (tips.length === 0) {
    tips.push({
      id: 'welcome',
      title: '👋 Welcome to Mr. Tailor!',
      message: 'Keep using the platform to receive more personalized tips based on your activity.',
      type: 'engagement',
      priority: 'low'
    });
  }

  return tips.slice(0, 4);
};

  // Calculate AI confidence based on AI interests
  const calculateAIConfidence = () => {
    if (userInterests.length === 0) return 0;

    const totalScore = userInterests.reduce((sum, interest) => sum + interest.score, 0);
    const avgScore = totalScore / userInterests.length;
    const interactionCount = userInterests.reduce((sum, interest) => sum + interest.interactionCount, 0);
    
    const scoreBased = Math.min((avgScore / 10) * 50, 50);
    const interactionBased = Math.min((interactionCount / 20) * 50, 50);
    
    return Math.min(scoreBased + interactionBased, 100);
  };

  const aiConfidence = calculateAIConfidence();

  // Get display interests - prioritize AI interests, fallback to userPreferences
  const displayInterests = userInterests.length > 0 
    ? userInterests 
    : userPreferences.map(pref => ({ 
        tag: pref, 
        score: 1, 
        interactionCount: 1, 
        category: 'user' 
      }));

  const handleSurveySubmit = async (responses: any[]) => {
    try {
      await aiService.submitSurvey(responses);
      await refreshAIData(); // Reload AI data after survey
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
  const posts: Post[] = contextPosts.map(post => ({
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

  // Combine regular tips with chatbot tips
  const allTips = [...aiTips, ...chatbotTips].slice(0, 6);

  // Get user's own posts for the chatbot
  const userPosts = contextPosts.filter(post => post.userId === currentUser?._id);

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
          {userInterests.length > 0 
            ? `Tracking ${userInterests.length} interests from your activity!`
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

      {/* Main Content - UPDATED LAYOUT */}
      <Grid container spacing={3}>
        {/* Left Column - AI Insights */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            {/* AI Confidence Score */}
            <Grid item xs={12}>
              <Card>
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
            </Grid>

            {/* Your Interests & Engagement Insights Side by Side */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
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
                            key={index}
                            label={`#${interest.tag}`}
                            color={userInterests.length > 0 ? "primary" : "default"}
                            variant={userInterests.length > 0 ? "filled" : "outlined"}
                            onDelete={() => {}} // In real app, this would remove preference
                            deleteIcon={<Visibility />}
                            title={`Score: ${interest.score} | Interactions: ${interest.interactionCount}`}
                          />
                        ))}
                      </Box>
                      
                      {/* Show interest stats if we have AI data */}
                      {userInterests.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Tracking {userInterests.length} interests with {userInterests.reduce((sum, i) => sum + i.interactionCount, 0)} total interactions
                        </Typography>
                      )}
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
                      size="small"
                    >
                      Update Preferences
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Engagement Insights
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Favorite color="primary" />
                      <Typography variant="h6" fontWeight="bold">{safeUserStats.totalLikes}</Typography>
                      <Typography variant="body2">Likes Given</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Tag color="secondary" />
                      <Typography variant="h6" fontWeight="bold">{displayInterests.length}</Typography>
                      <Typography variant="body2">Interests</Typography>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* AI Tips Section - Full Width */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TipsAndUpdates />
                    AI Optimization Tips
                  </Typography>
                  <List>
                    {allTips.map((tip) => (
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
                    {allTips.length === 0 && (
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
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column - Chatbot & Controls */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* AI Chatbot - Now properly placed */}
            <Grid item xs={12}>
              <AIChatBot 
                userPosts={userPosts}
                userInterests={userInterests}
                userStats={safeUserStats}
                allPosts={contextPosts}
                onNewTip={handleNewChatbotTip}
              />
            </Grid>

            {/* AI Settings */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Settings />
                    AI Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Control how Mr. Tailor interacts with you
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
            </Grid>

            {/* Recommended Tags */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tag />
                    Explore New Tags
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Based on your interests and engagement
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {recommendedTags.slice(0, 8).map((tag, index) => (
                      <Chip
                        key={index}
                        label={`#${tag}`}
                        variant="outlined"
                        onClick={() => handleAddPreference(tag)}
                        clickable
                        size="small"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Hours */}
            <Grid item xs={12}>
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
            </Grid>
          </Grid>
        </Grid>
      </Grid>

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
          <Typography variant="body2" paragraph>
            • <strong>AI Chat Assistant:</strong> Get personalized advice and tips through conversation
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
