import React, { useState } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText,
  ListItemIcon, Avatar, Badge, IconButton, Button,
  Chip, Tabs, Tab, CircularProgress
} from '@mui/material';
import {
  Favorite, Chat, PersonAdd, Share, FilterList,
  Delete, MarkEmailRead, NotificationsActive
} from '@mui/icons-material';
import { useNotificationsContext } from '../contexts/NotificationsContext';

const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    loading
  } = useNotificationsContext();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Favorite color="error" />;
      case 'comment': return <Chat color="primary" />;
      case 'follow': return <PersonAdd color="success" />;
      case 'share': return <Share color="info" />;
      case 'trending': return <FilterList color="info" />;
      default: return <Favorite color="error" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like': return '#f44336';
      case 'comment': return '#2196f3';
      case 'follow': return '#4caf50';
      case 'share': return '#ff9800';
      case 'trending': return '#00bcd4';
      default: return '#757575';
    }
  };

  const getPriorityChip = (priority: string) => {
    const color = priority === 'high' ? 'error' : priority === 'medium' ? 'warning' : 'default';
    return <Chip label={priority} size="small" color={color} variant="outlined" />;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') return !notification.read;
    return true;
  });

  const handleMarkAsRead = async (notificationId: string) => {
    setActionLoading(`read-${notificationId}`);
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading('mark-all-read');
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveNotification = async (notificationId: string) => {
    setActionLoading(`remove-${notificationId}`);
    try {
      await removeNotification(notificationId);
    } catch (error) {
      console.error('Failed to remove notification:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearAll = async () => {
    setActionLoading('clear-all');
    try {
      await clearAll();
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'Just now';
    
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "just now";
    } catch (error) {
        return 'Just now';
    }
  };

  // Get timestamp safely - use createdAt if available, otherwise timestamp
  const getNotificationTime = (notification: any) => {
    return notification.createdAt || notification.timestamp;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pb: 8 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Notifications
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error">
              <Typography variant="body2" color="text.secondary">
                {unreadCount} unread
              </Typography>
            </Badge>
          )}
          <Button 
            startIcon={actionLoading === 'mark-all-read' ? <CircularProgress size={16} /> : <MarkEmailRead />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || actionLoading === 'mark-all-read'}
          >
            Mark all read
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab 
            label={`All (${notifications.length})`} 
            value="all" 
          />
          <Tab 
            label={
              <Badge badgeContent={unreadCount} color="error">
                Unread
              </Badge>
            } 
            value="unread" 
          />
        </Tabs>
      </Paper>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <Paper>
          <List>
            {filteredNotifications.map((notification) => (
              <ListItem 
                key={notification._id}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {getPriorityChip(notification.priority)}
                    <IconButton 
                      onClick={() => handleRemoveNotification(notification._id)}
                      size="small"
                      disabled={actionLoading === `remove-${notification._id}`}
                    >
                      {actionLoading === `remove-${notification._id}` ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Delete />
                      )}
                    </IconButton>
                  </Box>
                }
                sx={{
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  borderLeft: notification.read ? 'none' : '4px solid',
                  borderLeftColor: getNotificationColor(notification.type),
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                <ListItemIcon>
                  <Badge
                    color="error"
                    variant="dot"
                    invisible={notification.read}
                  >
                    <Avatar 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        bgcolor: getNotificationColor(notification.type) 
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body1" component="span" fontWeight="bold">
                        {notification.username}
                      </Typography>
                      <Typography variant="body1" component="span">
                        {notification.message}
                      </Typography>
                      {!notification.read && (
                        <Button 
                          size="small" 
                          onClick={() => handleMarkAsRead(notification._id)}
                          disabled={actionLoading === `read-${notification._id}`}
                          sx={{ ml: 1 }}
                        >
                          {actionLoading === `read-${notification._id}` ? (
                            <CircularProgress size={16} />
                          ) : (
                            'Mark read'
                          )}
                        </Button>
                      )}
                    </Box>
                  }
                  secondary={formatTime(getNotificationTime(notification))}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NotificationsActive sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeTab === 'unread' 
              ? "You're all caught up! No unread notifications."
              : "When you get likes, comments, or new followers, they'll appear here."
            }
          </Typography>
        </Paper>
      )}

      {/* Quick Actions */}
      {notifications.length > 0 && (
        <Paper sx={{ p: 2, mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button 
            startIcon={actionLoading === 'mark-all-read' ? <CircularProgress size={16} /> : <MarkEmailRead />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || actionLoading === 'mark-all-read'}
          >
            Mark All Read
          </Button>
          <Button 
            startIcon={actionLoading === 'clear-all' ? <CircularProgress size={16} /> : <Delete />}
            onClick={handleClearAll}
            color="error"
            disabled={actionLoading === 'clear-all'}
          >
            Clear All
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default NotificationsPage;