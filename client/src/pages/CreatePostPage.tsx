import React, { useState } from 'react';
import {
    Box, TextField, Button, Typography, Paper, Chip,
    Card, CardMedia, IconButton, Container, Snackbar, Alert as MuiAlert
} from '@mui/material';
import { Delete, AddPhotoAlternate } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostContext'; 

const CreatePostPage: React.FC = () => {
    const [caption, setCaption] = useState('');
    const [tags, setTags] = useState('');
    const [tagList, setTagList] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    
    // State for notifications
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info',
    });

    const { currentUser } = useAuth();
    const { createPost } = usePosts(); 
    const navigate = useNavigate();

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleAddTag = () => {
        if (tags.trim() && !tagList.includes(tags.trim().toLowerCase())) {
            setTagList([...tagList, tags.trim().toLowerCase()]);
            setTags('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTagList(tagList.filter(tag => tag !== tagToRemove));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                setSnackbar({ open: true, message: 'Please select an image file.', severity: 'error' });
                return;
            }

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setSnackbar({ open: true, message: 'Image must be smaller than 5MB.', severity: 'error' });
                return;
            }

            setSelectedImage(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview('');
        // This is necessary to allow the same file to be selected again
        const input = document.getElementById('image-upload-input') as HTMLInputElement;
        if (input) input.value = '';
    };

    const handleSubmit = async () => {
        if (!caption.trim()) {
            setSnackbar({ open: true, message: 'Please add a caption.', severity: 'error' });
            return;
        }
        if (!currentUser) {
            setSnackbar({ open: true, message: 'You must be logged in to create a post.', severity: 'error' });
            return;
        }

        setUploading(true);

        try {
            // NewPostData structure - matches our updated PostContext
            const postPayload = {
                caption: caption.trim(),
                tags: tagList,
                // imageUrl will be added by the backend after upload
            };

            // Call createPost - this now uses MongoDB backend
            await createPost(postPayload, selectedImage || undefined);

            setSnackbar({ open: true, message: 'Post created successfully!', severity: 'success' });
            
            // Reset form
            setCaption('');
            setTagList([]);
            removeImage();
            
            // Navigate to home page after success
            setTimeout(() => navigate('/'), 1000); 
            
        } catch (error: any) {
            console.error('Post creation failed:', error);
            setSnackbar({ 
                open: true, 
                message: error.message || 'Failed to create post. Please try again.', 
                severity: 'error' 
            });
        } finally {
            setUploading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ p: 2, pb: 8 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mt: 2 }}>
                    Create New Post
                </Typography>
                
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                    
                    {/* Image Upload Section */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Add Photo
                        </Typography>
                        
                        {imagePreview ? (
                            <Card sx={{ position: 'relative', maxWidth: '100%', borderRadius: 2, boxShadow: 6 }}>
                                <CardMedia
                                    component="img"
                                    height="300"
                                    image={imagePreview}
                                    alt="Post preview"
                                    sx={{ objectFit: 'cover' }}
                                />
                                <IconButton
                                    onClick={removeImage}
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        backgroundColor: 'rgba(255, 0, 0, 0.7)',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 0, 0, 1)',
                                        }
                                    }}
                                >
                                    <Delete />
                                </IconButton>
                            </Card>
                        ) : (
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<AddPhotoAlternate />}
                                sx={{ py: 2, borderStyle: 'dashed', borderColor: 'primary.main', color: 'primary.main' }}
                                fullWidth
                            >
                                Select Image (Optional)
                                <input
                                    id="image-upload-input"
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                />
                            </Button>
                        )}
                        
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                            Supported formats: JPG, PNG, GIF • Max size: 5MB
                        </Typography>
                    </Box>

                    {/* Caption */}
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="What's on your mind?"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        margin="normal"
                        placeholder="Share something with the TailorFeed community..."
                    />
                    
                    {/* Tags */}
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Tags
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                                fullWidth
                                label="Add a tag"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="e.g., programming, travel, food"
                            />
                            <Button 
                                variant="contained" 
                                onClick={handleAddTag}
                                disabled={!tags.trim()}
                                sx={{ minWidth: 80 }}
                            >
                                Add
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {tagList.map((tag, index) => (
                                <Chip
                                    key={index}
                                    label={`#${tag}`}
                                    onDelete={() => handleRemoveTag(tag)}
                                    color="primary"
                                    variant="outlined"
                                    sx={{ borderRadius: 1.5 }}
                                />
                            ))}
                        </Box>
                    </Box>
                    
                    {/* Submit Button */}
                    <Button 
                        fullWidth 
                        variant="contained" 
                        onClick={handleSubmit}
                        disabled={!caption.trim() || uploading || !currentUser}
                        sx={{ mt: 4, py: 1.5, borderRadius: 2 }}
                        size="large"
                    >
                        {uploading ? 'Uploading...' : 'Create Post'}
                    </Button>
                    {!currentUser && (
                        <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                            You must be signed in to create a post.
                        </Typography>
                    )}
                </Paper>
            </Box>

            {/* Notification Snackbar */}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
                <MuiAlert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </MuiAlert>
            </Snackbar>
        </Container>
    );
};

export default CreatePostPage;