import React, { useState, useEffect } from 'react';
import { Fab, Badge, Tooltip } from '@mui/material';
import { SmartToy } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import MrTailorSurvey from './MrTailorSurvey';
import { useDataContext } from '../../contexts/DataContext';
import { aiService } from '../../services/aiService'; // ADDED IMPORT

const MrTailorFab: React.FC = () => {
  const [surveyOpen, setSurveyOpen] = useState(false);
  const { userPreferences, user } = useDataContext();
  const navigate = useNavigate();
  const [shouldShowBadge, setShouldShowBadge] = useState(false);
  const [hasAIPreferences, setHasAIPreferences] = useState(false); // ADDED STATE

  // ADDED EFFECT: Check if AI preferences exist in database
  useEffect(() => {
    const checkAIPreferences = async () => {
      try {
        const response = await aiService.getUserInterests();
        setHasAIPreferences(response.interests && response.interests.length > 0);
      } catch (error) {
        console.error('Error checking AI preferences:', error);
        setHasAIPreferences(false);
      }
    };

    if (user) {
      checkAIPreferences();
    }
  }, [user]);

  // Fixed survey timing logic - every 2 weeks
  const isSurveyDue = () => {
    const lastSurveyDate = localStorage.getItem('lastSurveyDate');
    
    if (!lastSurveyDate) return true; // Never taken a survey
    
    const lastSurvey = new Date(lastSurveyDate);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    return lastSurvey < twoWeeksAgo;
  };

  const hasPreferences = userPreferences && userPreferences.length > 0;

  // UPDATED EFFECT: Use actual AI preferences check
  useEffect(() => {
    // Check if survey should be shown (every 2 weeks or no preferences)
    const due = isSurveyDue();
    const showBadge = !hasAIPreferences || due; // CHANGED: userPreferences to hasAIPreferences
    setShouldShowBadge(showBadge);
  }, [user, hasAIPreferences]); // CHANGED: userPreferences to hasAIPreferences

  const handleFabClick = () => {
    if (isSurveyDue() || !hasAIPreferences) { // CHANGED: hasPreferences to hasAIPreferences
      setSurveyOpen(true);
    } else {
      // Navigate to Mr. Tailor dashboard
      navigate('/mr-tailor');
    }
  };

  const handleSurveySubmit = async (responses: any[]) => {
    try {
      // Update last survey date
      localStorage.setItem('lastSurveyDate', new Date().toISOString());
      setShouldShowBadge(false);
      
      // Close survey
      setSurveyOpen(false);
      
      // Navigate to dashboard after survey
      navigate('/mr-tailor');
      
    } catch (error) {
      console.error('Error handling survey submission:', error);
    }
  };

  const getTooltipTitle = () => {
    if (!hasAIPreferences) { // CHANGED: hasPreferences to hasAIPreferences
      return "Help Mr. Tailor learn your preferences!";
    }
    if (isSurveyDue()) {
      return "Time for your bi-weekly survey!";
    }
    return "Mr. Tailor AI Dashboard - View your personalized insights";
  };

  return (
    <>
      <Tooltip 
        title={getTooltipTitle()} 
        placement="left"
        arrow
      >
        <Fab
          color="primary"
          aria-label="mr-tailor"
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 1000,
            backgroundColor: 'primary.main',
            width: 56,
            height: 56,
            '&:hover': {
              backgroundColor: 'primary.dark',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
          onClick={handleFabClick}
        >
          <Badge
            color="success"
            variant="dot"
            invisible={!shouldShowBadge}
          >
            <SmartToy />
          </Badge>
        </Fab>
      </Tooltip>

      <MrTailorSurvey 
        open={surveyOpen} 
        onClose={() => setSurveyOpen(false)}
        onSubmit={handleSurveySubmit}
      />
    </>
  );
};

export default MrTailorFab;