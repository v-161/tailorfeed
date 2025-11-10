import React, { useState } from 'react';
import { 
  Card, CardHeader, CardMedia, CardContent, CardActions, 
  Avatar, IconButton, Typography, Box, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert
} from '@mui/material';
import { Favorite, FavoriteBorder, ChatBubbleOutline, Share, ContentCopy } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext'; 
import { usePosts } from '../../contexts/PostContext'; 
import { useNavigate } from 'react-router-dom';
import { aiService } from '../../services/aiService';

// Define Post interface
interface PostType {
  _id: string;
  userId: string;
  username: string;
  profilePic?: string;
  profilePicture?: string;
  imageUrl?: string;
  caption: string;
  tags: string[];
  likes: string[];
  comments: any[];
  createdAt: Date | string;
}

// Define PostProps interface
interface PostProps {
  post: PostType;
  onPostInteraction?: () => void; // NEW: Callback for dashboard refresh
}

// --- Simple Time Formatting Function ---
const timeAgo = (date: Date | string | null): string => {
    if (!date) return 'Unknown time';
    
    const postDate = typeof date === 'string' ? new Date(date) : date;
    const seconds = Math.floor((new Date().getTime() - postDate.getTime()) / 1000);
    
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
};

// Alias for compatibility
const getFormattedTime = timeAgo;

