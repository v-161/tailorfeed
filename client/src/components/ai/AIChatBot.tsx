import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  SmartToy,
  Send,
  Person,
  Psychology,
  TrendingUp,
  TipsAndUpdates
} from '@mui/icons-material';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'tip' | 'analysis' | 'suggestion';
  data?: any;
}

interface AIChatBotProps {
  userPosts: any[];
  userInterests: any[];
  userStats: any;
  allPosts: any[];
  onNewTip?: (tip: any) => void;
}

const AIChatBot: React.FC<AIChatBotProps> = ({
  userPosts,
  userInterests,
  userStats,
  allPosts,
  onNewTip
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm Mr. Tailor AI. I can analyze your content strategy and give personalized tips. Ask me anything like 'How can I improve my engagement?' or 'What tags should I use?'",
      sender: 'ai',
      timestamp: new Date(),
      type: 'tip'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Analyze user data for conversational responses
  const analyzeUserData = () => {
    const userPostTags = userPosts.flatMap(post => post.tags || []);
    const userLikedPosts = allPosts.filter(post => 
      Array.isArray(post.likes) && post.likes.length > 0
    );
    const likedTags = userLikedPosts.flatMap(post => post.tags || []);

    const tagCounts = [...userPostTags, ...likedTags].reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    const engagementRate = userStats.engagementRate || 0;
    const totalLikes = userStats.totalLikes || 0;

    return {
      topTags,
      engagementRate,
      totalLikes,
      postCount: userPosts.length,
      hasLowEngagement: engagementRate < 50,
      hasFewPosts: userPosts.length < 3,
      popularTags: topTags.slice(0, 3)
    };
  };

  const generateAIResponse = async (userMessage: string): Promise<Message[]> => {
    const analysis = analyzeUserData();
    const responses: Message[] = [];
    
    const lowerMessage = userMessage.toLowerCase();

    // Engagement analysis
    if (lowerMessage.includes('engagement') || lowerMessage.includes('like') || lowerMessage.includes('popular')) {
      if (analysis.hasLowEngagement) {
        responses.push({
          id: Date.now().toString(),
          text: `Your engagement rate is ${analysis.engagementRate}%. Based on your activity, here's how to improve:`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'analysis'
        });
        
        if (analysis.popularTags.length > 0) {
          responses.push({
            id: (Date.now() + 1).toString(),
            text: `💡 Use more of your popular tags: ${analysis.popularTags.map(t => `#${t}`).join(', ')}. Posts with these tags get better engagement!`,
            sender: 'ai',
            timestamp: new Date(),
            type: 'tip'
          });
        }
        
        if (analysis.postCount < 5) {
          responses.push({
            id: (Date.now() + 2).toString(),
            text: `📈 Try posting more regularly. You have ${analysis.postCount} posts - aim for 5-10 to establish a stronger presence.`,
            sender: 'ai',
            timestamp: new Date(),
            type: 'suggestion'
          });
        }
      } else {
        responses.push({
          id: Date.now().toString(),
          text: `🎉 Great job! Your engagement rate is ${analysis.engagementRate}%, which is above average. Keep creating quality content!`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'analysis'
        });
      }
    }

    // Tag recommendations
    else if (lowerMessage.includes('tag') || lowerMessage.includes('hashtag') || lowerMessage.includes('#')) {
      if (analysis.topTags.length > 0) {
        responses.push({
          id: Date.now().toString(),
          text: `Based on your activity, your most engaging tags are: ${analysis.topTags.map(t => `#${t}`).join(', ')}`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'analysis'
        });
        
        // Find trending tags user isn't using
        const allTags = allPosts.flatMap(post => post.tags || []);
        const tagFrequency = allTags.reduce((acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const trendingTags = Object.entries(tagFrequency)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([tag]) => tag)
          .filter(tag => !analysis.topTags.includes(tag))
          .slice(0, 3);

        if (trendingTags.length > 0) {
          responses.push({
            id: (Date.now() + 1).toString(),
            text: `🔥 Try these trending tags: ${trendingTags.map(t => `#${t}`).join(', ')}. They're popular but you haven't used them much!`,
            sender: 'ai',
            timestamp: new Date(),
            type: 'suggestion'
          });
        }
      }
    }

    // Content strategy
    else if (lowerMessage.includes('content') || lowerMessage.includes('post') || lowerMessage.includes('create')) {
      if (analysis.hasFewPosts) {
        responses.push({
          id: Date.now().toString(),
          text: `You have ${analysis.postCount} posts. Here are some content ideas based on your interests:`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'suggestion'
        });
        
        if (userInterests.length > 0) {
          const interestTags = userInterests.slice(0, 3).map(interest => interest.tag);
          responses.push({
            id: (Date.now() + 1).toString(),
            text: `💡 Create posts about: ${interestTags.map(t => `#${t}`).join(', ')}. These match your interests and could resonate well!`,
            sender: 'ai',
            timestamp: new Date(),
            type: 'tip'
          });
        }
      } else {
        responses.push({
          id: Date.now().toString(),
          text: `You're doing great with ${analysis.postCount} posts! Consider creating more tutorial-style content or behind-the-scenes posts to boost engagement.`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'suggestion'
        });
      }
    }

    // General help
    else if (lowerMessage.includes('help') || lowerMessage.includes('advice') || lowerMessage.includes('tip')) {
      responses.push({
        id: Date.now().toString(),
        text: "I can help you with: 📊 Engagement analysis, 🏷️ Tag recommendations, 🎯 Content strategy, and 📈 Growth tips. What would you like to know?",
        sender: 'ai',
        timestamp: new Date(),
        type: 'tip'
      });
    }

    // Default response
    else {
      responses.push({
        id: Date.now().toString(),
        text: "I'm here to help optimize your content strategy! You can ask me about engagement, tags, content ideas, or growth tips. What would you like to know?",
        sender: 'ai',
        timestamp: new Date(),
        type: 'tip'
      });
    }

    return responses;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponses = await generateAIResponse(inputText);
      
      // Add AI responses with slight delay for natural feel
      for (const response of aiResponses) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setMessages(prev => [...prev, response]);
        
        // Notify parent component about new tips
        if (response.type === 'tip' && onNewTip) {
          onNewTip({
            id: response.id,
            title: '💬 Chat Tip',
            message: response.text,
            type: 'engagement',
            priority: 'medium'
          });
        }
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "Sorry, I'm having trouble analyzing your data right now. Please try again!",
        sender: 'ai',
        timestamp: new Date()
      }]);
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
    <Paper elevation={3} sx={{ height: 500, display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToy />
          <Typography variant="h6">Mr. Tailor AI Assistant</Typography>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Ask me for personalized content tips and analysis
        </Typography>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <List sx={{ width: '100%' }}>
          {messages.map((message) => (
            <ListItem key={message.id} alignItems="flex-start" sx={{
              flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
              textAlign: message.sender === 'user' ? 'right' : 'left'
            }}>
              <ListItemAvatar sx={{ 
                minWidth: 40,
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <Avatar sx={{ 
                  bgcolor: message.sender === 'user' ? 'secondary.main' : 'primary.main',
                  width: 32, height: 32
                }}>
                  {message.sender === 'user' ? <Person /> : <SmartToy />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      maxWidth: '70%',
                      ml: message.sender === 'user' ? 'auto' : 0,
                      mr: message.sender === 'user' ? 0 : 'auto',
                      bgcolor: message.sender === 'user' ? 'primary.light' : 'grey.100',
                      color: message.sender === 'user' ? 'white' : 'text.primary',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.text}
                    </Typography>
                    {message.type === 'tip' && (
                      <Chip 
                        icon={<TipsAndUpdates />} 
                        label="Tip" 
                        size="small" 
                        color="primary" 
                        sx={{ mt: 1 }} 
                      />
                    )}
                  </Paper>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    display: 'block', 
                    textAlign: message.sender === 'user' ? 'right' : 'left',
                    mt: 0.5
                  }}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                }
              />
            </ListItem>
          ))}
          {isLoading && (
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <SmartToy />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2">Mr. Tailor is thinking...</Typography>
                  </Box>
                }
              />
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask for tips (e.g., 'How can I improve engagement?')"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            size="small"
          />
          <IconButton 
            color="primary" 
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Send />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Try: "What tags should I use?" or "How's my engagement?"
        </Typography>
      </Box>
    </Paper>
  );
};

export default AIChatBot;
