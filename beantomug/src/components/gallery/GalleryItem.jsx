import React, { useState } from 'react';
import classes from './classes.module.css';
import { getApiConfig } from '../../utils/config';

const GalleryItem = ({ image, onImageClick, onDelete, canDelete = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this image?')) {
            if (onDelete) {
                onDelete(image.post_id || image.id);
            }
        }
    };

    const handleImageClick = () => {
        if (onImageClick) {
            onImageClick(image);
        }
    };

    // Construct full URL using getApiConfig
    const imageUrl = `${getApiConfig().baseURL}${image['photo-url']}`;

    return (
        <div 
            className={classes.item}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleImageClick}
        >
            <div className={classes.imageContainer}>
                {!imageLoaded && !imageError && (
                    <div className={classes.loading}>
                        <div className={classes.spinner}></div>
                    </div>
                )}
                
                {imageError ? (
                    <div className={classes.errorPlaceholder}>
                        <div className={classes.errorIcon}>📷</div>
                        <p>Media not found</p>
                    </div>
                ) : image['file_type'] && image['file_type'].startsWith('video/') ? (
                    <video
                        src={imageUrl}
                        className={`${classes.image} ${classes.video}`}
                        onLoadedData={handleImageLoad}
                        onError={handleImageError}
                        loading="lazy"
                        muted
                        loop
                        playsInline
                    />
                ) : (
                    <img
                        src={imageUrl}
                        alt={image.description || 'Gallery image'}
                        className={`${classes.image} ${imageLoaded ? classes.loaded : ''}`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        loading="lazy"
                    />
                )}
                
                {isHovered && (
                    <div className={classes.overlay}>
                        <div className={classes.overlayContent}>
                            {image.description && (
                                <p className={classes.description}>{image.description}</p>
                            )}
                            {canDelete && (
                                <button 
                                    className={classes.deleteButton}
                                    onClick={handleDeleteClick}
                                    title="Delete image"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {image.description && (
                <div className={classes.itemInfo}>
                    <p className={classes.itemDescription}>{image.description}</p>
                </div>
            )}
        </div>
    );
};

export default GalleryItem; 