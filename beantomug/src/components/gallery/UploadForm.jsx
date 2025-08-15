import React, { useState, useRef } from 'react';
import classes from './uploadForm.module.css';
import { useUser } from '../../context/UserContext/UserContext';
import { getApiConfig } from '../../utils/config';

const UploadForm = ({ onImageUploaded }) => {
    const { user } = useUser();
    
    // Check if user is staff or admin
    const isStaffOrAdmin = user && (user.role === 'staff' || user.role === 'admin');
    
    if (!isStaffOrAdmin) {
        return (
            <div className={classes.uploadSection}>
                <div className={classes.accessDenied}>
                    <h2 className={classes.accessDeniedTitle}>Access Restricted</h2>
                    <p className={classes.accessDeniedText}>
                        Only staff and admin users can upload images to the gallery.
                    </p>
                </div>
            </div>
        );
    }
    const [file, setFile] = useState(null);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
        
        const isImage = allowedImageTypes.includes(selectedFile.type);
        const isVideo = allowedVideoTypes.includes(selectedFile.type);
        
        if (!isImage && !isVideo) {
            setError('Please select a valid image or video file (JPEG, PNG, GIF, WebP, MP4, WebM, MOV)');
            return;
        }
        
        if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
            setError('File size must be less than 50MB');
            return;
        }
        
        // Check video duration if it's a video
        if (isVideo) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                if (video.duration > 15) {
                    setError('Video must be 15 seconds or shorter');
                    return;
                }
                setFile(selectedFile);
                setError('');
            };
            
            video.onerror = () => {
                setError('Could not read video file');
            };
            
            video.src = URL.createObjectURL(selectedFile);
        } else {
            setFile(selectedFile);
            setError('');
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!file) {
            setError('Please select an image to upload');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('image', file);
        formData.append('description', description);

        try {
            const response = await fetch(`${getApiConfig().baseURL}/gallery/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include', // Include cookies/session
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Image uploaded successfully!');
                setFile(null);
                setDescription('');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                onImageUploaded();
            } else {
                setError(data.message || 'Upload failed');
            }
        } catch (err) {
            setError('Error uploading image. Please try again.');
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={classes.uploadSection}>
            <h2 className={classes.uploadTitle}>Upload New Image</h2>
            
            <form onSubmit={handleSubmit} className={classes.uploadForm}>
                <div 
                    className={`${classes.dropZone} ${dragActive ? classes.dragActive : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileInput}
                        className={classes.fileInput}
                    />
                    
                    {file ? (
                        <div className={classes.fileSelected}>
                            {file.type.startsWith('video/') ? (
                                <video 
                                    src={URL.createObjectURL(file)} 
                                    className={classes.preview}
                                    controls
                                    muted
                                />
                            ) : (
                                <img 
                                    src={URL.createObjectURL(file)} 
                                    alt="Preview" 
                                    className={classes.preview}
                                />
                            )}
                            <p className={classes.fileName}>{file.name}</p>
                        </div>
                    ) : (
                        <div className={classes.dropContent}>
                            <div className={classes.uploadIcon}>📷🎥</div>
                            <p className={classes.dropText}>
                                Click or drag and drop an image or video here
                            </p>
                            <p className={classes.dropSubtext}>
                                Supports JPEG, PNG, GIF, WebP, MP4, WebM, MOV (max 50MB, videos max 15s)
                            </p>
                        </div>
                    )}
                </div>

                <div className={classes.formGroup}>
                    <label htmlFor="description" className={classes.label}>
                        Description (optional)
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={classes.textarea}
                        placeholder="Describe your image..."
                        rows="3"
                    />
                </div>

                {error && <div className={classes.error}>{error}</div>}
                {success && <div className={classes.success}>{success}</div>}

                <button 
                    type="submit" 
                    className={classes.uploadButton}
                    disabled={uploading || !file}
                >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
            </form>
        </div>
    );
};

export default UploadForm; 