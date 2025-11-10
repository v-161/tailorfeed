class CloudinaryService {
 private cloudName: string = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dxkt5xsno';
 private uploadPreset: string = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'tailorfeed_preset';

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('cloud_name', this.cloudName);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url; // This is the image URL
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  }

  // Optional: Delete image (if needed later)
  async deleteImage(publicId: string): Promise<void> {
    // Note: Free plan doesn't include delete API
    // This is for future reference
    console.log('Delete functionality requires paid plan');
  }
}

export const cloudinaryService = new CloudinaryService();