const Post: React.FC<PostProps> = ({ post, onPostInteraction }) => { // NEW: Added onPostInteraction prop
    const { currentUser } = useAuth();
    const { likePost, addComment } = usePosts();
    const navigate = useNavigate();
    
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const userId = currentUser?._id;
    const isLiked = userId && post.likes ? post.likes.includes(userId) : false;
    const commentCount = Array.isArray(post.comments) ? post.comments.length : post.comments || 0;

    // Add profile navigation handlers
    const handleProfileClick = () => {
        console.log('Navigating to profile:', post.userId, post.username);
        navigate(`/profile/${post.userId}`);
    };

    const handleUsernameClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event bubbling
        handleProfileClick();
    };

    const handleLike = async () => {
        if (!userId) {
            console.log('❌ No user ID - cannot like');
            return;
        }
        
        console.log('🔄 Starting like process:', {
            postId: post._id,
            userId: userId,
            currentlyLiked: isLiked,
            currentLikes: post.likes
        });

        try {
            // Track with AI first (don't wait for it)
            aiService.likePostWithAI(post._id, post.tags || []);
            
            // Then do the actual like
            await likePost(post._id, userId, isLiked);
            
            console.log('✅ Like action completed successfully');
            
            // 🔥 NEW: Trigger dashboard refresh
            if (onPostInteraction) {
                console.log('🔄 Notifying dashboard of interaction');
                onPostInteraction();
            }
            
            // Also use global method as fallback
            if ((window as any).refreshAIData) {
                (window as any).refreshAIData();
            }
            
        } catch (e) {
            console.error("❌ Failed to toggle like:", e);
        }
    };

    const handleCommentClick = () => {
        setCommentDialogOpen(true);
    };

    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !currentUser) return;
        
        try {
            await addComment(post._id, commentText);
            setCommentText('');
            setCommentDialogOpen(false);
            
            // 🔥 NEW: Trigger dashboard refresh after comment
            if (onPostInteraction) {
                onPostInteraction();
            }
            
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleShareClick = () => {
        setShareDialogOpen(true);
    };

    const generateShareLink = () => {
        // Generate a shareable link for this post
        const baseUrl = window.location.origin;
        return `${baseUrl}/post/${post._id}`;
    };

    const copyToClipboard = async () => {
        const shareLink = generateShareLink();
        try {
            await navigator.clipboard.writeText(shareLink);
            setSnackbarMessage('Link copied to clipboard!');
            setSnackbarOpen(true);
            setShareDialogOpen(false);
        } catch (err) {
            console.error('Failed to copy: ', err);
            setSnackbarMessage('Failed to copy link');
            setSnackbarOpen(true);
        }
    };

    const shareOnSocialMedia = (platform: string) => {
        const shareLink = generateShareLink();
        const text = `Check out this post on TailorFeed: ${post.caption?.substring(0, 100)}...`;
        
        const urls: { [key: string]: string } = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareLink)}`
        };

        if (urls[platform]) {
            window.open(urls[platform], '_blank', 'width=600,height=400');
        }
    };

    const getUserProfilePic = () => {
        return post.profilePic || post.profilePicture || 'https://placehold.co/100x100/60A5FA/ffffff?text=U';
    };

    const getUsername = () => {
        return post.username || 'Unknown User';
    };

    const getPostImage = () => {
        return post.imageUrl || 'https://placehold.co/600x400/CCCCCC/333333?text=No+Image+Available';
    };

    return (
        <>
            <Card sx={{ mb: 4, borderRadius: 3, overflow: 'hidden', maxWidth: 600, marginX: 'auto' }}>
                <CardHeader
                    avatar={
                        <Avatar 
                            src={getUserProfilePic()} 
                            alt={getUsername()} 
                            sx={{ 
                                bgcolor: 'primary.main',
                                cursor: 'pointer',
                                '&:hover': {
                                    opacity: 0.8,
                                    transform: 'scale(1.05)',
                                    transition: 'all 0.2s ease-in-out'
                                }
                            }}
                            onClick={handleProfileClick}
                        >
                            {getUsername()[0]?.toUpperCase()}
                        </Avatar>
                    }
                    title={
                        <Typography 
                            variant="h6" 
                            component="span"
                            sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                    color: 'primary.main',
                                    textDecoration: 'underline'
                                }
                            }}
                            onClick={handleUsernameClick}
                        >
                            {getUsername()}
                        </Typography>
                    }
                    subheader={getFormattedTime(post.createdAt)}
                    sx={{
                        '& .MuiCardHeader-content': {
                            cursor: 'pointer'
                        }
                    }}
                    onClick={handleProfileClick}
                />
                
                <CardMedia
                    component="img"
                    height="400"
                    image={getPostImage()}
                    alt="Post image"
                    sx={{ objectFit: 'cover' }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        e.currentTarget.src = 'https://placehold.co/600x400/CCCCCC/333333?text=Image+Load+Error';
                    }}
                />
                
                <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {post.caption}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                        {post.tags?.map((tag: string, index: number) => (
                            <Typography key={index} variant="body2" component="span" sx={{ color: 'primary.main', mr: 1, fontWeight: 'medium' }}>
                                #{tag}
                            </Typography>
                        ))}
                    </Box>

                    {/* Display Comments */}
                    {post.comments && post.comments.length > 0 && (
                        <Box sx={{ mt: 2, borderTop: 1, borderColor: 'divider', pt: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                Comments ({commentCount})
                            </Typography>
                            {post.comments.slice(0, 3).map((comment: any, index: number) => (
                                <Box key={index} sx={{ mb: 1 }}>
                                    <Typography 
                                        variant="body2" 
                                        fontWeight="medium"
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': {
                                                color: 'primary.main',
                                                textDecoration: 'underline'
                                            }
                                        }}
                                        onClick={() => navigate(`/profile/${comment.userId}`)}
                                    >
                                        {comment.username}:
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {comment.text}
                                    </Typography>
                                </Box>
                            ))}
                            {post.comments.length > 3 && (
                                <Typography variant="caption" color="primary">
                                    View all {post.comments.length} comments
                                </Typography>
                            )}
                        </Box>
                    )}
                </CardContent>
                
                <CardActions disableSpacing>
                    <IconButton 
                        onClick={handleLike}
                        disabled={!userId}
                    >
                        {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
                    </IconButton>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                        {post.likes ? post.likes.length : 0}
                    </Typography>
                    
                    <IconButton onClick={handleCommentClick}>
                        <ChatBubbleOutline />
                    </IconButton>
                    <Typography variant="body2" sx={{ mr: 2 }}>{commentCount}</Typography>
                    
                    <IconButton onClick={handleShareClick}>
                        <Share />
                    </IconButton>
                </CardActions>
            </Card>

            {/* Comment Dialog */}
            <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Comment</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Your comment"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={3}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleCommentSubmit} 
                        variant="contained"
                        disabled={!commentText.trim()}
                    >
                        Post Comment
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Share Dialog */}
            <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Share Post</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Share this post with others:
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Share Link:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                value={generateShareLink()}
                                fullWidth
                                size="small"
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                            <Button 
                                startIcon={<ContentCopy />}
                                onClick={copyToClipboard}
                                variant="outlined"
                            >
                                Copy
                            </Button>
                        </Box>
                    </Box>

                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Share on Social Media:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => shareOnSocialMedia('twitter')}
                            sx={{ textTransform: 'none' }}
                        >
                            Twitter
                        </Button>
                        <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => shareOnSocialMedia('facebook')}
                            sx={{ textTransform: 'none' }}
                        >
                            Facebook
                        </Button>
                        <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => shareOnSocialMedia('linkedin')}
                            sx={{ textTransform: 'none' }}
                        >
                            LinkedIn
                        </Button>
                        <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => shareOnSocialMedia('whatsapp')}
                            sx={{ textTransform: 'none' }}
                        >
                            WhatsApp
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for copy confirmation */}
            <Snackbar 
                open={snackbarOpen} 
                autoHideDuration={3000} 
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default Post;