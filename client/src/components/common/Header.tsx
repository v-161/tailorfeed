import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar } from '@mui/material';
import AddIcon from '@mui/icons-material/AddCircle';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Use profilePicture (with capital P) to match AuthContext
    const getUserProfilePic = (): string | undefined => {
        if (!currentUser) return undefined;
        
        return currentUser.profilePicture || undefined;
    };

    const getUsername = (): string => {
        if (!currentUser) return 'User';
        
        return currentUser.username || 'User';
    };

    const profilePic = getUserProfilePic();

    return (
        <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'background.paper', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                
                {/* Logo / Title - Links to Home */}
                <Button onClick={() => navigate('/')} color="inherit" sx={{ textTransform: 'none' }}>
                    <Typography 
                        variant="h6" 
                        component="div" 
                        sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}
                    >
                        TailorFeed
                    </Typography>
                </Button>

                {/* Navigation Links */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    
                    {/* Create Post Button */}
                    <IconButton 
                        color="primary"
                        onClick={() => navigate('/create')}
                        aria-label="Create new post"
                        size="large"
                        sx={{ mr: 1 }}
                    >
                        <AddIcon fontSize="large" />
                    </IconButton>

                    {/* Profile Button / Avatar */}
                    <IconButton 
                        color="inherit" 
                        onClick={() => navigate('/profile')}
                        aria-label="Profile"
                        size="large"
                    >
                        {profilePic ? (
                            <Avatar 
                                src={profilePic} 
                                alt={getUsername()} 
                                sx={{ width: 32, height: 32 }}
                            />
                        ) : (
                            <AccountCircle sx={{ color: 'text.secondary' }} />
                        )}
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;