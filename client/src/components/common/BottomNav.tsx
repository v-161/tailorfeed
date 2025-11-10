import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper, Badge, Tooltip } from '@mui/material';
import { Home, Search, AddBox, Notifications, SmartToy, Person, Settings } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationsContext } from '../../contexts/NotificationsContext';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotificationsContext();

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path === '/search') return 1;
    if (path === '/create') return 2;
    if (path === '/notifications') return 3;
    if (path === '/mr-tailor') return 4; // CHANGED: from /ai-dashboard to /mr-tailor
    if (path === '/profile') return 5;
    if (path === '/settings') return 6;
    return 0;
  };

  const isMainTab = ['/', '/search', '/create', '/notifications', '/mr-tailor', '/profile', '/settings'].includes(location.pathname);

  const handleNavigation = (newValue: number) => {
    switch (newValue) {
      case 0: navigate('/'); break;
      case 1: navigate('/search'); break;
      case 2: navigate('/create'); break;
      case 3: navigate('/notifications'); break;
      case 4: navigate('/mr-tailor'); break; // CHANGED: to /mr-tailor
      case 5: navigate('/profile'); break;
      case 6: navigate('/settings'); break;
    }
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
      }} 
      elevation={3}
    >
      <BottomNavigation
        value={isMainTab ? getCurrentTab() : false}
        onChange={(event, newValue) => handleNavigation(newValue)}
        showLabels={false}
        sx={{
          backgroundColor: 'background.paper',
          height: '56px',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px',
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: 'primary.main',
          }
        }}
      >
        <Tooltip title="Home" placement="top">
          <BottomNavigationAction icon={<Home />} />
        </Tooltip>
        <Tooltip title="Search" placement="top">
          <BottomNavigationAction icon={<Search />} />
        </Tooltip>
        <Tooltip title="Create" placement="top">
          <BottomNavigationAction icon={<AddBox />} />
        </Tooltip>
        <Tooltip title="Notifications" placement="top">
          <BottomNavigationAction 
            icon={
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            } 
          />
        </Tooltip>
        <Tooltip title="Mr. Tailor AI" placement="top">
          <BottomNavigationAction icon={<SmartToy />} />
        </Tooltip>
        <Tooltip title="Profile" placement="top">
          <BottomNavigationAction icon={<Person />} />
        </Tooltip>
        <Tooltip title="Settings" placement="top">
          <BottomNavigationAction icon={<Settings />} />
        </Tooltip>
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;