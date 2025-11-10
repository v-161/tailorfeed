import React, { useState } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText,
  ListItemIcon, Switch, FormControlLabel, Divider,
  Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Chip, Accordion,
  AccordionSummary, AccordionDetails, Alert
} from '@mui/material';
import {
  Settings, Notifications, SmartToy, Security,
  Palette, ExpandMore, Download, PrivacyTip, Help, Logout
} from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';
import { useDataContext } from '../contexts/DataContext';
import { useNotificationsContext } from '../contexts/NotificationsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const { toggleColorMode } = useThemeContext();
  const { userPreferences } = useDataContext();
  const { clearAll: clearNotifications } = useNotificationsContext();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    // Notification Settings
    pushNotifications: true,
    emailNotifications: false,
    soundEnabled: true,
    vibrationEnabled: true,
    
    // Privacy Settings
    profilePublic: true,
    showOnlineStatus: true,
    allowTagging: true,
    allowMessages: true,
    
    // AI Settings
    personalizedFeed: true,
    aiSuggestions: true,
    learningFromEngagement: true,
    surveyReminders: true,
    
    // Content Settings
    showExplicitContent: false,
    autoPlayVideos: true,
    dataSaverMode: false
  });

  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleExportData = () => {
    // In real app, this would generate and download data
    console.log('Data export requested');
    setExportDialogOpen(false);
    alert('Data export feature would be implemented with backend');
  };

  const handleClearData = () => {
    clearNotifications();
    // Could add more data clearing functions here
    alert('Temporary data cleared successfully');
  };

  const handleLogout = () => {
    // Call the actual logout function from AuthContext
    logout();
    navigate('/login');
    alert('Logged out successfully!');
  };

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Settings
      </Typography>

      {/* Appearance Settings */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <ListItemIcon>
            <Palette color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Appearance" 
            secondary="Theme and display settings"
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  onChange={toggleColorMode}
                />
              }
              label="Light Mode"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoPlayVideos}
                  onChange={() => handleSettingChange('autoPlayVideos')}
                />
              }
              label="Auto-play Videos"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.dataSaverMode}
                  onChange={() => handleSettingChange('dataSaverMode')}
                />
              }
              label="Data Saver Mode"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Notifications Settings */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <ListItemIcon>
            <Notifications color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Notifications" 
            secondary="Manage your notifications"
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications}
                  onChange={() => handleSettingChange('pushNotifications')}
                />
              }
              label="Push Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={() => handleSettingChange('emailNotifications')}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.soundEnabled}
                  onChange={() => handleSettingChange('soundEnabled')}
                />
              }
              label="Notification Sounds"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.vibrationEnabled}
                  onChange={() => handleSettingChange('vibrationEnabled')}
                />
              }
              label="Vibration"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* AI & Personalization Settings */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <ListItemIcon>
            <SmartToy color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Mr. Tailor AI" 
            secondary="AI personalization settings"
          />
        </AccordionSummary>
        <AccordionDetails>
          <Alert severity="info" sx={{ mb: 2 }}>
            Mr. Tailor AI helps personalize your feed based on your interests and engagement patterns.
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.personalizedFeed}
                  onChange={() => handleSettingChange('personalizedFeed')}
                />
              }
              label="Personalized Feed"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.aiSuggestions}
                  onChange={() => handleSettingChange('aiSuggestions')}
                />
              }
              label="AI Content Suggestions"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.learningFromEngagement}
                  onChange={() => handleSettingChange('learningFromEngagement')}
                />
              }
              label="Learn from My Engagement"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.surveyReminders}
                  onChange={() => handleSettingChange('surveyReminders')}
                />
              }
              label="Survey Reminders"
            />
            
            {/* User Interests */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Your Interests
              </Typography>
              {userPreferences.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {userPreferences.map((pref, index) => (
                    <Chip key={index} label={`#${pref}`} variant="outlined" />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No interests yet. Like posts to build your preferences.
                </Typography>
              )}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Privacy & Security */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <ListItemIcon>
            <Security color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Privacy & Security" 
            secondary="Control your privacy settings"
          />
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.profilePublic}
                  onChange={() => handleSettingChange('profilePublic')}
                />
              }
              label="Public Profile"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showOnlineStatus}
                  onChange={() => handleSettingChange('showOnlineStatus')}
                />
              }
              label="Show Online Status"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowTagging}
                  onChange={() => handleSettingChange('allowTagging')}
                />
              }
              label="Allow Tagging"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowMessages}
                  onChange={() => handleSettingChange('allowMessages')}
                />
              }
              label="Allow Direct Messages"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showExplicitContent}
                  onChange={() => handleSettingChange('showExplicitContent')}
                />
              }
              label="Show Explicit Content"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Account Actions */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings />
          Account Actions
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Download />
            </ListItemIcon>
            <ListItemText 
              primary="Export Data" 
              secondary="Download your personal data"
            />
            <Button 
              variant="outlined" 
              onClick={() => setExportDialogOpen(true)}
            >
              Export
            </Button>
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <PrivacyTip />
            </ListItemIcon>
            <ListItemText 
              primary="Clear Temporary Data" 
              secondary="Clear cache and temporary files"
            />
            <Button 
              variant="outlined" 
              color="warning"
              onClick={handleClearData}
            >
              Clear
            </Button>
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <PrivacyTip />
            </ListItemIcon>
            <ListItemText 
              primary="Privacy Policy" 
              secondary="Read our privacy policy"
            />
            <Button variant="text">
              View
            </Button>
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Help />
            </ListItemIcon>
            <ListItemText 
              primary="Help & Support" 
              secondary="Get help using TailorFeed"
            />
            <Button variant="text">
              Contact
            </Button>
          </ListItem>
        </List>
      </Paper>

      {/* Logout Section */}
      <Paper sx={{ p: 3, border: '2px solid', borderColor: 'warning.main' }}>
        <Typography variant="h6" gutterBottom color="warning.main">
          Session
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="warning"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Sign out of your account. You can sign back in anytime.
        </Typography>
      </Paper>

      {/* Export Data Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Data</DialogTitle>
        <DialogContent>
          <Typography>
            This will generate a file containing all your personal data including:
          </Typography>
          <List>
            <ListItem>• Profile information</ListItem>
            <ListItem>• Posts and interactions</ListItem>
            <ListItem>• Preferences and settings</ListItem>
            <ListItem>• Notification history</ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExportData} variant="contained">
            Export Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;