import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Rating,
  LinearProgress,
  IconButton
} from '@mui/material';
import { SmartToy, Close } from '@mui/icons-material';
import { useDataContext } from '../../contexts/DataContext';
import { aiService } from '../../services/aiService'; // ADDED IMPORT

interface MrTailorSurveyProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (responses: any[]) => void;
}

const MrTailorSurvey: React.FC<MrTailorSurveyProps> = ({ open, onClose, onSubmit }) => {
  const { userPreferences, addUserPreference, posts } = useDataContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [ratings, setRatings] = useState<{[key: string]: number}>({});

  // Get common tags from all posts (since isLiked doesn't exist yet)
  const getSurveyTags = () => {
    const userTags = posts.flatMap(post => post.tags || []);
    const popularTags = ['programming', 'travel', 'food', 'fitness', 'art', 'music', 'technology', 'photography', 'coding', 'design'];

    // Combine and remove duplicates
    const allTags = [...userTags, ...popularTags].filter((tag, index, array) => 
      array.indexOf(tag) === index
    );
    
    return allTags.slice(0, 10); // Show top 10 tags
  };

  const surveyTags = getSurveyTags();

  const handleRatingChange = (tag: string, value: number | null) => {
    setRatings(prev => ({
      ...prev,
      [tag]: value || 0
    }));
  };

  const handleComplete = async () => {
    try {
      // Format responses for AI backend
      const formattedResponses = Object.entries(ratings).map(([tag, rating]) => ({
        question: `How interested are you in ${tag}?`,
        answer: rating >= 3 ? `I'm interested in ${tag}` : `Not interested in ${tag}`
      }));

      console.log('🔄 Submitting survey to AI backend...');
      
      // 🎯 FIX: Better error handling and response checking
      const result = await aiService.submitSurvey(formattedResponses);
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to submit survey to server');
      }
      
      console.log('✅ Survey saved to AI backend:', result);

      // 🎯 FIX: Add tags with rating 3 or higher to user preferences
      const tagsToAdd = Object.entries(ratings)
        .filter(([tag, rating]) => rating >= 3 && !userPreferences.includes(tag))
        .map(([tag]) => tag);

      console.log('🔄 Adding preferences from survey:', tagsToAdd);
      
      // Add all preferences at once
      for (const tag of tagsToAdd) {
        await addUserPreference(tag);
      }

      // Call onSubmit prop if provided
      if (onSubmit) {
        onSubmit(formattedResponses);
      }
      
      // Update last survey date
      localStorage.setItem('lastSurveyDate', new Date().toISOString());
      
      onClose();
      setCurrentStep(0);
      setRatings({});
      
      // Show success message
      alert('🎉 Mr. Tailor has learned your preferences! Your feed will now be more personalized.');
    } catch (error: any) {
      console.error('❌ Error submitting survey:', error);
      alert(`❌ Failed to save preferences: ${error.message || 'Please check your connection and try again.'}`);
    }
  };

  const handleSkip = () => {
    // If user skips, still call onSubmit with empty responses for tracking
    if (onSubmit) {
      onSubmit([]);
    }
    onClose();
    setCurrentStep(0);
    setRatings({});
  };

  const steps = [
    {
      title: "Welcome to Mr. Tailor! 👋",
      content: "I'm your AI assistant. I'll help personalize your feed based on your interests. This survey takes just 1 minute!",
      type: 'welcome'
    },
    {
      title: "Rate Your Interests",
      content: "How interested are you in these topics? (1 = Not interested, 5 = Very interested)",
      type: 'ratings'
    },
    {
      title: "Survey Complete!",
      content: "Thanks for helping me learn your preferences! I'll now show you more content you'll love.",
      type: 'complete'
    }
  ];

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setRatings({});
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={handleSkip} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy color="primary" />
            <Typography variant="h6">Mr. Tailor AI</Typography>
          </Box>
          <IconButton onClick={handleSkip} size="small">
            <Close />
          </IconButton>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={(currentStep / (steps.length - 1)) * 100} 
          sx={{ mt: 1 }}
        />
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
          {steps[currentStep].title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {steps[currentStep].content}
        </Typography>

        {steps[currentStep].type === 'ratings' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {surveyTags.map((tag: string) => (
              <Box key={tag} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip 
                  label={`#${tag}`} 
                  variant="outlined" 
                  sx={{ minWidth: '100px' }}
                  color={userPreferences.includes(tag) ? 'primary' : 'default'}
                />
                <Rating
                  value={ratings[tag] || 0}
                  onChange={(event, newValue) => handleRatingChange(tag, newValue)}
                  size="medium"
                />
              </Box>
            ))}
          </Box>
        )}

        {steps[currentStep].type === 'complete' && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <SmartToy color="success" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="body1" color="success.main" gutterBottom>
              Your personalized feed is ready! 🎉
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Object.entries(ratings).filter(([_, rating]) => rating >= 3).length > 0 ? (
                <>
                  Based on your ratings, I'll show you more content about: {Object.entries(ratings)
                    .filter(([_, rating]) => rating >= 3)
                    .map(([tag]) => tag)
                    .join(', ')}
                </>
              ) : (
                "Start liking posts to help me learn your preferences better!"
              )}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {currentStep > 0 && (
          <Button onClick={() => setCurrentStep(prev => prev - 1)}>
            Back
          </Button>
        )}
        
        {currentStep < steps.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={currentStep === 1 && Object.keys(ratings).length === 0}
          >
            {currentStep === 0 ? 'Start Survey' : 'Continue'}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleComplete}>
            Start Personalizing
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MrTailorSurvey;
