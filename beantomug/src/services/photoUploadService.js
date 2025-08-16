import { getApiConfig } from '../utils/config';

/**
 * Unified photo upload service for different content types
 * @param {File} file - The photo file to upload
 * @param {string} contentType - Type of content (dish, category, etc.)
 * @returns {Promise<string>} - The uploaded photo URL
 */
const uploadPhoto = async (file, contentType = 'dish') => {
  try {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('contentType', contentType);

    const response = await fetch(`${getApiConfig().baseURL}/upload/photo`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
      // No Authorization header needed - using session-based auth
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to upload ${contentType} photo`);
    }

    const data = await response.json();
    return data.photo.url;
  } catch (error) {
    console.error(`Error uploading ${contentType} photo:`, error);
    throw new Error(`Failed to upload ${contentType} photo: ${error.message}`);
  }
};

/**
 * Get the appropriate file input name based on content type
 * @param {string} contentType - Type of content
 * @returns {string} - The file input name
 */
const getPhotoInputName = (contentType) => {
  const inputNames = {
    dish: 'photo',
    category: 'photo',
    gallery: 'photo'
  };
  return inputNames[contentType] || 'photo';
};

/**
 * Get the appropriate upload directory based on content type
 * @param {string} contentType - Type of content
 * @returns {string} - The upload directory path
 */
const getUploadDirectory = (contentType) => {
  const directories = {
    dish: '/uploads/dish-photos/',
    category: '/uploads/category-photos/',
    gallery: '/uploads/gallery/photos/'
  };
  return directories[contentType] || '/uploads/';
};

// Export all functions
export { uploadPhoto, getPhotoInputName, getUploadDirectory };
